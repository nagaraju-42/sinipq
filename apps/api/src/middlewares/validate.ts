import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../AppError';

export const validate = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable string
        const errorMessages = error.errors.map(err => `${err.path[err.path.length - 1]}: ${err.message}`).join(', ');
        next(new AppError(`VALIDATION_ERROR: ${errorMessages}`, 400));
      } else {
        next(error);
      }
    }
  };
};