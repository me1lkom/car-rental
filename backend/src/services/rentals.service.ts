import {
    getRentals as getRentalsRepository,
    getMyRentals as getMyRentalsRepository,
    getRentalById as getRentalByIdRepository,
    getUserRentalById as getUserRentalByIdRepository,
    getCarPricePerDay as getCarPricePerDayRepository,
    getCarForUpdate as getCarForUpdateRepository,
    findConflictingRentals as findConflictingRentalsRepository,
    createRental as createRentalRepository,
    mockPayment as mockPaymentRepository,
    findRentalCarId as findRentalCarIdRepository,
    updateRentalStatus as updateRentalStatusRepository,
    updateRentalManager as updateRentalManagerRepository,
    updateRental as updateRentalRepository,
    getRentalForUpdate as getRentalForUpdateRepository,
    rentalUserExists as rentalUserExistsRepository
} from '../repositories/rentals.repository.js';
import type { NewRental, NewRentalRecord, UpdateRentalData } from '../schemas/rentals.schema.js'
import { withTransaction } from '../db/transaction.js';


export async function getRentals(limit: number, offset: number) {
    const result = await getRentalsRepository(limit, offset);

    return {
        items: result.rentals,
        pagination: {
            total: result.total,
            limit,
            offset,
            has_more: offset + result.rentals.length < result.total
        }
    };
}

export async function getMyRentals(user_id: number) {
    const rentals = await getMyRentalsRepository(user_id);

    return rentals;
}

export async function getRentalById(rental_id: number, role: string, user_id: number) {
    const rental = role === 'admin' || role === 'manager'
        ? await getRentalByIdRepository(rental_id)
        : await getUserRentalByIdRepository(rental_id, user_id);

    if (!rental) {
        return {
            ok: false,
            reason: 'RENTAL_NOT_FOUND'
        } as const;
    }

    return {
        ok: true,
        rental
    } as const;
}

export function calculateRentalPrice(pricePerDay: number, start_date: string, end_date: string) {
    const startTime = Date.parse(start_date);
    const endTime = Date.parse(end_date);

    if (!Number.isFinite(startTime) ||
        !Number.isFinite(endTime) ||
        endTime < startTime) {
        throw new Error('Invalid rental dates');
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const totalDays = Math.round(
        (endTime - startTime) / millisecondsPerDay
    ) + 1;

    return totalDays * pricePerDay;
}

export async function createRental(user_id: number, rental: NewRental) {
    return withTransaction(async (client) => {

        // проверка начальной даты
        const today = new Date().toLocaleDateString('sv-SE', {
            timeZone: 'Europe/Moscow'
        });
        if (rental.start_date < today) {
            return {
                ok: false,
                reason: 'INCORRECT_START_DATE'
            } as const;
        }

        // проверка авто и брокировка
        const car = await getCarForUpdateRepository(rental.car_id, client);

        if (!car) {
            return {
                ok: false,
                reason: 'CAR_NOT_FOUND'
            } as const;
        }

        if (car.status !== 'available') {
            return {
                ok: false,
                reason: 'CAR_UNAVAILABLE'
            } as const;
        }

        // проверка конфликта времён брони с другими
        const conflict = await findConflictingRentalsRepository(
            rental.car_id,
            rental.start_date,
            rental.end_date,
            client
        );

        if (conflict) {
            return {
                ok: false,
                reason: 'DATES_UNAVAILABLE'
            } as const;
        }

        // расчёт стоимости
        const totalCost = calculateRentalPrice(
            car.price_per_day,
            rental.start_date,
            rental.end_date
        );

        const data: NewRentalRecord = {
            user_id: user_id,
            car_id: rental.car_id,
            start_date: rental.start_date,
            end_date: rental.end_date,
            total_price: totalCost
        }

        const result = await createRentalRepository(
            data,
            client
        );

        return {
            ok: true,
            rental: result
        } as const;
    })
}

export async function mockPayment(rentalId: number) {
    return withTransaction(async (client) => {

        const rental = await getRentalForUpdateRepository(
            rentalId,
            client
        );

        if (!rental) {
            return {
                ok: false,
                reason: 'RENTAL_NOT_FOUND'
            } as const;
        }

        const car = await getCarForUpdateRepository(
            rental.car_id,
            client
        );

        if (!car) {
            return {
                ok: false,
                reason: 'CAR_NOT_FOUND'
            } as const;
        }

        const updatedRental = await mockPaymentRepository(
            rentalId,
            client
        );

        if (!updatedRental) {
            return {
                ok: false,
                reason: 'PAYMENT_NOT_ALLOWED'
            } as const;
        }

        return {
            ok: true,
            rental: updatedRental
        } as const;
    });
}


// Изменение статуса аренды
async function changeRentalStatus(
    rentalId: number,
    expectedStatuses: string[],
    newStatus: string
) {
    const rental = await updateRentalStatusRepository(
        rentalId,
        expectedStatuses,
        newStatus
    );

    if (rental) {
        return {
            ok: true,
            rental
        };
    }

    const existingRental = await getRentalByIdRepository(rentalId);

    if (!existingRental) {
        return {
            ok: false,
            reason: 'RENTAL_NOT_FOUND'
        };
    }

    return {
        ok: false,
        reason: 'INVALID_RENTAL_STATUS'
    };
}


export async function confirmRental(rentalId: number) {
    const expectedStatuses = ['pending']
    const newStatus = 'confirmed'
    return changeRentalStatus(
        rentalId,
        expectedStatuses,
        newStatus
    );
}

export async function rejectRental(rentalId: number) {
    const expectedStatuses = ['pending', 'confirmed']
    const newStatus = 'rejected'
    return changeRentalStatus(
        rentalId,
        expectedStatuses,
        newStatus
    );
}

export async function activateRental(rentalId: number) {
    const expectedStatuses = ['confirmed']
    const newStatus = 'active'
    return changeRentalStatus(
        rentalId,
        expectedStatuses,
        newStatus
    );
}

export async function completeRental(rentalId: number) {
    const expectedStatuses = ['active']
    const newStatus = 'completed'
    return changeRentalStatus(
        rentalId,
        expectedStatuses,
        newStatus
    );
}

export async function cancelRental(rentalId: number) {
    const expectedStatuses = [
        'pending_payment',
        'pending',
        'confirmed',
        'active'
    ];
    const newStatus = 'cancelled';
    return changeRentalStatus(
        rentalId,
        expectedStatuses,
        newStatus
    );
}

// Изменение аренды

export async function updateRentalAdmin(
    rentalId: number,
    data: UpdateRentalData
) {
    return updateRentalService(rentalId, data, false);
}

export async function updateRentalManager(
    rentalId: number,
    data: UpdateRentalData
) {
    return updateRentalService(rentalId, data, true);
}

async function updateRentalService(
    rentalId: number,
    data: UpdateRentalData,
    managerRestrictions: boolean
) {
    return withTransaction(async (client) => {
        const rental = await getRentalForUpdateRepository(
            rentalId,
            client
        );

        if (!rental) {
            return {
                ok: false,
                reason: 'RENTAL_NOT_FOUND'
            } as const;
        }

        const carId = data.car_id ?? rental.car_id;
        const startDate = data.start_date ?? rental.start_date;
        const endDate = data.end_date ?? rental.end_date;

        const today = new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        if (managerRestrictions && endDate < today) {
            return {
                ok: false,
                reason: 'RENTAL_EDIT_NOT_ALLOWED'
            } as const;
        }

        if (startDate > endDate) {
            return {
                ok: false,
                reason: 'INVALID_DATES'
            } as const;
        }

        if (data.user_id !== undefined) {
            const userExists = await rentalUserExistsRepository(
                data.user_id,
                client
            );

            if (!userExists) {
                return {
                    ok: false,
                    reason: 'USER_NOT_FOUND'
                } as const;
            }
        }

        const scheduleChanged =
            carId !== rental.car_id ||
            startDate !== rental.start_date ||
            endDate !== rental.end_date;

        const updateData: UpdateRentalData = { ...data };

        if (scheduleChanged) {
            const car = await getCarForUpdateRepository(
                carId,
                client
            );

            if (!car) {
                return {
                    ok: false,
                    reason: 'CAR_NOT_FOUND'
                } as const;
            }

            if (car.status !== 'available') {
                return {
                    ok: false,
                    reason: 'CAR_UNAVAILABLE'
                } as const;
            }

            const hasConflict = await findConflictingRentalsRepository(
                carId,
                startDate,
                endDate,
                client,
                rentalId
            );

            if (hasConflict) {
                return {
                    ok: false,
                    reason: 'DATES_UNAVAILABLE'
                } as const;
            }

            if (data.total_price === undefined) {
                updateData.total_price = calculateRentalPrice(
                    Number(car.price_per_day),
                    startDate,
                    endDate
                );
            }
        }

        const updatedRental = managerRestrictions
            ? await updateRentalManagerRepository(
                rentalId,
                updateData,
                client
            )
            : await updateRentalRepository(
                rentalId,
                updateData,
                client
            );

        if (!updatedRental) {
            return {
                ok: false,
                reason: 'RENTAL_EDIT_NOT_ALLOWED'
            } as const;
        }

        return {
            ok: true,
            rental: updatedRental
        } as const;
    });
}