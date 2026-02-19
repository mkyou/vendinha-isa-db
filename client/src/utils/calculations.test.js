import { describe, it, expect } from 'vitest';
import { calculatePaymentDistribution } from './calculations';

describe('calculatePaymentDistribution', () => {
    it('should pay items in order until payment runs out', () => {
        const items = [
            { id: 1, price: 50, quantity: 1 },
            { id: 2, price: 50, quantity: 1 }
        ];
        const totalPaid = 80;

        const result = calculatePaymentDistribution(items, totalPaid);

        expect(result[0].paid_amount).toBe(50); // Fully paid
        expect(result[1].paid_amount).toBe(30); // Partially paid
    });

    it('should mark all items as paid if totalPaid equals grand total', () => {
        const items = [
            { id: 1, price: 10, quantity: 2 }, // Total 20
            { id: 2, price: 30, quantity: 1 }  // Total 30
        ];
        const totalPaid = 50;

        const result = calculatePaymentDistribution(items, totalPaid);

        expect(result[0].paid_amount).toBe(20);
        expect(result[1].paid_amount).toBe(30);
    });

    it('should handle zero payment (all debt)', () => {
        const items = [
            { id: 1, price: 100, quantity: 1 }
        ];
        const totalPaid = 0;

        const result = calculatePaymentDistribution(items, totalPaid);

        expect(result[0].paid_amount).toBe(0);
    });

    it('should handle overpayment gracefully (though validation should prevent this)', () => {
        const items = [
            { id: 1, price: 10, quantity: 1 }
        ];
        const totalPaid = 20;

        const result = calculatePaymentDistribution(items, totalPaid);

        // our logic currently caps at itemTotal inside the loop:
        // if (remaining >= itemTotal) itemPaid = itemTotal
        // so it won't assign more than itemTotal to an item.
        expect(result[0].paid_amount).toBe(10);
    });
});
