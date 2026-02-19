import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Debts from '../pages/Debts';
import * as DataContext from '../contexts/DataContext';

vi.mock('../contexts/DataContext', () => ({
    useData: vi.fn(),
}));

global.fetch = vi.fn();

describe('Debts Component', () => {
    const mockRefreshData = vi.fn();
    const mockVersion = 0;

    beforeEach(() => {
        vi.clearAllMocks();
        DataContext.useData.mockReturnValue({
            refreshData: mockRefreshData,
            version: mockVersion,
        });
    });

    it('renders debts list', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ debts: [{ client_id: 1, full_name: 'Debtor A', debt: 100, total_bought: 200 }] })
        });

        render(<Debts />);

        await waitFor(() => {
            expect(screen.getByText('Debtor A')).toBeInTheDocument();
            expect(screen.getByText('R$ 100.00')).toBeInTheDocument();
        });
    });

    it('filters debts by search', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                debts: [
                    { client_id: 1, full_name: 'Debtor A', debt: 100, total_bought: 200 },
                    { client_id: 2, full_name: 'Debtor B', debt: 50, total_bought: 100 }
                ]
            })
        });

        render(<Debts />);
        await waitFor(() => expect(screen.getByText('Debtor A')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Pesquisar cliente...');
        fireEvent.change(searchInput, { target: { value: 'Debtor B' } });

        expect(screen.queryByText('Debtor A')).not.toBeInTheDocument();
        expect(screen.getByText('Debtor B')).toBeInTheDocument();
    });
    // - [x] **Debts Sync**: Connect `Debts.jsx` to `DataContext` to ensure it updates when Sales/Clients change. (Fixed bug where details didn't update)
    it('refetches details when version changes while expanded', async () => {
        // Initial render: Version 0
        DataContext.useData.mockReturnValue({ refreshData: mockRefreshData, version: 0 });

        fetch.mockImplementation((url) => {
            if (url.includes('/debts')) {
                return Promise.resolve({
                    ok: true, json: async () => ({
                        debts: [{ client_id: 1, full_name: 'Debtor A', debt: 100, total_bought: 200 }]
                    })
                });
            }
            if (url.includes('client_id=1')) {
                return Promise.resolve({
                    ok: true, json: async () => ({
                        sales: [{ id: 101, total_amount: 50, paid_amount: 0, sale_date: '2023-01-01' }]
                    })
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        const { rerender } = render(<Debts />);

        await waitFor(() => expect(screen.getByText('Debtor A')).toBeInTheDocument());

        // Expand client
        fireEvent.click(screen.getByText('Debtor A'));

        await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('client_id=1')));

        // Simulate new version (e.g. after a sale)
        DataContext.useData.mockReturnValue({ refreshData: mockRefreshData, version: 1 });
        rerender(<Debts />);

        // Expect fetch to be called again for debts AND details
        await waitFor(() => {
            // We expect 3 calls: 
            // 1. Initial debts fetch
            // 2. Expand details fetch
            // 3. Version update -> Debts fetch
            // 4. Version update -> Details fetch (since Expanded)
            // So actually 4 calls total, or at least called more than before.
            // Let's just monitor that the specific details url was called again.
            // Since we can't easily count exact calls with strict mode double invokation potential, checking call arguments is safer.
            // But here checking call count is fine if we are careful.
            expect(fetch).toHaveBeenCalledTimes(4);
        });
    });
});
