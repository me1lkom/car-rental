import { Router } from 'express';
import { getUsers, createUser, getUserById, updateUser, blockUser, 
    unblockUser, changeUserPassword 
} from '../controllers/users.controller.js';
import { checkAuth } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/authorize.js';
import { selfCheck } from '../middleware/self-check.js'

const router = Router();

router.get('/', checkAuth, checkRole('admin'), getUsers);

router.post('/', checkAuth, checkRole('admin'), createUser);

router.get('/:id', checkAuth, checkRole('admin'), getUserById);

router.patch('/:id/admin', checkAuth, checkRole('admin'), updateUser);

router.patch('/:id', checkAuth, selfCheck, updateUser);

// TODO: при блокировке отзывать все сессии в одной транзакции; после разблокировки требовать новый вход.
router.patch('/:id/block', checkAuth, checkRole('admin'), blockUser);

router.patch('/:id/unblock', checkAuth, checkRole('admin'), unblockUser)

router.patch('/:id/password', checkAuth, selfCheck, changeUserPassword);

// TODO: админская функция отзыва сессии по user_id

export default router;
