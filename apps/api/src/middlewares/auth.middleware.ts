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
    // Check if the Authorization header exists and starts with "Bearer"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Not authorized, no token provided', 401);
    }

    // Extract the token (Remove "Bearer " from the string)
    const token = authHeader.split(' ')[1];

    // Verify the token using the secret key
    const secret = process.env.JWT_SECRET || 'fallback_super_secret_dev_key';
    const decoded = jwt.verify(token, secret) as { userId: string; role: string };

    // Attach the decoded user data to the request so the next function can use it
    req.user = decoded;

    // Pass control to the next function
    next();
  } catch (error) {
    next(new AppError('Not authorized, token failed', 401));
  }
};