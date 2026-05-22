import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middlewares/rateLimiter';

// Standard default imports for files that haven't crashed
import authRoutes from './routes/auth.routes';
import salonRoutes from './routes/salon.routes';

// 🚀 FIX: Strict named imports for the two bugged routes
import { queueRouter } from './routes/queue.routes';
import { barberRouter } from './routes/barber.routes';

import { errorHandler } from './errorHandler';

const app = express();
// Apply Global Rate Limiting
app.use('/api', apiLimiter);

// Load Active Routes
app.use('/api/auth', authRouter);
app.use('/api/salons', salonRouter);
// ... your other routes
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(cookieParser()); // 🚀 Allows req.cookies to work
// Load Active Routes
app.use('/api/auth', authRoutes);
app.use('/api/salons', salonRoutes);

// 🚀 Load the Strict Routes
app.use('/api/queue', queueRouter);
app.use('/api/barbers', barberRouter); 

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// Error Handler
app.use(errorHandler);

export default app;