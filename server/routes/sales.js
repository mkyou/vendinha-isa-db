const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all sales (can filter by client_id in query)
router.get('/', async (req, res) => {
    const { client_id } = req.query;
    let sql = `
    SELECT sales.*, 
           clients.full_name as client_name, 
           products.name as product_name 
    FROM sales
    LEFT JOIN clients ON sales.client_id = clients.id
    LEFT JOIN products ON sales.product_id = products.id
  `;
    const params = [];

    if (client_id) {
        sql += ' WHERE sales.client_id = $1';
        params.push(client_id);
    }

    sql += ' ORDER BY sale_date DESC';

    try {
        const result = await db.query(sql, params);
        res.json({ sales: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new sale(s)
router.post('/', async (req, res) => {
    const body = req.body;
    const sales = Array.isArray(body) ? body : [body];

    if (sales.length === 0) {
        return res.status(400).json({ error: 'No sales data provided' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        for (const sale of sales) {
            // Basic validation
            if (!sale.client_id || !sale.product_id || !sale.quantity) {
                // We'll throw to rollback everything if strict, or just skip? 
                // Let's throw to be safe and consistent with previous transaction logic
                throw new Error(`Invalid data for product_id: ${sale.product_id}`);
            }

            const date = sale.sale_date || new Date().toISOString();

            await client.query(
                `INSERT INTO sales (client_id, product_id, quantity, total_amount, paid_amount, sale_date) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    sale.client_id,
                    sale.product_id,
                    sale.quantity,
                    sale.total_amount,
                    sale.paid_amount || 0,
                    date
                ]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Sales recorded successfully', count: sales.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Transaction failed: ' + err.message });
    } finally {
        client.release();
    }
});

// Get debts summary
router.get('/debts', async (req, res) => {
    const sql = `
    SELECT 
      clients.id as client_id,
      clients.full_name,
      SUM(sales.total_amount) as total_bought,
      SUM(sales.paid_amount) as total_paid,
      (SUM(sales.total_amount) - SUM(sales.paid_amount)) as debt
    FROM sales
    JOIN clients ON sales.client_id = clients.id
    GROUP BY clients.id
    HAVING (SUM(sales.total_amount) - SUM(sales.paid_amount)) > 0.01
    ORDER BY debt DESC
  `;

    try {
        const result = await db.query(sql);
        res.json({ debts: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update sale
router.put('/:id', async (req, res) => {
    const { quantity, total_amount, paid_amount } = req.body;

    // Using COALESCE logic with Postgres
    const sql = `UPDATE sales SET 
    quantity = COALESCE($1, quantity), 
    total_amount = COALESCE($2, total_amount), 
    paid_amount = COALESCE($3, paid_amount)
    WHERE id = $4`;

    const params = [
        quantity !== undefined ? quantity : null,
        total_amount !== undefined ? total_amount : null,
        paid_amount !== undefined ? paid_amount : null,
        req.params.id
    ];

    try {
        const result = await db.query(sql, params);
        res.json({
            message: 'Sale updated',
            changes: result.rowCount,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete sale
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
        res.json({ message: 'Sale deleted', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
