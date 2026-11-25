import type { Request, Response } from 'express';
import {
    getCars as getCarsService,
    createCar as createCarService,
    getCarById as getCarByIdService,
    updateCar as updateCarService,
    temporaryFindAllCars as temporaryFindAllCarsService,
    deleteCar as deleteCarService,
    restoreCar as restoreCarService,
    getCarAttributes as getCarAttributesService,
    findCarUnavailablePeriods as findCarUnavailablePeriodsService
} from '../services/cars.service.js';
import { createCarSchema, updateCarSchema, carsFilterSchema } from '../schemas/cars.schema.js';
import { sendError } from '../middleware/error-handler.js';
import { checkId } from "../utils/check-id.js";

export async function getCars(req: Request, res: Response) {
    const result = carsFilterSchema.safeParse({
        ...req.query,
        deleted: 'false'
    });

    if (!result.success) {
        return sendError(res, 400, 'Invalid car filters', result.error.issues);
    }

    const cars = await getCarsService(result.data);

    res.status(200).json(cars);
}


export async function createCar(req: Request, res: Response) {
    const result = createCarSchema.safeParse(req.body);

    if (!result.success) {
        return sendError(res, 400, 'Invalid car data', result.error.issues);
    }

    const car = await createCarService(result.data);

    res.status(201).json(car);
}

export async function getCarById(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid car id');
    }

    const car = await getCarByIdService(id);

    if (!car) {
        return sendError(res, 404, 'Car not found');
    }

    res.status(200).json(car);
}

export async function updateCar(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid car id');
    }

    const result = updateCarSchema.safeParse(req.body);

    if (!result.success) {
        return sendError(res, 400, 'Invalid data', result.error.issues);
    }

    if (Object.keys(result.data).length === 0) {
        return sendError(res, 400, 'No fields to update');
    }

    const car = await updateCarService(id, result.data);

    if (!car) {
        return sendError(res, 400, 'Car not found');
    }

    res.status(200).json(car);
}


// временное получение ВСЕХ авто
export async function temporaryFindAllCars(req: Request, res: Response) {
    const cars = await temporaryFindAllCarsService();

    res.status(200).json(cars);
}


export async function deleteCar(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid car id');
    }

    const car = await deleteCarService(id);

    if (!car) {
        return sendError(res, 404, 'Car not found');
    }

    res.status(200).json(car);
}


export async function restoreCar(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid car id');
    }

    const car = await restoreCarService(id);

    if (!car) {
        return sendError(res, 404, 'Car not found');
    }

    res.status(200).json(car);
}

export async function getCarAttributes(req: Request, res: Response) {
    const carAttributes = await getCarAttributesService();

    res.status(200).json(carAttributes)
}

export async function findCarUnavaliblePeriods(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid car id');
    }

    const result = await findCarUnavailablePeriodsService(id);

    if (!result.ok) {
        return sendError(res, 404, 'Car not found');
    }

    res.status(200).json({
        car_id: id,
        unavailable_periods: result.periods
    });
}

export async function getAdminCars(req: Request, res: Response) {
    const result = carsFilterSchema.safeParse(req.query);

    if (!result.success) {
        return sendError(
            res, 400, 'Invalid car filters',
            result.error.issues
        );
    }

    const cars = await getCarsService(result.data);

    return res.status(200).json(cars);
}

export async function getAdminCarById(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid car id');
    }

    const car = await getCarByIdService(id, true);

    if (!car) {
        return sendError(res, 404, 'Car not found');
    }

    return res.status(200).json(car);
}