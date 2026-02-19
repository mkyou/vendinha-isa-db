
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const NUM_CLIENTS = 100;
const NUM_SALES = 1000;

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

db.serialize(() => {
    // Clear existing
    // DROP tables to ensure schema update (Foreign Keys)
    db.run("DROP TABLE IF EXISTS sales");
    db.run("DROP TABLE IF EXISTS products");
    db.run("DROP TABLE IF EXISTS clients");

    // Re-create tables with ON DELETE CASCADE
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      responsible_name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit_price REAL NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      total_amount REAL,
      paid_amount REAL,
      sale_date TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )`);

    // Enable FK
    db.run("PRAGMA foreign_keys = ON;");

    // Clients
    const clients = [];
    for (let i = 1; i <= NUM_CLIENTS; i++) {
        clients.push([`Cliente ${i}`, `Responsável ${i}`, `1199999${i.toString().padStart(4, '0')}`]);
    }

    const clientStmt = db.prepare("INSERT INTO clients (full_name, responsible_name) VALUES (?, ?)");
    clients.forEach(c => clientStmt.run(c[0], c[1]));
    clientStmt.finalize();
    console.log(`${NUM_CLIENTS} clientes inseridos.`);

    // Products
    const products = [
        ['Cerveja Lata', 5.00],
        ['Refrigerante 2L', 12.00],
        ['Água Mineral', 3.00],
        ['Salgadinho', 6.50],
        ['Doce de Leite', 15.00],
        ['Paçoca', 1.50],
        ['Gelo', 10.00],
        ['Carvão', 25.00]
    ];

    const prodStmt = db.prepare("INSERT INTO products (name, unit_price) VALUES (?, ?)");
    products.forEach(p => prodStmt.run(p));
    prodStmt.finalize();
    console.log(`${products.length} produtos inseridos.`);

    // Sales
    const saleStmt = db.prepare("INSERT INTO sales (client_id, product_id, quantity, total_amount, paid_amount, sale_date) VALUES (?, ?, ?, ?, ?, ?)");

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < NUM_SALES; i++) {
        const client_id = Math.floor(Math.random() * NUM_CLIENTS) + 1;
        const product_idx = Math.floor(Math.random() * products.length);
        const product_price = products[product_idx][1];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const total = parseFloat((product_price * quantity).toFixed(2));

        // Randomly decide if paid fully, partially, or unpaid
        const rand = Math.random();
        let paid = 0;
        if (rand > 0.6) { // 40% full payment
            paid = total;
        } else if (rand > 0.3) { // 30% partial
            paid = parseFloat((Math.random() * total).toFixed(2));
        } else { // 30% unpaid
            paid = 0;
        }

        const date = randomDate(oneWeekAgo, now);

        saleStmt.run(client_id, product_idx + 1, quantity, total, paid, date);
    }
    saleStmt.finalize();

    console.log(`${NUM_SALES} vendas inseridas.`);

});

db.close();
