import { Router } from 'express';
import { 
  joinQueue, 
  getMyQueueStatus, 
  getBarberQueue, 
  updateQueueStatus,
  getQueueHistory,
  clearBarberQueue // 🚀 NEW: Import the reset function
} from '../controllers/queue.controller';
import { protect } from '../middlewares/auth.middleware';

export const queueRouter = Router();

queueRouter.use(protect);

queueRouter.post('/join', joinQueue);
queueRouter.get('/status', getMyQueueStatus);
queueRouter.get('/barber/:barberId', getBarberQueue);
queueRouter.patch('/:entryId/status', updateQueueStatus);
queueRouter.get('/history', getQueueHistory);
queueRouter.get('/history/barber/:barberId', getQueueHistory);

// 🚀 NEW: The Emergency Reset Route
queueRouter.delete('/barber/:barberId/reset', clearBarberQueue);