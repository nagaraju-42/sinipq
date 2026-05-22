import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../AppError';
import { redis } from '../lib/redis';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are strictly required', 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone || undefined } 
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) throw new AppError('Email is already registered', 409);
      if (existingUser.phone === phone) throw new AppError('Phone is already registered', 409);
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email, 
        phone,
        passwordHash,
        role: role || 'CUSTOMER',
        isVerified: false // 🔐 Account locked until OTP is confirmed
      }
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with a 300-second (5 minute) TTL
    await redis.setex(`otp:${email}`, 300, otp);

    // TODO: Connect Resend email utility here
    console.log(`[DEV] OTP for ${email} is ${otp}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify the OTP sent to your email.',
      userId: newUser.id
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    const lockoutKey = `lockout:${email}`;
    const otpKey = `otp:${email}`;
    const attemptsKey = `attempts:${email}`;

    // 1. Check if account is temporarily locked
    const isLocked = await redis.get(lockoutKey);
    if (isLocked) {
      throw new AppError('Maximum attempts reached. Account locked for 10 minutes.', 429);
    }

    // 2. Fetch the OTP
    const storedOtp = await redis.get(otpKey);
    if (!storedOtp) {
      throw new AppError('OTP expired or not found', 400); // AUTH_OTP_EXPIRED
    }

    // 3. Handle incorrect OTP and attempts
    if (storedOtp !== otp) {
      const attempts = await redis.incr(attemptsKey);
      if (attempts === 1) await redis.expire(attemptsKey, 300); 

      if (attempts >= 3) {
        await redis.setex(lockoutKey, 600, 'locked'); // Lock for 10 minutes
        await redis.del(otpKey, attemptsKey);
        throw new AppError('Maximum attempts reached. Account locked for 10 minutes.', 429);
      }
      throw new AppError('Invalid OTP', 400); // AUTH_INVALID_OTP
    }

    // 4. Success: Verify user and clean up Redis
    await prisma.user.update({
      where: { email },
      data: { isVerified: true }
    });
    
    await redis.del(otpKey, attemptsKey);

    res.status(200).json({ success: true, message: 'Account verified successfully.' });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('User is already verified', 400);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`otp:${email}`, 300, otp);
    await redis.del(`attempts:${email}`); // Reset failed attempts

    console.log(`[DEV] New OTP for ${email} is ${otp}`);

    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch(error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required to log in', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isVerified) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    // Set HttpOnly Secure Cookie for the Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (error) {
    next(error);
  }
};