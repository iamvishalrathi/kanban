const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisService = require('../services/redisService');

// Store rate limiter instances
let rateLimiters = {};

// Create rate limiters with Redis store (lazy initialization)
const createRateLimiter = (name, points, duration, blockDuration = duration) => {
  if (!rateLimiters[name]) {
    rateLimiters[name] = new RateLimiterRedis({
      storeClient: redisService.getClient(),
      keyPrefix: `rl_${name}`,
      points, // Number of requests
      duration, // Per duration in seconds
      blockDuration, // Block for duration in seconds
      execEvenly: true,
    });
  }
  return rateLimiters[name];
};

// Middleware wrapper for rate limiters
const createRateLimitMiddleware = (limiterName, points, duration, blockDuration, message) => {
  return async (req, res, next) => {
    try {
      // Ensure Redis is connected before creating limiter
      if (!redisService.isConnected()) {
        return next(); // Skip rate limiting if Redis is not available
      }

      const limiter = createRateLimiter(limiterName, points, duration, blockDuration);
      const key = req.ip || req.connection.remoteAddress;
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later.',
        retryAfter: secs,
      });
    }
  };
};

// Export middleware functions
const limiter = createRateLimitMiddleware(
  'general',
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // per 15 minutes (900 seconds)
  undefined,
  'Too many requests from this IP, please try again later.'
);

const authLimiter = createRateLimitMiddleware(
  'auth',
  parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5, // 5 attempts
  parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) / 1000 || 900, // per 15 minutes
  undefined,
  'Too many authentication attempts, please try again later.'
);

const cardCreationLimit = createRateLimitMiddleware(
  'card_creation',
  20, // 20 cards
  5 * 60, // per 5 minutes
  undefined,
  'Too many cards created, please wait before creating more.'
);

const commentCreationLimit = createRateLimitMiddleware(
  'comment_creation',
  10, // 10 comments
  60, // per 1 minute
  undefined,
  'Too many comments posted, please wait before commenting again.'
);

const boardCreationLimit = createRateLimitMiddleware(
  'board_creation',
  5, // 5 boards
  60 * 60, // per 1 hour
  undefined,
  'Too many boards created, please wait before creating more.'
);

// Initialize rate limiters (setup Redis connection)
async function initializeRateLimiters() {
  try {
    // Ensure Redis connection is established
    if (!redisService.isConnected()) {
      await redisService.connect();
    }
    console.log('Rate limiters initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize rate limiters:', error);
    // Don't throw error to allow server to start without Redis
    return false;
  }
}

module.exports = {
  limiter,
  authLimiter,
  cardCreationLimit,
  commentCreationLimit,
  boardCreationLimit,
  initializeRateLimiters,
};
