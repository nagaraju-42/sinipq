import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorHandler } from './errorHandler';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(compression());
app.use(express.json());

// Health Check Endpoint (For Railway CI/CD & Uptime)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// Global Error Handler (Must be the last middleware)
app.use(errorHandler);

export default app;