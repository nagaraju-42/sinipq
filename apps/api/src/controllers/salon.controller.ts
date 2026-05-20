import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../AppError';

// --- CREATE A NEW SALON ---
export const createSalon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address } = req.body;
    
    // We know req.user exists because this route will be protected by our middleware
    const ownerId = req.user!.userId;

    if (!name || !address) {
      throw new AppError('Salon name and address are required', 400);
    }

    // Ensure the owner doesn't already have a salon registered
    const existingSalon = await prisma.salon.findFirst({ where: { ownerId } });
    if (existingSalon) {
      throw new AppError('You already have a registered salon', 409);
    }

    // Save the new salon to the database
    const salon = await prisma.salon.create({
      data: {
        name,
        address,
        ownerId
      }
    });

    res.status(201).json({ success: true, salon });
  } catch (error) {
    next(error);
  }
};

// --- GET MY SALON ---
export const getMySalon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user!.userId;

    // Find the salon and include all the staff (barbers) working there
    const salon = await prisma.salon.findFirst({
      where: { ownerId },
      include: {
        barbers: {
          include: {
            // We use 'select' here to ensure we NEVER accidentally send password hashes back
            user: {
              select: { id: true, name: true, phone: true, role: true } 
            }
          }
        }
      }
    });

    if (!salon) {
      throw new AppError('No salon found for this owner', 404);
    }

    res.status(200).json({ success: true, salon });
  } catch (error) {
    next(error);
  }
};