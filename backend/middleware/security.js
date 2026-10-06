const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
  },
});

const attendanceLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    error: "ATTENDANCE_RATE_LIMIT",
    message: "Too many attendance attempts. Please wait before trying again.",
  },
});

module.exports = {
  apiLimiter,
  attendanceLimiter,
};
