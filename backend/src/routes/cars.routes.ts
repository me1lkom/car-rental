import { Router } from 'express';
import { getCars, createCar, getCarById, updateCar, 
    temporaryFindAllCars, deleteCar, restoreCar } from '../controllers/cars.controller.js';
import { checkAuth } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/authorize.js';

const router = Router();

router.get('/', getCars);

// временное получение всех авто
router.get('/temporaryAllCars', checkAuth, checkRole('admin'), temporaryFindAllCars);

router.post('/', checkAuth, checkRole('manager', 'admin'), createCar);

router.get('/:id', getCarById);

router.patch('/:id', checkAuth, checkRole('manager', 'admin'),  updateCar);

// мягкое удаление. помечает в slq как удалённое
router.delete('/:id', checkAuth, checkRole('admin'),  deleteCar)

router.patch('/:id/restore', checkAuth, checkRole('admin'), restoreCar)

export default router;