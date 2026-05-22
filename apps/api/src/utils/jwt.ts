import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// 1. Password Hashing Utility (Upgraded to 12 salt rounds for production security)
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// 2. Password Verification Utility
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// 3. Access Token (Short-lived: 15 minutes)
export const generateAccessToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing in environment variables');
  
  return jwt.sign(
    { userId, role }, 
    secret, 
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' } 
  );
};

// 4. Refresh Token (Long-lived: 7 days)
export const generateRefreshToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing in environment variables');
  
  return jwt.sign(
    { userId, role }, 
    secret, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' } 
  );
};