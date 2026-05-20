import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/jwt';
import { AppError } from '../AppError';

// --- REGISTER ROUTE ---
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, name, password, role , email} = req.body;

    // 1. Validate input
    if (!phone || !name || !password || !email) {
      throw new AppError('Phone, name, password, and email are required', 400);
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      throw new AppError('Phone number is already registered', 409);
    }

    // 3. Secure the password
    const passwordHash = await hashPassword(password);

    // 4. Save to Database
    const user = await prisma.user.create({
      data: {
        phone,
        name,
        passwordHash,
        role: role || 'CUSTOMER', // Default to customer if not provided
        email
      },
    });

    // 5. Generate their digital ID badge
    const token = generateToken(user.id, user.role);

    // 6. Return success (CRITICAL: Never return the passwordHash!)
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error); // Passes error to the global handler we built on Day 1
  }
};

// --- LOGIN ROUTE ---
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      throw new AppError('Phone and password are required', 400);
    }

    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // 2. Verify the password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // 3. Generate a fresh ID badge
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};