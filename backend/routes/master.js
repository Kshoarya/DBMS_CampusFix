const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/categories
 * Returns all complaint categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await db.query('SELECT * FROM categories ORDER BY category_name ASC');
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/categories (Admin only)
 */
router.post('/categories', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { category_name, default_priority } = req.body;
        if (!category_name) {
            return res.status(400).json({ success: false, message: 'category_name is required' });
        }
        const priority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(default_priority) ? default_priority : 'MEDIUM';
        const result = await db.query(
            'INSERT INTO categories (category_name, default_priority) VALUES (?, ?)',
            [category_name.trim(), priority]
        );
        res.status(201).json({
            success: true,
            data: { category_id: result.insertId, category_name: category_name.trim(), default_priority: priority }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/locations
 * Returns all campus buildings, floors, rooms
 */
router.get('/locations', async (req, res) => {
    try {
        const locations = await db.query('SELECT * FROM locations ORDER BY building, floor_no, room_or_area ASC');
        res.json({ success: true, data: locations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/locations (Admin only)
 */
router.post('/locations', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { building, floor_no, room_or_area } = req.body;
        if (!building || !floor_no || !room_or_area) {
            return res.status(400).json({ success: false, message: 'building, floor_no, and room_or_area are required' });
        }
        const result = await db.query(
            'INSERT INTO locations (building, floor_no, room_or_area) VALUES (?, ?, ?)',
            [building.trim(), floor_no.trim(), room_or_area.trim()]
        );
        res.status(201).json({
            success: true,
            data: { location_id: result.insertId, building, floor_no, room_or_area }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/technicians
 * Returns list of technicians with user info, specialization, and currently active assignments count
 */
router.get('/technicians', authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT t.technician_id, t.user_id, t.specialization,
                   u.name, u.email, u.phone,
                   COUNT(CASE WHEN a.assignment_status = 'ACTIVE' THEN 1 END) AS active_assignments_count
            FROM technicians t
            JOIN users u ON t.user_id = u.user_id
            LEFT JOIN assignments a ON t.technician_id = a.technician_id
            GROUP BY t.technician_id, t.user_id, t.specialization, u.name, u.email, u.phone
            ORDER BY u.name ASC
        `;
        const technicians = await db.query(sql);
        res.json({ success: true, data: technicians });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
