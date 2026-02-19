import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ShoppingBag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { calculatePaymentDistribution } from '../utils/calculations.js';

const Sales = () => {
    const { clients, products, loading, refreshData } = useData();

    const [selectedClient, setSelectedClient] = useState('');
    const [saleItems, setSaleItems] = useState([{ product_id: '', quantity: 1, price: 0, total: 0 }]);
    const [paidAmount, setPaidAmount] = useState('');
    const [status, setStatus] = useState(''); // 'success', 'error', ''

    // Calculations
    const grandTotal = saleItems.reduce((acc, item) => acc + item.total, 0);

    const handleProductChange = (index, productId) => {
        const product = products.find(p => p.id === parseInt(productId));
        const newItems = [...saleItems];
        newItems[index].product_id = productId;
        newItems[index].price = product ? product.unit_price : 0;
        newItems[index].total = newItems[index].quantity * newItems[index].price;
        setSaleItems(newItems);
    };

    const handleQuantityChange = (index, qty) => {
        const newItems = [...saleItems];
        newItems[index].quantity = parseInt(qty) || 0;
        newItems[index].total = newItems[index].quantity * newItems[index].price;
        setSaleItems(newItems);
    };

    const addItem = () => {
        setSaleItems([...saleItems, { product_id: '', quantity: 1, price: 0, total: 0 }]);
    };

    const removeItem = (index) => {
        if (saleItems.length === 1) return;
        const newItems = saleItems.filter((_, i) => i !== index);
        setSaleItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClient) {
            alert('Selecione um cliente');
            return;
        }

        const totalPaid = parseFloat(paidAmount || grandTotal);

        // Use utility function for calculation
        const distributedItems = calculatePaymentDistribution(saleItems, totalPaid);

        const payload = distributedItems.map(item => ({
            client_id: parseInt(selectedClient),
            product_id: parseInt(item.product_id),
            quantity: item.quantity,
            total_amount: item.total,
            paid_amount: item.paid_amount,
            sale_date: new Date().toISOString()
        }));

        try {
            const res = await fetch('http://localhost:3001/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStatus('success');
                // Reset form
                setSaleItems([{ product_id: '', quantity: 1, price: 0, total: 0 }]);
                setPaidAmount('');
                setSelectedClient(''); // Reset client as requested
                refreshData(); // Trigger global update
                setTimeout(() => setStatus(''), 3000);
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="container">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={32} color="var(--primary)" />
                Nova Venda
            </h1>

            {status === 'success' && (
                <div style={{ padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
                    Venda realizada com sucesso!
                </div>
            )}

            {status === 'error' && (
                <div style={{ padding: '15px', background: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '20px' }}>
                    Erro ao salvar venda. Verifique os dados.
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>

                {/* Client Selection */}
                <div className="card">
                    <h3>Cliente</h3>
                    <select
                        data-testid="client-select"
                        value={selectedClient}
                        onChange={e => setSelectedClient(e.target.value)}
                        style={{ fontSize: '1.1rem', padding: '12px' }}
                        required
                    >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.id} - {client.full_name} {client.responsible_name ? `(${client.responsible_name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Products Table */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Itens da Venda</h3>
                        <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
                            <Plus size={16} /> Adicionar Item
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {saleItems.map((item, index) => (
                            <div key={index} style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(150px, 3fr) 80px 80px 80px 40px',
                                gap: '10px',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.5)',
                                padding: '10px',
                                borderRadius: '8px'
                            }}>
                                {/* Product Name */}
                                <select
                                    data-testid={`product-select-${index}`}
                                    value={item.product_id}
                                    onChange={e => handleProductChange(index, e.target.value)}
                                    required
                                >
                                    <option value="">Produto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>

                                {/* Price (Read only visualization) */}
                                <div style={{ textAlign: 'right', color: '#666' }}>
                                    R$ {item.price.toFixed(2)}
                                </div>

                                {/* Quantity */}
                                <input
                                    data-testid={`quantity-input-${index}`}
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => handleQuantityChange(index, e.target.value)}
                                    placeholder="Qtd"
                                />

                                {/* Total */}
                                <div data-testid={`item-total-${index}`} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    R$ {item.total.toFixed(2)}
                                </div>

                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    style={{ color: '#dc3545', background: 'none' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div data-testid="grand-total" style={{ marginTop: '20px', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        Total: R$ {grandTotal.toFixed(2)}
                    </div>
                </div>

                {/* Payment */}
                <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: 'white', margin: 0 }}>Pagamento (R$)</h3>
                        <div style={{ width: '200px' }}>
                            <input
                                type="number"
                                step="0.01"
                                placeholder={`Total: ${grandTotal.toFixed(2)}`}
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                                style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}
                            />
                            <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.9, textAlign: 'right' }}>
                                {paidAmount && parseFloat(paidAmount) < grandTotal
                                    ? `Fiado: R$ ${(grandTotal - parseFloat(paidAmount)).toFixed(2)}`
                                    : 'Pagamento Integral'}
                            </div>
                        </div>
                    </div>
                </div>

                <button data-testid="submit-btn" type="submit" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '15px' }}>
                    <Save size={20} /> Finalizar Venda
                </button>

            </form>
        </div>
    );
};
export default Sales;
