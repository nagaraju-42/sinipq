import { Router } from 'express';
import { 
  register, login, verifyOtp, resendOtp, 
  refresh, logout, forgotPassword, resetPassword 
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter';
import { 
  registerSchema, loginSchema, otpSchema, 
  emailOnlySchema, resetPasswordSchema 
} from '../modules/auth/auth.schema';

export const authRouter = Router();

// --- Registration & Login (Max 5 per minute) ---
authRouter.post('/register', authLimiter, validate(registerSchema), register);
authRouter.post('/login', authLimiter, validate(loginSchema), login);

// --- OTP Verification & Requests (Max 3 per 5 mins) ---
authRouter.post('/verify-otp', otpLimiter, validate(otpSchema), verifyOtp);
authRouter.post('/resend-otp', otpLimiter, validate(emailOnlySchema), resendOtp);
authRouter.post('/forgot-password', otpLimiter, validate(emailOnlySchema), forgotPassword);

// --- Password Reset ---
authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// --- Session Management (Tokens) ---
authRouter.post('/refresh', refresh); 
authRouter.post('/logout', logout);