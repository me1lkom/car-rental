
import { z } from 'zod';

export const createCarSchema = z.object({
    license_plate: z.string().min(1),
    brand: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int(),
    image_url: z.string().optional(),
    description: z.string().optional(),
    price_per_day: z.number().int().positive(),
    status: z.string().min(1)
});
export type NewCar = z.infer<typeof createCarSchema>;

export const updateCarSchema = createCarSchema.partial();
export type UpdateCar = z.infer<typeof updateCarSchema>;