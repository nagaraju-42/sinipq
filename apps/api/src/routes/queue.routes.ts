import { Router } from 'express';
import { 
  joinQueue, 
  getMyQueueStatus, 
  getBarberQueue, 
  updateQueueStatus,
  getQueueHistory 
} from '../controllers/queue.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Apply the 'protect' middleware to ALL routes in this file. 
// You must be logged in to join, view, or update a queue.
router.use(protect);

// 1. Join a barber's queue (Customer)
router.post('/join', joinQueue);

// 2. Check my own status (Customer)
router.get('/status', getMyQueueStatus);

// 3. View the whole line for a specific barber (Barber/Owner)
router.get('/barber/:barberId', getBarberQueue);

// 📢 4. NEW: Move the line / Update status (Barber/Owner)
router.patch('/:entryId/status', updateQueueStatus);

router.get('/history', getQueueHistory); // For Customers
router.get('/history/barber/:barberId', getQueueHistory); // For Barbers/Owners
export default router;