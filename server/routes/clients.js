const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all clients
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clients ORDER BY id ASC');
        res.json({ clients: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single client
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ client: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create client
router.post('/', async (req, res) => {
    const { full_name, responsible_name } = req.body;
    if (!full_name) {
        return res.status(400).json({ error: 'Full name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO clients (full_name, responsible_name) VALUES ($1, $2) RETURNING id',
            [full_name, responsible_name]
        );
        res.json({
            message: 'Client created',
            id: result.rows[0].id,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    const { full_name, responsible_name } = req.body;
    try {
        const result = await db.query(
            'UPDATE clients SET full_name = $1, responsible_name = $2 WHERE id = $3',
            [full_name, responsible_name, req.params.id]
        );
        res.json({
            message: 'Client updated',
            changes: result.rowCount,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
        res.json({ message: 'Client deleted', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
