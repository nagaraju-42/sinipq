import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AppError } from '../AppError';

import { io } from '../sockets/socket';
import { sendQueueConfirmationEmail } from '../utils/email'; 

// --- JOIN THE QUEUE ---
export const joinQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId } = req.body;
    const customerId = req.user!.userId; 

    if (!barberId) {
      throw new AppError('Barber ID is required', 400);
    }

    const barber = await prisma.barber.findUnique({ 
      where: { id: barberId },
      include: { user: true } 
    });
    
    if (!barber || !barber.isAvailable) {
      throw new AppError('Barber is not available right now', 400);
    }

    const customer = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const existingEntry = await prisma.queueEntry.findFirst({
      where: {
        customerId,
        status: { in: ['WAITING', 'SERVING'] } 
      }
    });

    if (existingEntry) {
      throw new AppError('You are already in a queue', 400);
    }

    const lastInLine = await prisma.queueEntry.findFirst({
      where: {
        barberId,
        status: { in: ['WAITING', 'SERVING'] } 
      },
      orderBy: {
        position: 'desc' 
      }
    });
    
    const position = lastInLine ? lastInLine.position + 1 : 1;

    const newEntry = await prisma.queueEntry.create({
      data: {
        customerId,
        barberId,
        salonId: barber.salonId,
        position,
        status: 'WAITING'
      }
    });

    io.to(barberId).emit('queue-updated', { action: 'join', newEntry });

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

// --- GET MY QUEUE STATUS ---
export const getMyQueueStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.userId;

    const myEntry = await prisma.queueEntry.findFirst({
      where: {
        customerId,
        status: { in: ['WAITING', 'SERVING'] } 
      },
      include: {
        barber: { include: { user: { select: { name: true } } } },
        salon: { select: { name: true } }
      }
    });

    if (!myEntry) {
      return res.status(200).json({ success: true, inQueue: false });
    }

    res.status(200).json({ success: true, inQueue: true, queueEntry: myEntry });
  } catch (error) {
    next(error);
  }
};

// --- GET BARBER QUEUE ---
export const getBarberQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId } = req.params;

    const queue = await prisma.queueEntry.findMany({
      where: {
        barberId,
        status: { in: ['WAITING', 'SERVING'] } 
      },
      orderBy: { position: 'asc' }, 
      include: {
        customer: { select: { name: true } }
      }
    });

    res.status(200).json({ success: true, queue });
  } catch (error) {
    next(error);
  }
};

// --- UPDATE QUEUE STATUS ---
export const updateQueueStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entryId } = req.params;
    const { status } = req.body; 

    if (!['SERVING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new AppError('Invalid status update', 400);
    }

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId }
    });

    if (!entry) {
      throw new AppError('Queue entry not found', 404);
    }

    const updatedEntry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status }
    });

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.queueEntry.updateMany({
        where: {
          barberId: entry.barberId,
          status: { in: ['WAITING', 'SERVING'] }, 
          position: { gt: entry.position } 
        },
        data: {
          position: { decrement: 1 }
        }
      });
    }

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
      history = await prisma.queueEntry.findMany({
        where: {
          customerId: userId,
          status: { in: ['COMPLETED', 'CANCELLED'] }
        },
        orderBy: { updatedAt: 'desc' }, 
        include: {
          barber: { include: { user: { select: { name: true } } } },
          salon: { select: { name: true } }
        }
      });
    } else if (role === 'BARBER' || role === 'OWNER') {
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

// 🚀 NEW: --- CLEAR ENTIRE QUEUE (EMERGENCY RESET) ---
export const clearBarberQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId } = req.params;

    // Instantly cancel everyone currently in the waiting area for this barber
    await prisma.queueEntry.updateMany({
      where: {
        barberId,
        status: { in: ['WAITING', 'SERVING'] }
      },
      data: { status: 'CANCELLED' }
    });

    io.to(barberId).emit('queue-updated', { action: 'status-update' });

    res.status(200).json({ success: true, message: 'Queue completely cleared.' });
  } catch (error) {
    next(error);
  }
};