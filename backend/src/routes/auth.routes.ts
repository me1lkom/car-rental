import { Router } from "express";
import { login, returnMe } from '../controllers/auth.controller.js';
import { checkAuth } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/authorize.js';

const router = Router();

router.post('/login', login);

router.get('/me', checkAuth, checkRole('client', 'admin'), returnMe)

export default router;