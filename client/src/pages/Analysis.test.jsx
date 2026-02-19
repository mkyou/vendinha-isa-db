import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Analysis from '../pages/Analysis';
import * as React from 'react';

// Mock Fetch
global.fetch = vi.fn();

describe('Analysis Component - Predictions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // No fake timers!
    });

    it('calculates and renders predictions correctly', async () => {
        const today = new Date();
        const d1 = new Date(today); d1.setDate(today.getDate() - 1);
        const d2 = new Date(today); d2.setDate(today.getDate() - 2);
        const d3 = new Date(today); d3.setDate(today.getDate() - 3);

        const d1Str = d1.toISOString().split('T')[0];
        const d2Str = d2.toISOString().split('T')[0];
        const d3Str = d3.toISOString().split('T')[0];

        // Use sales on D-1, D-2, D-3
        // Note: Analysis.jsx logic uses `toISOString().split('T')[0]` on the "today" date logic too.
        // And it creates last3Days based on `today` (Local 00:00 -> UTC iso string).

        // Ideally, we should ensure the mock data matches the logic in Analysis.jsx exactly.
        // Analysis.jsx: 
        // const today = new Date(); today.setHours(0,0,0,0);
        // d.setDate(today.getDate() - i);
        // iso = d.toISOString().split('T')[0];

        // We replicate that logic here to generate matching strings
        const getIsoDate = (offset) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - offset);
            return d.toISOString().split('T')[0];
        };

        const date1 = getIsoDate(1);
        const date2 = getIsoDate(2);
        const date3 = getIsoDate(3);

        const mockSales = [
            { product_name: 'Product A', quantity: 10, sale_date: `${date1}T10:00:00Z`, total_amount: 100 },
            { product_name: 'Product A', quantity: 12, sale_date: `${date2}T10:00:00Z`, total_amount: 120 },
            { product_name: 'Product A', quantity: 14, sale_date: `${date3}T10:00:00Z`, total_amount: 140 },
        ];

        fetch.mockImplementation((url) => {
            if (url.includes('/sales/debts')) return Promise.resolve({ ok: true, json: async () => ({ debts: [] }) });
            if (url.includes('/clients')) return Promise.resolve({ ok: true, json: async () => ({ clients: [] }) });
            if (url.includes('/sales')) return Promise.resolve({ ok: true, json: async () => ({ sales: mockSales }) });
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<Analysis />);

        await waitFor(() => {
            expect(screen.getByText(/Previsão de Vendas/)).toBeInTheDocument();
        });

        // Check for Product A
        // We accept that it might take a moment to render the list
        expect(await screen.findByText('Product A')).toBeInTheDocument();

        // 10, 12, 14 -> Mean 12
        // It should display '12.0 un'
        expect(screen.getByText(/12.0 un/)).toBeInTheDocument();
        // Check for interval format: [9.7, 14.3] (approximate)
        // Mean 12, Var = ((4+0+4)/2) = 4, SD=2. Margin = 1.96 * (2/1.732) = 1.96 * 1.154 = 2.26
        // Range: 9.74 - 14.26
        expect(screen.getByText(/\[9.7, 14.3\]/)).toBeInTheDocument();
    });
});
