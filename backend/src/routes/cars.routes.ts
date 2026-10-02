import { Router } from 'express';
import { getCars, createCar, getCarById, updateCar, 
    temporaryFindAllCars, deleteCar, restoreCar } from '../controllers/cars.controller.js';

const router = Router();

router.get('/', getCars);

// временное получение всех авто
router.get('/temporaryAllCars', temporaryFindAllCars);

router.post('/', createCar);

router.get('/:id', getCarById);

router.patch('/:id', updateCar);

// мягкое удаление. помечает в slq как удалённое
router.delete('/:id', deleteCar)

router.patch('/:id/restore', restoreCar)

export default router;