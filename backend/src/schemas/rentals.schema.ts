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
