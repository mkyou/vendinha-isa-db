import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, AlertCircle, Download } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const CardStats = ({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
            width: 50, height: 50, borderRadius: '12px',
            background: color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <Icon size={24} />
        </div>
        <div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>{title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);

const calculatePredictions = (sales) => {
    // 1. Identify the last 3 completed days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last3Days = [];
    for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        last3Days.push(d.toISOString().split('T')[0]);
    }

    // 2. Group by Product -> Date -> Quantity
    const productDailyStats = {};

    sales.forEach(sale => {
        // Handle both Date object (Postgres) and String (SQLite/JSON)
        const dateObj = new Date(sale.sale_date);
        const saleDate = dateObj.toISOString().split('T')[0];

        if (last3Days.includes(saleDate)) {
            if (!productDailyStats[sale.product_name]) {
                productDailyStats[sale.product_name] = {};
                last3Days.forEach(date => productDailyStats[sale.product_name][date] = 0);
            }
            productDailyStats[sale.product_name][saleDate] += sale.quantity;
        }
    });

    // 3. Calculate Stats
    const predictions = Object.entries(productDailyStats).map(([name, dailyMap]) => {
        const quantities = Object.values(dailyMap);
        const mean = quantities.reduce((a, b) => a + b, 0) / 3;

        // Sample Variance (n-1)
        const sampleVariance = quantities.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (3 - 1);
        const stdDev = Math.sqrt(sampleVariance || 0);

        // 95% CI: Mean +/- 1.96 * (StdDev / sqrt(3))
        const marginOfError = 1.96 * (stdDev / Math.sqrt(3));

        const min = Math.max(0, mean - marginOfError);
        const max = mean + marginOfError;

        return {
            name,
            mean,
            min,
            max
        };
    });

    return predictions.sort((a, b) => b.mean - a.mean);
};

const Analysis = () => {
    const { version } = useData(); // Global version trigger

    const [stats, setStats] = useState({
        totalSales: 0,
        totalDebt: 0,
        clientCount: 0,
        salesCount: 0,
        predictions: []
    });

    const fetchStats = async () => {
        try {
            const [salesRes, debtsRes, clientsRes] = await Promise.all([
                fetch('http://localhost:3001/api/sales'),
                fetch('http://localhost:3001/api/sales/debts'),
                fetch('http://localhost:3001/api/clients')
            ]);

            const salesData = await salesRes.json();
            const debtsData = await debtsRes.json();
            const clientsData = await clientsRes.json();

            const sales = salesData.sales || [];
            const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0);
            const totalDebt = (debtsData.debts || []).reduce((acc, d) => acc + d.debt, 0);

            setStats({
                totalSales,
                totalDebt,
                clientCount: (clientsData.clients || []).length,
                salesCount: sales.length,
                predictions: calculatePredictions(sales)
            });

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [version]);

    const handleBackup = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/backup', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                alert(data.message + '\nPath: ' + data.path);
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (err) {
            alert('Erro ao fazer backup');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Análise</h1>
                <button onClick={handleBackup} className="btn btn-secondary">
                    <Download size={18} /> Backup Database
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <CardStats title="Vendas Totais" value={`R$ ${stats.totalSales.toFixed(2)}`} icon={TrendingUp} color="#28a745" />
                <CardStats title="Dívida Ativa" value={`R$ ${stats.totalDebt.toFixed(2)}`} icon={AlertCircle} color="#dc3545" />
                <CardStats title="Clientes" value={stats.clientCount} icon={Users} color="var(--primary)" />
                <CardStats title="Nº Vendas" value={stats.salesCount} icon={BarChart3} color="#ffc107" />
            </div>

            <div className="card">
                <h3>Previsão de Vendas (Base: Médias de 3 dias)</h3>
                {!stats.predictions || stats.predictions.length === 0 ? <p>Sem dados suficientes nos últimos 3 dias.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {stats.predictions.map((pred, index) => (
                            <div key={pred.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '30px', fontWeight: 'bold', color: '#666' }}>#{index + 1}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: '500' }}>{pred.name}</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                            {pred.mean.toFixed(1)} un
                                            <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>
                                                {' '} [{pred.min.toFixed(1)}, {pred.max.toFixed(1)}]
                                            </span>
                                        </span>
                                    </div>
                                    <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min((pred.mean / (stats.predictions[0].mean || 1)) * 100, 100)}%`,
                                            background: 'var(--primary)'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analysis;
