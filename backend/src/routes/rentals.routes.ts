import { Router } from 'express';
import {
    getRentals, 
    createRental, 
    getMyRentals,
    getRentalById, 
    confirmRental, 
    rejectRental,
    activateRental, 
    completeRental, 
    cancelRental,
    updateRentalAdmin, 
    updateRentalManager, 
    mockPayment
} from '../controllers/rentals.controller.js';
import { checkAuth } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/authorize.js';

const router = Router();

// Создание
router.get('/', checkAuth,  checkRole('manager', 'admin'), getRentals);

// Получение
router.post('/', checkAuth, createRental);
router.get('/my', checkAuth, getMyRentals);

router.get('/:id', checkAuth, getRentalById);

// временное подтверждение
router.post('/:id/mock-payment', checkAuth, checkRole('admin'), mockPayment);

// Изменение статусов
router.patch('/:id/confirm', checkAuth, checkRole('manager', 'admin'), confirmRental);
router.patch('/:id/reject', checkAuth, checkRole('manager', 'admin'), rejectRental);
router.patch('/:id/activate', checkAuth, checkRole('manager', 'admin'), activateRental);
router.patch('/:id/complete', checkAuth, checkRole('manager', 'admin'), completeRental);
router.patch('/:id/cancel', checkAuth, checkRole('manager', 'admin'), cancelRental);

// Изменение общее
router.patch('/:id/admin', checkAuth, checkRole('admin'), updateRentalAdmin);
router.patch('/:id/manager', checkAuth, checkRole('manager', 'admin'), updateRentalManager);

export default router;
