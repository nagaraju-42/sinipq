import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../AppError';
import { hashPassword } from '../utils/jwt';

export const addBarberToSalon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params; // We get this from the URL
    const { name, phone, password } = req.body;
    const ownerId = req.user!.userId;

    if (!name || !phone || !password) {
      throw new AppError('Name, phone, and password are required', 400);
    }

    // 1. Verify the salon exists AND belongs to the person making the request
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) {
      throw new AppError('Salon not found', 404);
    }
    if (salon.ownerId !== ownerId) {
      throw new AppError('Forbidden: You do not own this salon', 403);
    }

    // 2. Ensure the phone number isn't already taken
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      throw new AppError('Phone number is already registered', 409);
    }

    // 3. Hash the new barber's password using our security lockbox
    const passwordHash = await hashPassword(password);

    // 4. The Magic: Create the Barber profile AND the User account in one atomic step!
// 4. The Magic: Create the Barber profile AND the User account in one atomic step!
    const newBarber = await prisma.barber.create({
      data: {
        salon: { connect: { id: salonId } }, // <-- This is the fixed line!
        isAvailable: true,
        user: {
          create: {
            name,
            phone,
            passwordHash,
            role: 'BARBER'
          }
        }
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, role: true }
        }
      }
    });

    res.status(201).json({ success: true, barber: newBarber });
  } catch (error) {
    next(error);
  }
};