import { Router } from 'express';
import { getUsers, createUser, getUserById, updateUser, blockUser, 
    unblockUser, changeUserPassword 
} from '../controllers/users.controller.js';

const router = Router();

router.get('/', getUsers);

router.post('/', createUser);

router.get('/:id', getUserById);

router.patch('/:id', updateUser);

router.patch('/:id/block', blockUser);

router.patch('/:id/unblock', unblockUser)

router.patch('/:id/password', changeUserPassword);



export default router;
