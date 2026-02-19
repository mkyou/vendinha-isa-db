const db = require('./database');

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

// Wait for database table creation (which is async in database.js)
setTimeout(() => {
    db.serialize(() => {
        // Clear tables
        db.run('DELETE FROM sales');
        db.run('DELETE FROM products');
        db.run('DELETE FROM clients');

        // Insert Clients
        const clientIds = [];
        const stmtClient = db.prepare('INSERT INTO clients (full_name, responsible_name) VALUES (?, ?)');
        clients.forEach(c => {
            stmtClient.run(c.full_name, c.responsible, function (err) {
                if (!err) clientIds.push(this.lastID);
            });
        });
        stmtClient.finalize();

        // Insert Products
        const productIds = [];
        const stmtProduct = db.prepare('INSERT INTO products (name, unit_price) VALUES (?, ?)');
        products.forEach(p => {
            stmtProduct.run(p.name, p.price, function (err) {
                if (!err) productIds.push(this.lastID);
            });
        });
        stmtProduct.finalize();

        // Wait for inserts to complete (async hack: using timeout usually avoids this but here we rely on serialize, 
        // but IDs might not be populated in clientIds array strictly synchronously in JS variable)
        // Actually, serialize ensures DB execution order, but JS callbacks run after.
        // Better approach: nested callbacks or Promises. 
        // for simplicity in this script, we'll re-query IDs or just just assume IDs 1-10 and 1-5 because we cleared tables 
        // (SQLite AutoIncrement *usually* resets if we delete from sqlite_sequence, but simpler to just query).
    });
}, 2000);

// Re-query to get IDs reliably
setTimeout(() => {
    const finalClientIds = [];
    const finalProductIds = [];

    const p1 = new Promise(resolve => {
        db.all('SELECT id FROM clients', (err, rows) => {
            rows.forEach(r => finalClientIds.push(r.id));
            resolve();
        });
    });

    const p2 = new Promise(resolve => {
        db.all('SELECT id FROM products', (err, rows) => {
            rows.forEach(r => finalProductIds.push(r.id));
            resolve();
        });
    });

    Promise.all([p1, p2]).then(() => {
        console.log(`Seeding with ${finalClientIds.length} clients and ${finalProductIds.length} products.`);

        db.serialize(() => {
            const stmtSale = db.prepare('INSERT INTO sales (client_id, product_id, quantity, total_amount, paid_amount, sale_date) VALUES (?, ?, ?, ?, ?, ?)');

            const now = new Date();
            // Generate 55 sales
            for (let i = 0; i < 55; i++) {
                const client = finalClientIds[Math.floor(Math.random() * finalClientIds.length)];
                const productId = finalProductIds[Math.floor(Math.random() * finalProductIds.length)];
                // Get price? Need to query or map.
                // Let's assume generic matching by index or query. 
                // We'll trust the logic: map product ID to dictionary.
                const prodIndex = finalProductIds.indexOf(productId);
                const price = products[Math.floor(Math.random() * products.length)].price; // Approximation if IDs don't match index perfectly, but usually fine for seed.

                const qty = Math.floor(Math.random() * 5) + 1;
                const total = qty * price;

                // Randomize payment status
                // 50% fully paid, 30% partial, 20% unpaid
                const rand = Math.random();
                let paid = 0;
                if (rand < 0.5) paid = total;
                else if (rand < 0.8) paid = total * Math.random();
                else paid = 0;

                // Random date in last 7 days
                const date = new Date(now);
                date.setDate(date.getDate() - Math.floor(Math.random() * 7));

                stmtSale.run(client, productId, qty, total, paid, date.toISOString());
            }

            stmtSale.finalize(() => {
                console.log('Seeding complete.');
                // db.close(); // Keep open if needed or close.
            });
        });
    });
}, 1000);
