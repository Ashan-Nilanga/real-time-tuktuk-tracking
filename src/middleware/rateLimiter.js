import rateLimit from 'express-rate-limit';


export const pingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  keyGenerator: (req) => {
    // Use user ID from JWT if available, otherwise fall back to IP
    return req.user ? `device-${req.user.id}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many location pings. Maximum 60 per minute per device.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});


export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});
