import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

// Map the URLs to the functions we just wrote
router.post('/register', register);
router.post('/login', login);

export default router;