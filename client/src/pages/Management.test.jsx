import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Management from '../pages/Management';
import * as DataContext from '../contexts/DataContext';

vi.mock('../contexts/DataContext', () => ({
    useData: vi.fn(),
}));

global.fetch = vi.fn();
global.alert = vi.fn();
// Mock window.confirm
global.window.confirm = vi.fn(() => true);

describe('Management Component', () => {
    const mockRefreshData = vi.fn();
    const mockVersion = 0;

    beforeEach(() => {
        vi.clearAllMocks();
        DataContext.useData.mockReturnValue({
            refreshData: mockRefreshData,
            version: mockVersion,
        });
    });

    it('renders and fetches data', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ clients: [{ id: 1, full_name: 'Test Client', responsible_name: 'Test Resp' }] })
        });

        render(<Management />);

        await waitFor(() => {
            expect(screen.getByText('Test Client')).toBeInTheDocument();
        });
    });

    it('opens add new client form', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ clients: [] }) });
        render(<Management />);

        await waitFor(() => expect(screen.getByText('Gerenciamento')).toBeInTheDocument());

        const newBtn = screen.getByText('Novo');
        fireEvent.click(newBtn);

        expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
        expect(screen.getByText('Nome Completo')).toBeInTheDocument();
    });

    it('switches tabs', async () => {
        fetch.mockImplementation((url) => {
            if (url.includes('clients')) return Promise.resolve({ ok: true, json: async () => ({ clients: [] }) });
            if (url.includes('products')) return Promise.resolve({ ok: true, json: async () => ({ products: [{ id: 1, name: 'Test Product', unit_price: 10 }] }) });
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<Management />);

        await waitFor(() => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument());

        const productsTab = screen.getByText('Produtos');
        fireEvent.click(productsTab);

        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });
    });
});
