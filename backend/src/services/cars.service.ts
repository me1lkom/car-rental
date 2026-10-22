import { findCars,  createCar as createCarRepository, findCarsById, 
    updateCar as updateCarRepository, temporaryFindAllCars as temporaryFindAllCarsRepository, 
    deleteCar as deleteCarRepository, restoreCar as restoreCarRepository, 
    getCarAttributes as getCarAttributesRepository
} from '../repositories/cars.repository.js';
import type { NewCar, UpdateCar, CarsFilter } from '../schemas/cars.schema.js';


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

export async function getCarAttributes() {
    return await getCarAttributesRepository()
}