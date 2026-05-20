import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../AppError';

// --- JOIN THE QUEUE ---
export const joinQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId } = req.body;
    
    // We know this exists because the route will be protected
    const customerId = req.user!.userId; 

    if (!barberId) {
      throw new AppError('Barber ID is required', 400);
    }

    // 1. Verify the barber exists and is currently accepting customers
    const barber = await prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber || !barber.isAvailable) {
      throw new AppError('Barber is not available right now', 400);
    }

    // 2. Prevent double-booking: Check if customer is already WAITING somewhere
    const existingEntry = await prisma.queueEntry.findFirst({
      where: {
        customerId,
        status: 'WAITING'
      }
    });

    if (existingEntry) {
      throw new AppError('You are already waiting in a queue', 400);
    }

    // 3. Calculate position: Count how many people are currently WAITING for this specific barber
    const waitingCount = await prisma.queueEntry.count({
      where: {
        barberId,
        status: 'WAITING'
      }
    });
    const position = waitingCount + 1;

    // 4. Create the official waitlist entry
    const newEntry = await prisma.queueEntry.create({
      data: {
        customerId,
        barberId,
        salonId: barber.salonId,
        position,
        status: 'WAITING'
      }
    });

    res.status(201).json({ success: true, queueEntry: newEntry });
  } catch (error) {
    next(error);
  }
};

// --- GET MY QUEUE STATUS (CUSTOMER VIEW) ---
export const getMyQueueStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.userId;

    const myEntry = await prisma.queueEntry.findFirst({
      where: {
        customerId,
        status: 'WAITING'
      },
      include: {
        barber: {
          include: { user: { select: { name: true } } }
        },
        salon: { select: { name: true } }
      }
    });

    if (!myEntry) {
      // It's perfectly normal to not be in a queue, so we return 200 instead of an error
      return res.status(200).json({ success: true, inQueue: false });
    }

    res.status(200).json({ success: true, inQueue: true, queueEntry: myEntry });
  } catch (error) {
    next(error);
  }
};

// --- GET BARBER QUEUE (BARBER/OWNER VIEW) ---
export const getBarberQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId } = req.params;

    const queue = await prisma.queueEntry.findMany({
      where: {
        barberId,
        status: 'WAITING'
      },
      // Order by who joined first
      orderBy: { createdAt: 'asc' }, 
      include: {
        customer: { select: { name: true } }
      }
    });

    res.status(200).json({ success: true, queue });
  } catch (error) {
    next(error);
  }
};