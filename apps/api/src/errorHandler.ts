import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If it's a known error we threw on purpose
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // If it's an unexpected bug/crash
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred',
    },
  });
};