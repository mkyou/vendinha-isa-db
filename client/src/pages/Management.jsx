import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Search, Download, Upload, ArrowUpDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Tabs = ({ active, onChange }) => (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
            onClick={() => onChange('clients')}
            className={`btn ${active === 'clients' ? 'btn-primary' : 'btn-secondary'}`}
        >
            Clientes
        </button>
        <button
            onClick={() => onChange('products')}
            className={`btn ${active === 'products' ? 'btn-primary' : 'btn-secondary'}`}
        >
            Produtos
        </button>
        <button
            onClick={() => onChange('sales')}
            className={`btn ${active === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
        >
            Vendas
        </button>
    </div>
);

const Management = () => {
    const { clients, products, refreshData, version } = useData();
    const [tab, setTab] = useState('clients');
    // For sales, we still fetch locally as it's not in global context
    const [sales, setSales] = useState([]);

    // Derived data source based on tab
    const getData = () => {
        if (tab === 'clients') return clients;
        if (tab === 'products') return products;
        if (tab === 'sales') return sales;
        return [];
    };

    // We treat 'data' as valid for rendering, but we only fetch 'sales' manually
    const data = getData();

    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [formData, setFormData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/sales`);
            const json = await res.json();
            setSales(json.sales || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch sales manually. Clients/Products are auto-fetched by Context.
        if (tab === 'sales') {
            fetchSales();
        }
    }, [tab, version]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Sort and Filter
    const sortedData = [...data].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredData = sortedData.filter(item => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();

        if (tab === 'clients') {
            return (item.full_name?.toLowerCase() || '').includes(lowerSearch) ||
                (item.responsible_name?.toLowerCase() || '').includes(lowerSearch);
        }
        if (tab === 'products') {
            return (item.name?.toLowerCase() || '').includes(lowerSearch);
        }
        if (tab === 'sales') {
            return (item.client_name?.toLowerCase() || '').includes(lowerSearch) ||
                (item.product_name?.toLowerCase() || '').includes(lowerSearch);
        }
        return true;
    });

    useEffect(() => {

        setEditingItem(null);
        setIsNew(false);
        // Default sorts
        if (tab === 'sales') setSortConfig({ key: 'sale_date', direction: 'desc' });
        else if (tab === 'clients') setSortConfig({ key: 'full_name', direction: 'asc' });
        else setSortConfig({ key: 'name', direction: 'asc' });
    }, [tab, version]); // Refetch when tab changes OR global version changes

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setIsNew(false);
    };

    const handleBackup = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/backup', { method: 'POST' });
            const json = await res.json();
            if (res.ok) {
                alert(`Backup criado com sucesso em: ${json.path}`);
            } else {
                alert('Erro ao criar backup');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão');
        }
    };

    const handleAddNew = () => {
        if (tab === 'sales') {
            alert('Para adicionar vendas, utilize a tela "Vendas". Aqui é apenas para manutenção.');
            return;
        }
        const empty = tab === 'clients' ? { full_name: '', responsible_name: '' } : { name: '', unit_price: '' };
        setEditingItem(empty);
        setFormData(empty);
        setIsNew(true);
    };

    const handleDelete = async (id) => {
        const item = data.find(i => i.id === id);
        const name = item ? (item.full_name || item.name || `Venda #${item.id}`) : 'este item';

        if (!window.confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
        try {
            await fetch(`http://localhost:3001/api/${tab}/${id}`, { method: 'DELETE' });
            if (tab === 'sales') fetchSales();
            refreshData(); // Notify other components
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const url = isNew ? `http://localhost:3001/api/${tab}` : `http://localhost:3001/api/${tab}/${editingItem.id}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (res.ok) {
                setEditingItem(null);
                if (tab === 'sales') fetchSales();
                refreshData(); // Notify other components
            } else {
                alert('Erro ao salvar: ' + (json.error || 'Erro desconhecido'));
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão ao salvar.');
        }
    };

    if (loading && !data.length) return <div>Carregando...</div>;


    const SortableHeader = ({ label, sortKey }) => (
        <th
            style={{ padding: '15px', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => handleSort(sortKey)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {label}
                {sortConfig.key === sortKey && (
                    <span style={{ fontSize: '0.8em' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                )}
                {sortConfig.key !== sortKey && <ArrowUpDown size={14} color="#ccc" />}
            </div>
        </th>
    );

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Gerenciamento</h1>
                {!editingItem && tab !== 'sales' && (
                    <button onClick={handleAddNew} className="btn btn-primary">
                        <Plus size={20} /> Novo
                    </button>
                )}
            </div>

            <Tabs active={tab} onChange={setTab} />

            {!editingItem && (
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 40px',
                                fontSize: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px'
                            }}
                        />
                    </div>
                </div>
            )}

            {editingItem ? (
                <div className="card">
                    <h2>{isNew ? 'Novo' : 'Editar'} {tab === 'clients' ? 'Cliente' : (tab === 'products' ? 'Produto' : 'Venda')}</h2>
                    <form onSubmit={handleSave} style={{ display: 'grid', gap: '15px' }}>
                        {tab === 'clients' && (
                            <>
                                <div>
                                    <label>Nome Completo</label>
                                    <input
                                        value={formData.full_name || ''}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Nome do Responsável (Opcional)</label>
                                    <input
                                        value={formData.responsible_name || ''}
                                        onChange={e => setFormData({ ...formData, responsible_name: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        {tab === 'products' && (
                            <>
                                <div>
                                    <label>Nome do Produto</label>
                                    <input
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Preço Unitário (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={formData.unit_price || ''}
                                        onChange={e => setFormData({ ...formData, unit_price: e.target.value })}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {tab === 'sales' && (
                            <>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                                    Editando venda de <strong>{formData.product_name}</strong> para <strong>{formData.client_name}</strong> em {new Date(formData.sale_date).toLocaleDateString()}.
                                </div>
                                <div>
                                    <label>Quantidade</label>
                                    <input
                                        type="number"
                                        value={formData.quantity || ''}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>Valor Total (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={formData.total_amount || ''}
                                        onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>Valor Pago (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={formData.paid_amount || ''}
                                        onChange={e => setFormData({ ...formData, paid_amount: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setEditingItem(null)} className="btn btn-secondary">Cancelar</button>
                            <button type="submit" className="btn btn-primary"><Save size={18} /> Salvar</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1, boxShadow: '0 2px 2px rgba(0,0,0,0.05)' }}>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <SortableHeader label="ID" sortKey="id" />
                                    {tab === 'clients' && (
                                        <>
                                            <SortableHeader label="Nome" sortKey="full_name" />
                                            <SortableHeader label="Responsável" sortKey="responsible_name" />
                                        </>
                                    )}
                                    {tab === 'products' && (
                                        <>
                                            <SortableHeader label="Nome" sortKey="name" />
                                            <SortableHeader label="Preço" sortKey="unit_price" />
                                        </>
                                    )}
                                    {tab === 'sales' && (
                                        <>
                                            <SortableHeader label="Data" sortKey="sale_date" />
                                            <SortableHeader label="Cliente" sortKey="client_name" />
                                            <SortableHeader label="Produto" sortKey="product_name" />
                                            <SortableHeader label="Total" sortKey="total_amount" />
                                            <SortableHeader label="Pago" sortKey="paid_amount" />
                                            <th style={{ padding: '15px' }}>Fiado</th>
                                        </>
                                    )}
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px', color: '#888' }}>#{item.id}</td>

                                        {tab === 'clients' && (
                                            <>
                                                <td style={{ padding: '15px', fontWeight: '500' }}>{item.full_name}</td>
                                                <td style={{ padding: '15px', color: '#666' }}>{item.responsible_name || '-'}</td>
                                            </>
                                        )}

                                        {tab === 'products' && (
                                            <>
                                                <td style={{ padding: '15px', fontWeight: '500' }}>{item.name}</td>
                                                <td style={{ padding: '15px' }}>R$ {(item.unit_price || 0).toFixed(2)}</td>
                                            </>
                                        )}

                                        {tab === 'sales' && (
                                            <>
                                                <td style={{ padding: '15px' }}>{new Date(item.sale_date).toLocaleDateString()} <small style={{ color: '#999' }}>{new Date(item.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></td>
                                                <td style={{ padding: '15px' }}>{item.client_name}</td>
                                                <td style={{ padding: '15px' }}>
                                                    {item.product_name} <span style={{ fontSize: '0.85em', color: '#666' }}>x{item.quantity}</span>
                                                </td>
                                                <td style={{ padding: '15px', fontWeight: 'bold' }}>R$ {(item.total_amount || 0).toFixed(2)}</td>
                                                <td style={{ padding: '15px', color: '#28a745' }}>R$ {(item.paid_amount || 0).toFixed(2)}</td>
                                                <td style={{ padding: '15px', color: '#dc3545', fontWeight: 'bold' }}>
                                                    {((item.total_amount || 0) - (item.paid_amount || 0)) > 0.01 ? `R$ ${((item.total_amount || 0) - (item.paid_amount || 0)).toFixed(2)}` : '-'}
                                                </td>
                                            </>
                                        )}

                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleEdit(item)} className="btn btn-secondary btn-sm" title="Editar">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="btn btn-sm" style={{ color: '#dc3545', border: '1px solid #dc3545' }} title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                                            Nenhum registro encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Management;
