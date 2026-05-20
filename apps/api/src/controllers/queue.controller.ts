import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../AppError';

import { io } from '../sockets/socket';
import { sendQueueConfirmationEmail } from '../utils/email'; // day-7 email utility

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
    const barber = await prisma.barber.findUnique({ 
      where: { id: barberId },
      include: { user: true } 
    });
    
    if (!barber || !barber.isAvailable) {
      throw new AppError('Barber is not available right now', 400);
    }

    // 2. Fetch the customer's details so we have their email address
    const customer = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // 3. Prevent double-booking: Check if customer is already WAITING somewhere
    const existingEntry = await prisma.queueEntry.findFirst({
      where: {
        customerId,
        status: 'WAITING'
      }
    });

    if (existingEntry) {
      throw new AppError('You are already waiting in a queue', 400);
    }

    // 4. Calculate position: Count how many people are currently WAITING for this specific barber
    const waitingCount = await prisma.queueEntry.count({
      where: {
        barberId,
        status: 'WAITING'
      }
    });
    const position = waitingCount + 1;

    // 5. Create the official waitlist entry
    const newEntry = await prisma.queueEntry.create({
      data: {
        customerId,
        barberId,
        salonId: barber.salonId,
        position,
        status: 'WAITING'
      }
    });

    // 📢 DAY-6: Broadcast real-time update to everyone listening to this specific barber's room
    io.to(barberId).emit('queue-updated', { action: 'join', newEntry });

    // 👀 ADD THIS DEBUG LOG:
    console.log("🔍 DEBUG EMAIL CHECK:", { 
      hasEmail: customer.email, 
      hasBarberUser: barber.user ? barber.user.name : 'Missing Barber User' 
    });

    // 📧 DAY-7: Fire off the confirmation email in the background!
    if (customer.email && barber.user) {
      sendQueueConfirmationEmail(
        customer.email, 
        customer.name, 
        barber.user.name, 
        position
      );
    }

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

// --- UPDATE QUEUE STATUS (MOVING THE LINE) ---
export const updateQueueStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const { status } = req.body; // Expecting 'SERVING' or 'COMPLETED'

    if (!['SERVING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new AppError('Invalid status update', 400);
    }

    // 1. Find the current entry so we know which Barber's line we are modifying
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId }
    });

    if (!entry) {
      throw new AppError('Queue entry not found', 404);
    }

    // 2. Update the status of the specific customer
    const updatedEntry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status }
    });

    // 3. If they are done, shift everyone else behind them forward by 1
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.queueEntry.updateMany({
        where: {
          barberId: entry.barberId,
          status: 'WAITING',
          position: { gt: entry.position } // Only move people behind them
        },
        data: {
          position: { decrement: 1 }
        }
      });
    }

    // 4. Broadcast to the waiting room that the line just moved!
    io.to(entry.barberId).emit('queue-updated', { action: 'status-update' });

    res.status(200).json({ success: true, queueEntry: updatedEntry });
  } catch (error) {
    next(error);
  }
};

// --- GET QUEUE HISTORY ---
export const getQueueHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, userId } = req.user!;
    let history;

    if (role === 'CUSTOMER') {
      // Customers see their own past appointments
      history = await prisma.queueEntry.findMany({
        where: {
          customerId: userId,
          status: { in: ['COMPLETED', 'CANCELLED'] }
        },
        orderBy: { updatedAt: 'desc' }, // Newest first
        include: {
          barber: { include: { user: { select: { name: true } } } },
          salon: { select: { name: true } }
        }
      });
    } else if (role === 'BARBER' || role === 'OWNER') {
      // Barbers/Owners see the history for a specific barber
      const { barberId } = req.params;
      
      if (!barberId) {
        throw new AppError('Barber ID is required in the URL for this role', 400);
      }

      history = await prisma.queueEntry.findMany({
        where: {
          barberId,
          status: { in: ['COMPLETED', 'CANCELLED'] }
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { name: true, phone: true } }
        }
      });
    }

    res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};