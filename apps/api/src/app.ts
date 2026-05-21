import cors from 'cors';
import queueRoutes from './routes/queue.routes';
import salonRoutes from './routes/salon.routes';
import authRoutes from './routes/auth.routes';

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './errorHandler';

const app = express();
// app.use(cors({
//   origin: 'http://localhost:5173', // Your Vite frontend
//   credentials: true
// }));
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true
// }));
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
// Middlewares
app.use(helmet());
// app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(compression());
app.use(express.json());

app.use('/api/auth', authRoutes);//day-3
app.use('/api/salons', salonRoutes);//day-4 salon routes
app.use('/api/queue', queueRoutes);//day-5 queue routes

// Health Check Endpoint (For Railway CI/CD & Uptime)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// Global Error Handler (Must be the last middleware)
app.use(errorHandler);

export default app;