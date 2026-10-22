import type { Request, Response } from 'express';
import {
    getCars as getCarsService, createCar as createCarService,
    getCarById as getCarByIdService, updateCar as updateCarService,
    temporaryFindAllCars as temporaryFindAllCarsService, deleteCar as deleteCarService,
    restoreCar as restoreCarService, getCarAttributes as getCarAttributesService
} from '../services/cars.service.js';
import { createCarSchema, updateCarSchema, carsFilterSchema } from '../schemas/cars.schema.js';


export async function getCars(req: Request, res: Response) {
    const result = carsFilterSchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid car filters',
            details: result.error.issues
        });
    }

    const cars = await getCarsService(result.data);

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

export async function getCarAttributes(req: Request, res: Response) {
    const carAttributes = await getCarAttributesService();

    res.status(200).json(carAttributes)
}