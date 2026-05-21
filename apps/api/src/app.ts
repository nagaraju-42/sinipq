import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

// 🛣️ Route Imports
import authRoutes from './routes/auth.routes';
import salonRoutes from './routes/salon.routes';
import queueRoutes from './routes/queue.routes';
import barberRoutes from './routes/barber.routes';

import { errorHandler } from './errorHandler';

const app = express();

// 🛡️ Middlewares
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(compression());
app.use(express.json());

// 🔌 Active Routes
app.use('/api/auth', authRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/barbers', barberRoutes); // Moved ABOVE the error handler!

// 🏥 Health Check Endpoint 
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// 🚨 Global Error Handler (Must be the last middleware)
app.use(errorHandler);

export default app;