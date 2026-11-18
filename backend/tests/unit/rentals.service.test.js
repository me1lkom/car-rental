import { describe, test, expect } from 'vitest';
import { calculateRentalPrice } from '../../src/services/rentals.service.ts';


describe('calculateRentalPrice', () => {
    test('Аренда авто 1 день', () => {
        const result = calculateRentalPrice(2000, '2027-01-10', '2027-01-10')

        expect(result).toBe(2000)
    });

    test('Аренда авто 3 дня', () => {
        const result = calculateRentalPrice(2000, '2027-01-10', '2027-01-12')

        expect(result).toBe(6000)
    });

    test('Аренда авто, неправильная дата', () => {
        expect(() => calculateRentalPrice(2000, '2027-01-10', '2027-01-09')).toThrow('Invalid rental dates')
    });
})