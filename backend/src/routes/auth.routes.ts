import { Router } from "express";
import { login, returnMe, refreshToken, logout } from '../controllers/auth.controller.js';
import { createUser as registration} from '../controllers/users.controller.js';
import { checkAuth } from '../middleware/authenticate.js';
// import { checkRole } from '../middleware/authorize.js';

const router = Router();

router.post('/registration', registration)

router.post('/login', login);

router.get('/me', checkAuth, returnMe)

router.post('/refresh', refreshToken)

router.post('/logout', logout)

export default router;