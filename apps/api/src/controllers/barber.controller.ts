import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../AppError';
import { hashPassword } from '../utils/jwt';

// 1. Fetches all barbers for the Dashboard
export const getBarbers = async (req: Request, res: Response) => {
  try {
    // 🚀 FIX: Query the barber table directly to secure the actual Barber ID
    const barbers = await prisma.barber.findMany({
      where: { isAvailable: true },
      // 🔗 Include the related user record to access profile details
      include: {
        user: { 
          select: { name: true, phone: true } 
        }
      }
    });

    // 🔄 Map the database structure to match your frontend's expected format
    const formattedBarbers = barbers.map(b => ({
      id: b.id, // This is now the valid Barber Profile ID, not the User ID!
      name: b.user.name,
      phone: b.user.phone
    }));

    res.json(formattedBarbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch barbers' });
  }
};

// 2. Adds a new barber to a specific salon
export const addBarberToSalon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salonId } = req.params; 
    const { name, phone, password } = req.body;
    const ownerId = req.user!.userId; 

    if (!name || !phone || !password) {
      throw new AppError('Name, phone, and password are required', 400);
    }

    const salon = await prisma.salon.findFirst({ 
      where: { id: salonId, ownerId: ownerId } 
    });

    if (!salon) {
      throw new AppError('Salon not found or you do not have permission to modify it', 404);
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      throw new AppError('Phone number is already registered', 409);
    }

    const passwordHash = await hashPassword(password);

    const newBarber = await prisma.barber.create({
      data: {
        salon: { connect: { id: salonId } },
        isAvailable: true,
        user: {
          create: { name, phone, passwordHash, role: 'BARBER' }
        }
      },
      include: {
        user: { select: { id: true, name: true, phone: true, role: true } }
      }
    });

    res.status(201).json({ success: true, barber: newBarber });
  } catch (error) {
    next(error);
  }
};