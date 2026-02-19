import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Wallet, ArrowUpDown, CheckCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Debts = () => {
    const { version, refreshData } = useData(); // Global version trigger
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedClient, setExpandedClient] = useState(null);
    const [clientDetails, setClientDetails] = useState({}); // Cache for details
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });

    const fetchClientDetails = async (clientId) => {
        try {
            const res = await fetch(`http://localhost:3001/api/sales?client_id=${clientId}`);
            const data = await res.json();
            const debtSales = (data.sales || []).filter(s => (s.total_amount - s.paid_amount) > 0.01);
            setClientDetails(prev => ({ ...prev, [clientId]: debtSales }));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetch('http://localhost:3001/api/sales/debts')
            .then(res => res.json())
            .then(data => {
                setDebts(data.debts || []);
                setLoading(false);
            })
            .catch(err => console.error(err));

        // Sync: Refresh details if expanded, otherwise clear cache
        if (expandedClient) {
            fetchClientDetails(expandedClient);
        } else {
            setClientDetails({});
        }
    }, [version]);

    const toggleClient = async (clientId) => {
        if (expandedClient === clientId) {
            setExpandedClient(null);
            return;
        }

        setExpandedClient(clientId);

        if (!clientDetails[clientId]) {
            fetchClientDetails(clientId);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedDebts = [...debts].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredDebts = sortedDebts.filter(debt =>
        (debt.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Carregando dívidas...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1><Wallet color="var(--primary)" size={32} style={{ verticalAlign: 'middle' }} /> Caderno de Fiado</h1>
            </div>

            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Pesquisar cliente..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                />
                <button onClick={() => handleSort('full_name')} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    <ArrowUpDown size={16} /> Nome {sortConfig.key === 'full_name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </button>
                <button onClick={() => handleSort('debt')} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    <ArrowUpDown size={16} /> Dívida {sortConfig.key === 'debt' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </button>
            </div>

            {filteredDebts.length === 0 ? (
                <div className="card">Nenhuma dívida encontrada.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '5px' }}>
                    {filteredDebts.map(debt => (
                        <div key={debt.client_id} className="card" style={{ padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                            <div
                                onClick={() => toggleClient(debt.client_id)}
                                style={{
                                    padding: '15px 20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.8)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {expandedClient === debt.client_id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    <div>
                                        <h3 style={{ margin: 0 }}>{debt.full_name}</h3>
                                        <small style={{ color: '#666' }}>Total Comprado: R$ {debt.total_bought.toFixed(2)}</small>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Dívida Total</div>
                                    <div style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        R$ {debt.debt.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedClient === debt.client_id && (
                                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0 20px 20px 20px' }}>
                                    <div style={{ borderTop: '1px solid #ddd', margin: '10px 0' }}></div>

                                    {!clientDetails[debt.client_id] ? (
                                        <div>Carregando detalhes...</div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', color: '#666' }}>
                                                    <th style={{ padding: '8px' }}>Data</th>
                                                    <th style={{ padding: '8px' }}>Produto</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Valor</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Pago</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Deve</th>
                                                    <th style={{ padding: '8px', textAlign: 'right' }}>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clientDetails[debt.client_id].map(sale => {
                                                    const saleDebt = sale.total_amount - sale.paid_amount;
                                                    return (
                                                        <tr key={sale.id} style={{ borderBottom: '1px solid #eee' }}>
                                                            <td style={{ padding: '8px' }}>{new Date(sale.sale_date).toLocaleDateString()}</td>
                                                            <td style={{ padding: '8px' }}>{sale.product_name} <span style={{ opacity: 0.6 }}>x{sale.quantity}</span></td>
                                                            <td style={{ padding: '8px', textAlign: 'right' }}>{sale.total_amount.toFixed(2)}</td>
                                                            <td style={{ padding: '8px', textAlign: 'right' }}>{sale.paid_amount.toFixed(2)}</td>
                                                            <td style={{ padding: '8px', textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                                                                {saleDebt.toFixed(2)}
                                                            </td>
                                                            <td style={{ padding: '8px', textAlign: 'right' }}>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    style={{ background: '#28a745', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                                    title="Quitar esta conta"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (!window.confirm(`Confirmar o pagamento total de R$ ${saleDebt.toFixed(2)}?`)) return;

                                                                        try {
                                                                            const res = await fetch(`http://localhost:3001/api/sales/${sale.id}`, {
                                                                                method: 'PUT',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    paid_amount: sale.total_amount
                                                                                })
                                                                            });

                                                                            if (res.ok) {
                                                                                // Refresh local details
                                                                                fetchClientDetails(debt.client_id);
                                                                                // Refresh global context (debts list totals)
                                                                                refreshData();
                                                                            }
                                                                        } catch (err) {
                                                                            alert('Erro ao processar pagamento');
                                                                        }
                                                                    }}
                                                                >
                                                                    <CheckCircle size={14} /> Quitar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Debts;
