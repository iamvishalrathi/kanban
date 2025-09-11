const redis = require('redis');
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
    
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            // Limit retries for free tier to prevent infinite loops
            if (retries >= 3) {
              console.log('🛑 Max Redis retries reached, stopping reconnection attempts');
              return false; // Stop trying to reconnect
            }
            const delay = Math.min(retries * 5000, 15000); // 5s, 10s, 15s
            console.log(`🔄 Redis reconnect attempt ${retries}/3, waiting ${delay}ms`);
            return delay;
          },
          connectTimeout: 15000, // Increased to 15 seconds for slow networks
          lazyConnect: true, // Don't auto-connect on creation
          family: 0, // Try both IPv4 and IPv6
          keepAlive: true,
          noDelay: true,
        },
        // Add retry configuration for commands
        retryDelayOnFailover: 500,
        maxRetriesPerRequest: 3,
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 500,
        enableReadyCheck: false,
        lazyConnect: true,
      });

      // Suppress repetitive socket error logs
      this.client.on('error', (err) => {
        if (err.message.includes('SocketClosedUnexpectedlyError')) {
          // Only log every 10th socket error to reduce noise
          if (!this.socketErrorCount) this.socketErrorCount = 0;
          this.socketErrorCount++;
          if (this.socketErrorCount % 10 === 1) {
            console.warn(`🟡 Redis socket disconnected (${this.socketErrorCount} times) - this is normal for free tier`);
          }
        } else {
          console.error('🔴 Redis Client Error:', err.message);
        }
        this._isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🟢 Redis Client Connected');
        this._isConnected = true;
        this.socketErrorCount = 0; // Reset error count on successful connection
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this._isConnected = true;
      });

      this.client.on('end', () => {
        console.log('🔴 Redis Client Disconnected');
        this._isConnected = false;
      });

      // Add connection timeout with better error handling
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout after 8 seconds')), 8000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      console.log('🎉 Redis connection established successfully');
      return this.client;
    } catch (error) {
      console.error('🔴 Failed to connect to Redis:', error.message);
      this._isConnected = false;
      // For free tier, connection failures are common - allow server to continue
      console.log('🟡 Server will continue without Redis (some features may be limited)');
      return null;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
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
    return this._isConnected && this.client && this.client.isReady;
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
      
      await this.client.hSet(key, userId, value);
      await this.client.expire(key, 3600); // 1 hour TTL
    } catch (error) {
      console.warn('Redis setUserPresence failed:', error.message);
    }
  }

  async removeUserPresence(boardId, userId) {
    try {
      if (!this.isConnected()) return;
      
      const key = `presence:${boardId}`;
      await this.client.hDel(key, userId);
    } catch (error) {
      console.warn('Redis removeUserPresence failed:', error.message);
    }
  }

  async getBoardPresence(boardId) {
    try {
      if (!this.isConnected()) return {};
      
      const key = `presence:${boardId}`;
      const presence = await this.client.hGetAll(key);
      
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
            await this.client.hDel(key, userId);
          }
        } catch (error) {
          console.error('Error parsing presence data:', error);
          await this.client.hDel(key, userId);
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
      
      const result = await this.client.set(lockKey, lockValue, {
        PX: ttl,
        NX: true
      });
      
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
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      await this.client.eval(script, {
        keys: [lockKey],
        arguments: [lockValue]
      });
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
        await this.client.setEx(key, ttl, serializedValue);
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
        await this.client.hSet(key, userId, Date.now().toString());
        await this.client.expire(key, 30); // 30 seconds TTL
      } else {
        await this.client.hDel(key, userId);
      }
    } catch (error) {
      console.warn('Redis setTypingIndicator failed:', error.message);
    }
  }

  async getTypingIndicators(boardId, cardId) {
    try {
      if (!this.isConnected()) return {};
      
      const key = `typing:${boardId}:${cardId}`;
      const indicators = await this.client.hGetAll(key);
      
      // Filter out stale indicators (older than 10 seconds)
      const now = Date.now();
      const activeIndicators = {};
      
      for (const [userId, timestamp] of Object.entries(indicators)) {
        if (now - parseInt(timestamp) < 10000) {
          activeIndicators[userId] = true;
        } else {
          await this.client.hDel(key, userId);
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
      
      await this.client.lPush(key, JSON.stringify(activity));
      await this.client.lTrim(key, 0, 99); // Keep last 100 activities
      await this.client.expire(key, 86400); // 24 hours TTL
    } catch (error) {
      console.warn('Redis trackBoardActivity failed:', error.message);
    }
  }

  async getBoardActivity(boardId, limit = 50) {
    try {
      if (!this.isConnected()) return [];
      
      const key = `activity:${boardId}`;
      const activities = await this.client.lRange(key, 0, limit - 1);
      
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
      
      const script = `
        local current = redis.call("GET", KEYS[1])
        if current == false then
          redis.call("SETEX", KEYS[1], ARGV[2], 1)
          return {1, ARGV[1] - 1, ARGV[2]}
        else
          local count = redis.call("INCR", KEYS[1])
          local ttl = redis.call("TTL", KEYS[1])
          return {count, ARGV[1] - count, ttl}
        end
      `;
      
      const result = await this.client.eval(script, {
        keys: [key],
        arguments: [limit.toString(), window.toString()]
      });
      
      return {
        count: parseInt(result[0]),
        remaining: Math.max(0, parseInt(result[1])),
        resetTime: Date.now() + parseInt(result[2]) * 1000
      };
    } catch (error) {
      console.warn('Redis incrementCounter failed:', error.message);
      return { count: 0, remaining: limit, resetTime: Date.now() + window * 1000 };
    }
  }
}

module.exports = new RedisService();
