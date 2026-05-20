import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// 1. Password Hashing Utility
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// 2. Password Verification Utility
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// 3. Token Generation Utility
export const generateToken = (userId: string, role: string): string => {
  // We use a fallback secret just for local development if the .env is missing it
  const secret = process.env.JWT_SECRET || 'fallback_super_secret_dev_key';
  
  return jwt.sign(
    { userId, role }, 
    secret, 
    { expiresIn: '7d' } // Users stay logged in for 7 days
  );
};