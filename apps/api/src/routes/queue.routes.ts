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

// 🛡️ THE BOUNCER: This is exactly why your terminal was silent!
// The 'protect' middleware stops anyone without a valid token.
// Because it blocked the request immediately, the request never reached your controller,
// which means your backend never printed an error log to the terminal!
router.use(protect);

// 1. Join a barber's queue (Customer) -> Maps to POST /api/queue/join
router.post('/join', joinQueue);

// 2. Check my own status (Customer)
router.get('/status', getMyQueueStatus);

// 3. View the whole line for a specific barber (Barber/Owner)
router.get('/barber/:barberId', getBarberQueue);

// 4. Move the line / Update status (Barber/Owner)
router.patch('/:entryId/status', updateQueueStatus);

// 5. History Routes
router.get('/history', getQueueHistory); 
router.get('/history/barber/:barberId', getQueueHistory); 

export default router;