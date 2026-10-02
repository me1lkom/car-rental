import type { Request, Response } from 'express';
import {
    getCars as getCarsService, createCar as createCarService,
    getCarById as getCarByIdService, updateCar as updateCarService,
    temporaryFindAllCars as temporaryFindAllCarsService, deleteCar as deleteCarService,
    restoreCar as restoreCarService
} from '../services/cars.service.js';
import { createCarSchema, updateCarSchema } from '../schemas/cars.schema.js';


type CarsFilter = {
    brand?: string;
    model?: string;
    year?: number;
    status?: string;
};


export async function getCars(req: Request, res: Response) {
    const { brand, model, year, status } = req.query;

    const filters: CarsFilter = {};

    if (typeof brand === 'string') {
        filters.brand = brand;
    }

    if (typeof model === 'string') {
        filters.model = model;
    }

    if (typeof year === 'string') {
        filters.year = Number(year);

        if (!Number.isInteger(filters.year)) {
            return res.status(400).json({ error: 'Invalid year id' });
        }
    }

    if (typeof status === 'string') {
        filters.status = status;
    }

    const cars = await getCarsService(filters);

    res.status(200).json(cars);
}

export async function createCar(req: Request, res: Response) {
    const result = createCarSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid car data',
            details: result.error.issues
        });
    }

    const car = await createCarService(result.data);

    res.status(201).json(car);
}

export async function getCarById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid car id' });
    }

    const car = await getCarByIdService(id);

    if (!car) {
        return res.status(404).json({ error: 'Car not found' });
    }

    res.status(200).json(car);
}

export async function updateCar(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid car id' });
    }

    const result = updateCarSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid data',
            details: result.error.issues
        });
    }

    if (Object.keys(result.data).length === 0) {
        return res.status(400).json({
            error: 'No fields to update'
        });
    }

    const car = await updateCarService(id, result.data);

    if (!car) {
        return res.status(404).json({
            error: 'Car not found'
        });
    }

    res.status(200).json(car);
}


// временное получение ВСЕХ авто
export async function temporaryFindAllCars(req: Request, res: Response) {
    const cars = await temporaryFindAllCarsService();

    res.status(200).json(cars);
}


export async function deleteCar(req: Request, res: Response) {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid car id'
        });
    }

    const car = await deleteCarService(id);

    if (!car) {
        return res.status(404).json({
            error: 'Car not found'
        });
    }

    res.status(200).json(car);
}


export async function restoreCar(req: Request, res: Response) {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid car id'
        });
    }

    const car = await restoreCarService(id);

    if (!car) {
        return res.status(404).json({
            error: 'Car not found'
        });
    }

    res.status(200).json(car);
}