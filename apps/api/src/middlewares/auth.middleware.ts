import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../AppError';

// 1. Tell TypeScript that we are adding a 'user' object to the standard Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

// 2. The Middleware Function
export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized, no token provided', 401); // AUTH_TOKEN_INVALID
    }

    const token = authHeader.split(' ')[1];

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is missing in environment variables');
    }

    const decoded = jwt.verify(token, secret) as { userId: string; role: string };

    req.user = decoded;
    next();
  } catch (error: any) {
    // 🚀 FIX: We explicitly catch expired tokens so the frontend knows to silently refresh it
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401)); // AUTH_TOKEN_EXPIRED
    } else {
      next(new AppError('Not authorized, token failed', 401)); // AUTH_TOKEN_INVALID
    }
  }
};

// 3. Role Authorization Middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: You do not have permission', 403));
    }
    next();
  };
};
// --- TOKEN REFRESH & ROTATION ---
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    
    if (!token) {
      throw new AppError('No refresh token provided', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing in environment');

    // Verify the old refresh token
    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError('User not found', 401);

    // 🚀 Refresh Token Rotation: Issue a brand new set of tokens
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    // If the refresh token is tampered with or expired, clear the cookie
    res.clearCookie('refreshToken');
    next(new AppError('Session expired. Please log in again.', 401));
  }
};

// --- LOGOUT ---
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    // In a production environment, you might also add the old token to a Redis blacklist here
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// --- PASSWORD RECOVERY ---
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security: Do not reveal if the email exists. Always return success.
      return res.status(200).json({ success: true, message: 'If an account exists, a reset OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`reset_otp:${email}`, 300, otp);

    console.log(`[DEV] Password Reset OTP for ${email} is ${otp}`);

    res.status(200).json({ success: true, message: 'If an account exists, a reset OTP has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      throw new AppError('Email, OTP, and new password are required', 400);
    }

    const storedOtp = await redis.get(`reset_otp:${email}`);
    
    if (!storedOtp || storedOtp !== otp) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    await redis.del(`reset_otp:${email}`);

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};