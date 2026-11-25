import { z } from 'zod';

export const createRentalSchema = z.object({
    car_id: z.number().int().positive(),
    start_date: z.iso.date(),
    end_date: z.iso.date()
}).refine(
    data => data.end_date >= data.start_date,
    {
        message: 'End date must not be before start date',
        path: ['end_date']
    }
);

export type NewRental = z.infer<typeof createRentalSchema>

export const NewRentalRecordSchema = z.object({
    user_id: z.number().int().positive(),
    car_id: z.number().int().positive(),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    total_price: z.number().int().positive().nonnegative().max(200000)
})

export type NewRentalRecord = z.infer<typeof NewRentalRecordSchema>

export const updateRentalSchema = z.object({
    user_id: z.number().int().positive(),
    car_id: z.number().int().positive(),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    total_price: z.number().int().nonnegative().max(200000)
})
.partial()
.strict()
.refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
});

export type UpdateRentalData = z.infer<typeof updateRentalSchema>;

const queryPositiveInt = z.string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive());

const queryNonNegativeInt = z.string()
    .regex(/^(0|[1-9]\d*)$/)
    .transform(Number)
    .pipe(z.number().int().nonnegative());

const rentalStatusSchema = z.enum([
    'pending_payment',
    'pending',
    'confirmed',
    'active',
    'completed',
    'cancelled',
    'rejected'
]);

export const rentalsFilterSchema = z.object({
    rental_id: queryPositiveInt.optional(),
    car_id: queryPositiveInt.optional(),
    user_id: queryPositiveInt.optional(),

    status: z.string()
        .transform(value => value.split(','))
        .pipe(z.array(rentalStatusSchema).min(1))
        .optional(),

    date_from: z.iso.date().optional(),
    date_to: z.iso.date().optional(),

    search: z.string().trim().min(1).max(100).optional(),

    limit: queryPositiveInt
        .pipe(z.number().max(100))
        .default(50),

    offset: queryNonNegativeInt.default(0)
}).refine(
    data => !data.date_from ||
        !data.date_to ||
        data.date_from <= data.date_to,
    {
        message: 'Invalid date range',
        path: ['date_to']
    }
)

export type RentalsFilter = z.infer<typeof rentalsFilterSchema>;