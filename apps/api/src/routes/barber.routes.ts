import { Router } from 'express';
import { getBarbers, addBarberToSalon } from '../controllers/barber.controller';

// 🚀 FIX: We add 'export' directly to the variable (A Strict Named Export)
export const barberRouter = Router();

barberRouter.get('/', getBarbers);
barberRouter.post('/salon/:salonId', addBarberToSalon);

// Notice: We completely deleted the 'export default' at the bottom!