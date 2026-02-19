require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const fs = require('fs');
const path = require('path');

const clientRoutes = require('./routes/clients');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for restore

app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);

// Backup Endpoint (Export JSON)
app.get('/api/backup', async (req, res) => {
  try {
    const clients = await db.query('SELECT * FROM clients');
    const products = await db.query('SELECT * FROM products');
    const sales = await db.query('SELECT * FROM sales');

    const backupData = {
      timestamp: new Date().toISOString(),
      clients: clients.rows,
      products: products.rows,
      sales: sales.rows
    };

    res.json(backupData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Restore Endpoint (Import JSON)
app.post('/api/restore', async (req, res) => {
  const { clients, products, sales } = req.body;

  if (!clients || !products || !sales) {
    return res.status(400).json({ error: 'Invalid backup data' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data (Order matters due to FKs)
    await client.query('TRUNCATE sales, products, clients RESTART IDENTITY CASCADE');

    // Helper to insert data
    // We use simple loops for now. Bulk insert would be better but this is fine for small scale.

    // Clients
    for (const c of clients) {
      await client.query('INSERT INTO clients (id, full_name, responsible_name) VALUES ($1, $2, $3)', [c.id, c.full_name, c.responsible_name]);
    }

    // Products
    for (const p of products) {
      await client.query('INSERT INTO products (id, name, unit_price) VALUES ($1, $2, $3)', [p.id, p.name, p.unit_price]);
    }

    // Sales
    for (const s of sales) {
      await client.query('INSERT INTO sales (id, client_id, product_id, quantity, total_amount, paid_amount, sale_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [s.id, s.client_id, s.product_id, s.quantity, s.total_amount, s.paid_amount, s.sale_date]);
    }

    // Update sequences (Important for Postgres!)
    await client.query(`SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients))`);
    await client.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`);
    await client.query(`SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales))`);

    await client.query('COMMIT');
    res.json({ message: 'Restore successful' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Restore failed: ' + err.message });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
