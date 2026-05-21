import { Router } from 'express';
import { getBarbers } from '../controllers/barber.controller';

const router = Router();

// When someone visits GET /api/barbers, run the getBarbers function
router.get('/', getBarbers);

export default router;