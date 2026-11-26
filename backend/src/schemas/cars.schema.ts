
import { z } from 'zod';

const attributeIdSchema = z.number().int().positive();

export const createCarSchema = z.object({
    license_plate: z.string().min(1),
    brand: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int(),

    body_type_id: attributeIdSchema,
    drive_type_id: attributeIdSchema,
    rental_class_id: attributeIdSchema,
    transmission_id: attributeIdSchema,
    fuel_type_id: attributeIdSchema,

    seats: z.number().int().min(2).max(9),
    doors: z.number().int().min(2).max(6),

    image_url: z.string().optional(),
    description: z.string().optional(),
    price_per_day: z.number().int().positive(),
    status: z.string().min(1)
});
export type NewCar = z.infer<typeof createCarSchema>;

export const updateCarSchema = createCarSchema.partial();
export type UpdateCar = z.infer<typeof updateCarSchema>;

const queryPositiveInt = z.string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive());

const queryNonNegativeInt = z.string()
    .regex(/^(0|[1-9]\d*)$/)
    .transform(Number)
    .pipe(z.number().int().nonnegative());

export const carsFilterSchema = z.object({
    car_id: queryPositiveInt.optional(),

    brand: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: queryPositiveInt.optional(),
    status: z.string().min(1).optional(),

    body_type_id: queryPositiveInt.optional(),
    drive_type_id: queryPositiveInt.optional(),
    rental_class_id: queryPositiveInt.optional(),
    transmission_id: queryPositiveInt.optional(),
    fuel_type_id: queryPositiveInt.optional(),

    seats: z.string()
        .transform(Number)
        .pipe(z.number().int().min(2).max(9))
        .optional(),

    doors: z.string()
        .transform(Number)
        .pipe(z.number().int().min(2).max(6))
        .optional(),

    limit: queryPositiveInt
        .pipe(z.number().max(100))
        .default(20),

    offset: queryNonNegativeInt
        .default(0),

    search: z.string().trim().min(1).max(100).optional(),

    date_from: z.iso.date().optional(),
    date_to: z.iso.date().optional(),

    deleted: z.enum(['true', 'false'])
        .transform(value => value === 'true')
        .optional(),
}).refine(
    data =>
        (data.date_from === undefined) ===
        (data.date_to === undefined),
    {
        message: 'Both dates must be provided',
        path: ['date_to']
    }
).refine(
    data =>
        !data.date_from ||
        !data.date_to ||
        data.date_from <= data.date_to,
    {
        message: 'Invalid date range',
        path: ['date_to']
    }
);

export type CarsFilter = z.infer<typeof carsFilterSchema>;