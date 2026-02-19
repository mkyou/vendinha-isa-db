const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all products
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY name ASC');
        res.json({ products: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create product
router.post('/', async (req, res) => {
    const { name, unit_price } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO products (name, unit_price) VALUES ($1, $2) RETURNING id',
            [name, unit_price]
        );
        res.json({
            message: 'Product created',
            id: result.rows[0].id,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    const { name, unit_price } = req.body;
    try {
        const result = await db.query(
            'UPDATE products SET name = $1, unit_price = $2 WHERE id = $3',
            [name, unit_price, req.params.id]
        );
        res.json({
            message: 'Product updated',
            changes: result.rowCount,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Product deleted', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
