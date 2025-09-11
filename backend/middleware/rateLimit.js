const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const redisService = require('../services/redisService');

// Rate limiters for different operations
let authLimiter, apiLimiter, websocketLimiter;

const initializeRateLimiters = async () => {
  const redisClient = redisService.client;
  
  // Use Redis if available, otherwise fall back to memory
  const limiterOptions = redisService.isConnected 
    ? { storeClient: redisClient } 
    : {};

  const LimiterClass = redisService.isConnected ? RateLimiterRedis : RateLimiterMemory;

  // Authentication rate limiter - stricter limits
  authLimiter = new LimiterClass({
    ...limiterOptions,
    keyPrefix: 'auth_limiter',
    points: 5, // 5 attempts
    duration: 900, // per 15 minutes
    blockDuration: 900, // block for 15 minutes
  });

  // General API rate limiter
  apiLimiter = new LimiterClass({
    ...limiterOptions,
    keyPrefix: 'api_limiter',
    points: 100, // 100 requests
    duration: 900, // per 15 minutes
    blockDuration: 60, // block for 1 minute
  });

  // WebSocket rate limiter
  websocketLimiter = new LimiterClass({
    ...limiterOptions,
    keyPrefix: 'ws_limiter',
    points: 200, // 200 messages
    duration: 60, // per minute
    blockDuration: 60, // block for 1 minute
  });
};

const createRateLimitMiddleware = (limiter, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip;
      
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      const totalHits = rejRes.totalHits || 0;
      const msBeforeNext = rejRes.msBeforeNext || 0;
      const remainingPoints = rejRes.remainingPoints || 0;

      res.set({
        'Retry-After': Math.round(msBeforeNext / 1000) || 1,
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext)
      });

      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: Math.round(msBeforeNext / 1000) || 1
      });
    }
  };
};

// Auth rate limiting middleware
const authRateLimit = createRateLimitMiddleware(
  null, // Will be set after initialization
  (req) => {
    // Use email or IP for auth attempts
    return req.body.email || req.ip;
  }
);

// API rate limiting middleware
const apiRateLimit = createRateLimitMiddleware(
  null, // Will be set after initialization
  (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.userId || req.ip;
  }
);

// WebSocket rate limiting function
const checkWebSocketRateLimit = async (socket) => {
  try {
    const key = socket.userId || socket.handshake.address;
    await websocketLimiter.consume(key);
    return true;
  } catch (rejRes) {
    return false;
  }
};

// Premium rate limiter for paid users (higher limits)
const createPremiumLimiter = () => {
  const limiterOptions = redisService.isConnected 
    ? { storeClient: redisService.client } 
    : {};

  const LimiterClass = redisService.isConnected ? RateLimiterRedis : RateLimiterMemory;

  return new LimiterClass({
    ...limiterOptions,
    keyPrefix: 'premium_limiter',
    points: 500, // 500 requests
    duration: 900, // per 15 minutes
    blockDuration: 30, // block for 30 seconds
  });
};

// Dynamic rate limiting based on user type
const dynamicRateLimit = async (req, res, next) => {
  try {
    let limiter = apiLimiter;
    let key = req.ip;

    if (req.user) {
      key = req.userId;
      
      // Use different limits for different user roles
      if (req.user.role === 'admin') {
        // Admins get higher limits
        const adminLimiter = new (redisService.isConnected ? RateLimiterRedis : RateLimiterMemory)({
          ...(redisService.isConnected ? { storeClient: redisService.client } : {}),
          keyPrefix: 'admin_limiter',
          points: 1000,
          duration: 900,
          blockDuration: 30,
        });
        limiter = adminLimiter;
      }
    }

    await limiter.consume(key);
    next();
  } catch (rejRes) {
    const msBeforeNext = rejRes.msBeforeNext || 0;
    const remainingPoints = rejRes.remainingPoints || 0;

    res.set({
      'Retry-After': Math.round(msBeforeNext / 1000) || 1,
      'X-RateLimit-Limit': limiter.points,
      'X-RateLimit-Remaining': remainingPoints,
      'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext)
    });

    return res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: Math.round(msBeforeNext / 1000) || 1
    });
  }
};

// Sliding window rate limiter for specific operations
const createSlidingWindowLimiter = (points, windowSizeMs, key) => {
  return async (req, res, next) => {
    try {
      const now = Date.now();
      const windowStart = now - windowSizeMs;
      const requestKey = typeof key === 'function' ? key(req) : key;
      
      // Store request timestamps in Redis
      if (redisService.isConnected) {
        const client = redisService.client;
        const redisKey = `sliding:${requestKey}`;
        
        // Remove old entries
        await client.zRemRangeByScore(redisKey, '-inf', windowStart);
        
        // Count current requests in window
        const currentCount = await client.zCard(redisKey);
        
        if (currentCount >= points) {
          const oldestEntry = await client.zRange(redisKey, 0, 0, { withScores: true });
          const resetTime = oldestEntry.length > 0 ? 
            windowStart + windowSizeMs - oldestEntry[0].score : windowSizeMs;
          
          res.set({
            'Retry-After': Math.ceil(resetTime / 1000),
            'X-RateLimit-Limit': points,
            'X-RateLimit-Remaining': 0,
            'X-RateLimit-Reset': new Date(now + resetTime)
          });
          
          return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil(resetTime / 1000)
          });
        }
        
        // Add current request
        await client.zAdd(redisKey, { score: now, value: `${now}:${Math.random()}` });
        await client.expire(redisKey, Math.ceil(windowSizeMs / 1000));
        
        res.set({
          'X-RateLimit-Limit': points,
          'X-RateLimit-Remaining': Math.max(0, points - currentCount - 1),
          'X-RateLimit-Reset': new Date(now + windowSizeMs)
        });
      }
      
      next();
    } catch (error) {
      console.error('Sliding window rate limit error:', error);
      next(); // Continue on error to avoid breaking the application
    }
  };
};

// Specific rate limiters for different operations
const boardCreationLimit = createSlidingWindowLimiter(
  10, // 10 boards
  24 * 60 * 60 * 1000, // per day
  (req) => `board_creation:${req.userId}`
);

const cardCreationLimit = createSlidingWindowLimiter(
  100, // 100 cards
  60 * 60 * 1000, // per hour
  (req) => `card_creation:${req.userId}`
);

const commentCreationLimit = createSlidingWindowLimiter(
  50, // 50 comments
  60 * 60 * 1000, // per hour
  (req) => `comment_creation:${req.userId}`
);

// Initialize rate limiters when the module is loaded
const initPromise = initializeRateLimiters().then(() => {
  // Set the actual limiters after initialization
  authRateLimit.limiter = authLimiter;
  apiRateLimit.limiter = apiLimiter;
}).catch(console.error);

module.exports = {
  initializeRateLimiters,
  authRateLimit: async (req, res, next) => {
    await initPromise;
    return createRateLimitMiddleware(authLimiter, (req) => req.body.email || req.ip)(req, res, next);
  },
  apiRateLimit: async (req, res, next) => {
    await initPromise;
    return createRateLimitMiddleware(apiLimiter, (req) => req.userId || req.ip)(req, res, next);
  },
  dynamicRateLimit,
  checkWebSocketRateLimit,
  boardCreationLimit,
  cardCreationLimit,
  commentCreationLimit,
  createSlidingWindowLimiter
};
