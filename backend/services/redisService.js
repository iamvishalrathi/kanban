const { Redis } = require('@upstash/redis');
require('dotenv').config();

class RedisService {
  constructor() {
    this.client = null;
    this._isConnected = false;
  }

  async connect() {
    // Check if Redis is disabled
    if (process.env.REDIS_ENABLED === 'false') {
      console.log('🟡 Redis disabled in configuration - skipping connection');
      return null;
    }

    // Check if Upstash credentials are available
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.log('🟡 Upstash Redis credentials not found - skipping connection');
      console.log('Please add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your .env file');
      return null;
    }

    try {
      console.log('🔄 Connecting to Upstash Redis...');
      this.client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      // Test the connection
      await this.client.set('test:connection', 'success');
      const result = await this.client.get('test:connection');
      await this.client.del('test:connection');
      
      if (result === 'success') {
        this._isConnected = true;
        console.log('✅ Connected to Upstash Redis');
        return this.client;
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      console.error('🔴 Failed to connect to Upstash Redis:', error.message);
      this._isConnected = false;
      console.log('🟡 Server will continue without Redis (some features may be limited)');
      return null;
    }
  }

  async disconnect() {
    // Upstash Redis doesn't need explicit disconnection (it's REST-based)
    this._isConnected = false;
  }

  // Get Redis client instance
  getClient() {
    return this.client;
  }

  // Check if Redis is connected
  isConnected() {
    if (process.env.REDIS_ENABLED === 'false') {
      return false;
    }
    return this._isConnected && this.client;
  }

  // Presence Management
  async setUserPresence(boardId, userId, userData) {
    try {
      if (!this.isConnected()) return;

      const key = `presence:${boardId}`;
      const value = JSON.stringify({
        ...userData,
        lastSeen: Date.now()
      });

      await this.client.hset(key, { [userId]: value });
      await this.client.expire(key, 3600);
    } catch (error) {
      console.warn('Redis setUserPresence failed:', error.message);
    }
  }

  async removeUserPresence(boardId, userId) {
    try {
      if (!this.isConnected()) return;

      const key = `presence:${boardId}`;
      await this.client.hdel(key, userId);
    } catch (error) {
      console.warn('Redis removeUserPresence failed:', error.message);
    }
  }

  async getBoardPresence(boardId) {
    try {
      if (!this.isConnected()) return {};

      const key = `presence:${boardId}`;
      const presence = await this.client.hgetall(key) || {};

      // Parse JSON values and filter out stale entries
      const now = Date.now();
      const activePresence = {};

      for (const [userId, userData] of Object.entries(presence)) {
        try {
          const parsed = JSON.parse(userData);
          // Consider user offline if last seen > 5 minutes ago
          if (now - parsed.lastSeen < 300000) {
            activePresence[userId] = parsed;
          } else {
            // Clean up stale entries
            await this.client.hdel(key, userId);
          }
        } catch (error) {
          console.error('Error parsing presence data:', error);
          await this.client.hdel(key, userId);
        }
      }

      return activePresence;
    } catch (error) {
      console.warn('Redis getBoardPresence failed:', error.message);
      return {};
    }
  }

  // Optimistic Locking
  async acquireLock(resource, userId, ttl = 30000) {
    try {
      if (!this.isConnected()) return null;

      const lockKey = `lock:${resource}`;
      const lockValue = `${userId}:${Date.now()}`;

      // Upstash Redis set with NX (not exists) and PX (expire in milliseconds)
      const result = await this.client.set(lockKey, lockValue, { px: ttl, nx: true });
      
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      console.warn('Redis acquireLock failed:', error.message);
      return null;
    }
  }

  async releaseLock(resource, lockValue) {
    try {
      if (!this.isConnected()) return;

      const lockKey = `lock:${resource}`;
      
      // For Upstash, we can use a Lua script or check and delete
      const currentValue = await this.client.get(lockKey);
      if (currentValue === lockValue) {
        await this.client.del(lockKey);
      }
    } catch (error) {
      console.warn('Redis releaseLock failed:', error.message);
    }
  }

  async isLocked(resource) {
    try {
      if (!this.isConnected()) return false;

      const lockKey = `lock:${resource}`;
      const lockValue = await this.client.get(lockKey);
      return !!lockValue;
    } catch (error) {
      console.warn('Redis isLocked failed:', error.message);
      return false;
    }
  }

  // Caching
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected()) return;

      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.warn('Redis set failed:', error.message);
    }
  }

  async get(key) {
    try {
      if (!this.isConnected()) return null;

      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        console.error('Error parsing cached value:', parseError);
        return null;
      }
    } catch (error) {
      console.warn('Redis get failed:', error.message);
      return null;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected()) return;
      await this.client.del(key);
    } catch (error) {
      console.warn('Redis del failed:', error.message);
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected()) return false;
      return await this.client.exists(key);
    } catch (error) {
      console.warn('Redis exists failed:', error.message);
      return false;
    }
  }

  // Typing indicators
  async setTypingIndicator(boardId, cardId, userId, isTyping) {
    try {
      if (!this.isConnected()) return;

      const key = `typing:${boardId}:${cardId}`;

      if (isTyping) {
        await this.client.hset(key, { [userId]: Date.now().toString() });
        await this.client.expire(key, 30); // 30 seconds TTL
      } else {
        await this.client.hdel(key, userId);
      }
    } catch (error) {
      console.warn('Redis setTypingIndicator failed:', error.message);
    }
  }

  async getTypingIndicators(boardId, cardId) {
    try {
      if (!this.isConnected()) return {};

      const key = `typing:${boardId}:${cardId}`;
      const indicators = await this.client.hgetall(key) || {};

      // Filter out stale indicators (older than 10 seconds)
      const now = Date.now();
      const activeIndicators = {};

      for (const [userId, timestamp] of Object.entries(indicators)) {
        if (now - parseInt(timestamp) < 10000) {
          activeIndicators[userId] = true;
        } else {
          await this.client.hdel(key, userId);
        }
      }

      return activeIndicators;
    } catch (error) {
      console.warn('Redis getTypingIndicators failed:', error.message);
      return {};
    }
  }

  // Board activity tracking
  async trackBoardActivity(boardId, userId, action) {
    try {
      if (!this.isConnected()) return;

      const key = `activity:${boardId}`;
      const activity = {
        userId,
        action,
        timestamp: Date.now()
      };

      await this.client.lpush(key, JSON.stringify(activity));
      await this.client.ltrim(key, 0, 99); // Keep last 100 activities
      await this.client.expire(key, 86400); // 24 hours TTL
    } catch (error) {
      console.warn('Redis trackBoardActivity failed:', error.message);
    }
  }

  async getBoardActivity(boardId, limit = 50) {
    try {
      if (!this.isConnected()) return [];

      const key = `activity:${boardId}`;
      const activities = await this.client.lrange(key, 0, limit - 1) || [];

      return activities.map(activity => {
        try {
          return JSON.parse(activity);
        } catch (error) {
          console.error('Error parsing activity:', error);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.warn('Redis getBoardActivity failed:', error.message);
      return [];
    }
  }

  // Rate limiting support
  async incrementCounter(key, window = 3600, limit = 100) {
    try {
      if (!this.isConnected()) return { count: 0, remaining: limit, resetTime: Date.now() + window * 1000 };

      // Simple counter implementation for Upstash
      const current = await this.client.get(key);
      
      if (!current) {
        await this.client.setex(key, window, "1");
        return {
          count: 1,
          remaining: limit - 1,
          resetTime: Date.now() + window * 1000
        };
      } else {
        const count = await this.client.incr(key);
        const ttl = await this.client.ttl(key);
        
        return {
          count: count,
          remaining: Math.max(0, limit - count),
          resetTime: Date.now() + ttl * 1000
        };
      }
    } catch (error) {
      console.warn('Redis incrementCounter failed:', error.message);
      return { count: 0, remaining: limit, resetTime: Date.now() + window * 1000 };
    }
  }

  // Health check method
  async ping() {
    try {
      if (!this.client || !this._isConnected) {
        throw new Error('Redis not connected');
      }
      await this.client.set('test:ping', 'pong');
      const result = await this.client.get('test:ping');
      await this.client.del('test:ping');
      return result === 'pong';
    } catch (error) {
      console.warn('Redis ping failed:', error.message);
      return false;
    }
  }
}

module.exports = new RedisService();
