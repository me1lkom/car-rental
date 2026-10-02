import { findCars,  createCar as createCarRepository, findCarsById, 
    updateCar as updateCarRepository, temporaryFindAllCars as temporaryFindAllCarsRepository, 
    deleteCar as deleteCarRepository, restoreCar as restoreCarRepository} from '../repositories/cars.repository.js';
import type { NewCar, UpdateCar } from '../schemas/cars.schema.js';

type CarsFilter = {
    brand?: string;
    model?: string;
    year?: number;
    status?: string;
};

export async function getCars(filters: CarsFilter) {
    return await findCars(filters);
}

export async function createCar(car: NewCar) {
    return await createCarRepository(car);
}

export async function getCarById(id: number) {
    return await findCarsById(id);
}

export async function updateCar(id: number, updates: UpdateCar) {
    return await updateCarRepository(id, updates)
}

// временная функция до ролей
export async function temporaryFindAllCars() {
    return await temporaryFindAllCarsRepository();
}

// мягкое удаление
export async function deleteCar(id: number) {
    return await deleteCarRepository(id);
}

export async function restoreCar(id: number) {
    return await restoreCarRepository(id);
}

