require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const clients = [
    { full_name: 'Maria Silva', responsible: 'Maria' },
    { full_name: 'João Santos', responsible: 'João' },
    { full_name: 'Ana Oliveira', responsible: 'Ana' },
    { full_name: 'Carlos Pereira', responsible: 'Carlos' },
    { full_name: 'Beatriz Almeida', responsible: 'Bia' },
    { full_name: 'Fernando Costa', responsible: 'Fernando' },
    { full_name: 'Juliana Lima', responsible: 'Ju' },
    { full_name: 'Roberto Ferreira', responsible: 'Beto' },
    { full_name: 'Patrícia Gomes', responsible: 'Paty' },
    { full_name: 'Ricardo Martins', responsible: 'Rick' }
];

const products = [
    { name: 'Pão Francês', price: 0.50 },
    { name: 'Leite 1L', price: 4.50 },
    { name: 'Manteiga 200g', price: 9.00 },
    { name: 'Café 500g', price: 15.00 },
    { name: 'Açúcar 1kg', price: 5.00 }
];

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Cleaning tables...');

        // Order matters for FK
        await client.query('TRUNCATE sales, products, clients RESTART IDENTITY CASCADE');

        console.log('Inserting Clients...');
        const clientIds = [];
        for (const c of clients) {
            const res = await client.query(
                'INSERT INTO clients (full_name, responsible_name) VALUES ($1, $2) RETURNING id',
                [c.full_name, c.responsible]
            );
            clientIds.push(res.rows[0].id);
        }

        console.log('Inserting Products...');
        const productIds = [];
        for (const p of products) {
            const res = await client.query(
                'INSERT INTO products (name, unit_price) VALUES ($1, $2) RETURNING id',
                [p.name, p.price]
            );
            productIds.push(res.rows[0].id);
        }

        console.log('Generating Sales...');
        const now = new Date();
        for (let i = 0; i < 55; i++) {
            const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
            const prodIndex = Math.floor(Math.random() * products.length); // Use index to match product and price source
            const productId = productIds[prodIndex];
            const price = products[prodIndex].price;

            const qty = Math.floor(Math.random() * 5) + 1;
            const total = Number((qty * price).toFixed(2));

            // Randomize payment status
            const rand = Math.random();
            let paid = 0;
            if (rand < 0.5) paid = total;
            else if (rand < 0.8) paid = Number((total * Math.random()).toFixed(2));
            else paid = 0;

            // Random date in last 7 days
            const date = new Date(now);
            date.setDate(date.getDate() - Math.floor(Math.random() * 7));

            await client.query(
                'INSERT INTO sales (client_id, product_id, quantity, total_amount, paid_amount, sale_date) VALUES ($1, $2, $3, $4, $5, $6)',
                [clientId, productId, qty, total, paid, date.toISOString()]
            );
        }

        await client.query('COMMIT');
        console.log('Seeding Complete!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Seeding failed', e);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
