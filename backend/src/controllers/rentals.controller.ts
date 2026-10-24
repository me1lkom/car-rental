import type { Request, Response } from "express";
import {
    getRentals as getRentalsService,
    getMyRentals as getMyRentalsService,
    getRentalById as getRentalByIdService,
    createRental as createRentalService,
    mockPayment as mockPaymentService,
    confirmRental as confirmRentalService,
    rejectRental as rejectRentalService,
    activateRental as activateRentalService,
    completeRental as completeRentalService,
    cancelRental as cancelRentalService,
    updateRentalAdmin as updateRentalAdminService,
    updateRentalManager as updateRentalManagerService
} from '../services/rentals.service.js';
import { createRentalSchema, updateRentalSchema } from '../schemas/rentals.schema.js';

// Получение аренд

export async function getRentals(req: Request, res: Response) {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            error: 'Invalid limit'
        })
    }

    if (!Number.isInteger(offset) || offset < 0) {
        return res.status(400).json({
            error: 'Invalid offset'
        })
    }

    const result = await getRentalsService(limit, offset);

    return res.status(200).json(result);
}

export async function getMyRentals(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Ошибка авторизации'
        })
    }

    const user_id: number = req.user.user_id;

    const result = await getMyRentalsService(user_id);

    return res.status(200).json(result);
}

export async function getRentalById(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Ошибка авторизации'
        })
    }

    const user_id: number = req.user.user_id;
    const role = req.user.role;
    const rental_id = Number(req.params.id);

    if (!Number.isInteger(rental_id) || rental_id <= 0) {
        return res.status(400).json({ error: 'Invalid rental id' });
    }
    const result = await getRentalByIdService(rental_id, role, user_id);

    if (!result.ok) {
        if (result.reason === 'RENTAL_NOT_FOUND') {
            return res.status(404).json({
                error: 'Rental not found'
            });
        }
    }

    return res.status(200).json(result.rental);
}


// Создание аренды

export async function createRental(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Ошибка авторизации'
        })
    }

    const validation = createRentalSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: 'Invalid rental data',
            details: validation.error.issues
        });
    }

    const user_id = req.user.user_id
    const rental = validation.data

    const result = await createRentalService(
        user_id,
        rental
    )

    if (!result.ok) {
        if (result.reason === 'CAR_NOT_FOUND') {
            return res.status(404).json({
                error: 'Car not found'
            });
        }

        if (result.reason === 'CAR_UNAVAILABLE') {
            return res.status(409).json({
                error: 'Car unavailable'
            });
        }


        if (result.reason === 'DATES_UNAVAILABLE') {
            return res.status(409).json({
                error: 'Selected dates are unavailable'
            });
        }

        if (result.reason === 'INCORRECT_START_DATE') {
            return res.status(400).json({
                error: 'Selected start date before now'
            });
        }

    }

    return res.status(201).json(result.rental);
}


// Изменение аренды

function checkRentalId(rawId: unknown) {

    if (typeof rawId !== 'string') {
        return null;
    }

    const rentalId = Number(rawId);

    if (!Number.isInteger(rentalId) || rentalId <= 0) {
        return null
    }

    return rentalId;
}

type StatusChangeResult = Awaited<ReturnType<typeof confirmRentalService>>;

function handleStatusResponse(result: StatusChangeResult, res: Response) {
    if (!result.ok) {
        if (result.reason === 'RENTAL_NOT_FOUND') {
            return res.status(404).json({
                error: 'Rental not found'
            });
        }
        if (result.reason === 'INVALID_RENTAL_STATUS') {
            return res.status(409).json({
                error: 'Invalid rental status transition'
            });
        }
    }

    return res.status(200).json(result);
}

export async function confirmRental(req: Request, res: Response) {
    const rentalId = checkRentalId(req.params.id);

    if (rentalId === null) {
        return res.status(400).json({
            error: 'Rental not found'
        });
    }

    const result = await confirmRentalService(rentalId);

    return handleStatusResponse(result, res);
}

export async function rejectRental(req: Request, res: Response) {
    const rentalId = checkRentalId(req.params.id);

    if (rentalId === null) {
        return res.status(400).json({
            error: 'Rental not found'
        });
    }

    const result = await rejectRentalService(rentalId);

    return handleStatusResponse(result, res);
}

export async function activateRental(req: Request, res: Response) {
    const rentalId = checkRentalId(req.params.id);

    if (rentalId === null) {
        return res.status(400).json({
            error: 'Rental not found'
        });
    }

    const result = await activateRentalService(rentalId);

    return handleStatusResponse(result, res);
}

export async function completeRental(req: Request, res: Response) {
    const rentalId = checkRentalId(req.params.id);

    if (rentalId === null) {
        return res.status(400).json({
            error: 'Rental not found'
        });
    }

    const result = await completeRentalService(rentalId);

    return handleStatusResponse(result, res);
}

export async function cancelRental(req: Request, res: Response) {
    const rentalId = checkRentalId(req.params.id);

    if (rentalId === null) {
        return res.status(400).json({
            error: 'Rental not found'
        });
    }

    const result = await cancelRentalService(rentalId);

    return handleStatusResponse(result, res);
}

async function updateRental(
    req: Request,
    res: Response,
    managerRestrictions: boolean
) {
    const rentalId = checkRentalId(req.params.id);

    if (rentalId === null) {
        return res.status(400).json({
            error: 'Invalid rental ID'
        });
    }

    const validation = updateRentalSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: 'Invalid rental data',
            details: validation.error.issues
        });
    }

    const result = managerRestrictions
        ? await updateRentalManagerService(rentalId, validation.data)
        : await updateRentalAdminService(rentalId, validation.data);

    if (result.ok) {
        return res.status(200).json(result);
    }

    switch (result.reason) {
        case 'RENTAL_NOT_FOUND':
            return res.status(404).json({
                error: 'Rental not found'
            });

        case 'USER_NOT_FOUND':
            return res.status(404).json({
                error: 'User not found'
            });

        case 'CAR_NOT_FOUND':
            return res.status(404).json({
                error: 'Car not found'
            });

        case 'INVALID_DATES':
            return res.status(400).json({
                error: 'Invalid rental dates'
            });

        case 'CAR_UNAVAILABLE':
            return res.status(409).json({
                error: 'Car unavailable'
            });

        case 'DATES_UNAVAILABLE':
            return res.status(409).json({
                error: 'Dates unavailable'
            });

        case 'RENTAL_EDIT_NOT_ALLOWED':
            return res.status(409).json({
                error: 'Rental cannot be edited'
            });
    }
}

export async function updateRentalAdmin(req: Request, res: Response) {
    return updateRental(req, res, false);
}

export async function updateRentalManager(req: Request, res: Response) {
    return updateRental(req, res, true);
}


// временное подтверждение оплаты
export async function mockPayment(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Ошибка авторизации'
        })
    }

    const rental_id = Number(req.params.id);

    if (!Number.isInteger(rental_id) || rental_id <= 0) {
        return res.status(400).json({ error: 'Invalid rental id' });
    }

    const result = await mockPaymentService(rental_id);

    if (!result.ok) {
        if (result.reason == 'RENTAL_NOT_FOUND') {
            return res.status(404).json({
                error: 'Rental not found'
            });
        }

        if (result.reason === 'PAYMENT_NOT_ALLOWED') {
            return res.status(409).json({
                error: 'Payment cannot be confirmed: invalid status or expired hold'
            });
        }

        if (result.reason === 'CAR_NOT_FOUND') {
            return res.status(404).json({
                error: 'Car not found'
            });
        }
    }

    return res.status(200).json(result.rental);
}