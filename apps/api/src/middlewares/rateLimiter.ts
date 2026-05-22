import rateLimit from 'express-rate-limit';

// Global API Limiter (100 requests per minute per IP)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100,
  message: { success: false, error: { message: 'Too many requests. Please try again later.' } }
});

// Auth Limiter (5 requests per minute per IP)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: { message: 'Too many authentication attempts. Please wait a minute.' } }
});

// OTP Limiter (3 requests per 5 minutes per Email)
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 3,
  // 🚀 FIX: Lock the rate limit to the user's email so they can't bypass it by changing IPs
  keyGenerator: (req) => req.body.email || req.ip, 
  message: { success: false, error: { message: 'Maximum OTP requests reached. Please wait 5 minutes.' } }
});