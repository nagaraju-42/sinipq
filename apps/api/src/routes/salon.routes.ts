import { createSalon, getMySalon, getAllSalons } from '../controllers/salon.controller';

import { Router } from 'express';
// import { createSalon, getMySalon } from '../controllers/salon.controller';
import { addBarberToSalon } from '../controllers/barber.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAllSalons);//day-5 public route to get all salons

// Apply the 'protect' middleware to ALL routes in this file so only logged-in users can access them
router.use(protect);

// 1. Create a new salon (Only OWNERS allowed)
router.post('/', authorizeRoles('OWNER'), createSalon);

// 2. Get my salon details and staff (Only OWNERS allowed)
router.get('/mine', authorizeRoles('OWNER'), getMySalon);

// 3. Add a new barber to a specific salon (Only OWNERS allowed)
router.post('/:salonId/barbers', authorizeRoles('OWNER'), addBarberToSalon);

export default router;