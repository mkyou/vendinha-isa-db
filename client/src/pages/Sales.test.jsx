import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Sales from '../pages/Sales';
import * as DataContext from '../contexts/DataContext';

// Mock DataContext
vi.mock('../contexts/DataContext', () => ({
    useData: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('Sales Component', () => {
    const mockRefreshData = vi.fn();
    const mockClients = [
        { id: 1, full_name: 'Client A', responsible_name: 'Resp A' },
        { id: 2, full_name: 'Client B', responsible_name: '' },
    ];
    const mockProducts = [
        { id: 101, name: 'Product X', unit_price: 10.0 },
        { id: 102, name: 'Product Y', unit_price: 20.0 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        DataContext.useData.mockReturnValue({
            clients: mockClients,
            products: mockProducts,
            loading: false,
            refreshData: mockRefreshData,
        });
    });

    it('renders correctly', () => {
        render(<Sales />);
        expect(screen.getByText('Nova Venda')).toBeInTheDocument();
        expect(screen.getByTestId('client-select')).toBeInTheDocument();
        expect(screen.getByTestId('grand-total')).toHaveTextContent('Total: R$ 0.00');
    });

    it('allows selecting a client', async () => {
        render(<Sales />);
        const clientSelect = screen.getByTestId('client-select');
        fireEvent.change(clientSelect, { target: { value: '1' } });
        expect(clientSelect.value).toBe('1');
    });

    it('calculates total when product and quantity change', () => {
        render(<Sales />);

        const productSelect = screen.getByTestId('product-select-0');
        fireEvent.change(productSelect, { target: { value: '101' } }); // Product X (10.0)

        expect(screen.getByTestId('item-total-0')).toHaveTextContent('R$ 10.00');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('Total: R$ 10.00');

        const qtyInput = screen.getByTestId('quantity-input-0');
        fireEvent.change(qtyInput, { target: { value: '2' } });

        expect(screen.getByTestId('item-total-0')).toHaveTextContent('R$ 20.00');
        expect(screen.getByTestId('grand-total')).toHaveTextContent('Total: R$ 20.00');
    });

    it('submits the form successfully', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

        render(<Sales />);

        fireEvent.change(screen.getByTestId('client-select'), { target: { value: '1' } });
        fireEvent.change(screen.getByTestId('product-select-0'), { target: { value: '101' } });

        const submitBtn = screen.getByTestId('submit-btn');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/sales', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"client_id":1'),
            }));
        });

        await waitFor(() => {
            expect(screen.getByText('Venda realizada com sucesso!')).toBeInTheDocument();
        });
    });
});
