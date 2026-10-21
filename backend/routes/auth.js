const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Supports Student, Admin, Technician registration according to ISA disjoint specialization
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, user_type, registration_no, specialization } = req.body;

        if (!name || !email || !password || !user_type) {
            return res.status(400).json({ success: false, message: 'Name, email, password, and user_type are required.' });
        }

        const validTypes = ['STUDENT', 'ADMIN', 'TECHNICIAN'];
        if (!validTypes.includes(user_type)) {
            return res.status(400).json({ success: false, message: 'Invalid user_type. Must be STUDENT, ADMIN, or TECHNICIAN.' });
        }

        if (user_type === 'STUDENT' && !registration_no) {
            return res.status(400).json({ success: false, message: 'registration_no is required for students.' });
        }

        if (user_type === 'TECHNICIAN' && !specialization) {
            return res.status(400).json({ success: false, message: 'specialization is required for technicians.' });
        }

        // Check duplicate email
        const existingUsers = await db.query('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
        }

        // If student, check duplicate registration_no
        if (user_type === 'STUDENT') {
            const existingReg = await db.query('SELECT student_id FROM students WHERE registration_no = ?', [registration_no.trim()]);
            if (existingReg.length > 0) {
                return res.status(409).json({ success: false, message: 'A student with this registration number already exists.' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Execute in transaction
        let resultUser = null;
        await db.transaction(async (txQuery) => {
            const userRes = await txQuery(
                `INSERT INTO users (name, email, phone, password_hash, user_type) VALUES (?, ?, ?, ?, ?)`,
                [name.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null, password_hash, user_type]
            );

            const userId = userRes.insertId;

            if (user_type === 'STUDENT') {
                const sRes = await txQuery(
                    `INSERT INTO students (user_id, registration_no) VALUES (?, ?)`,
                    [userId, registration_no.trim()]
                );
                resultUser = { user_id: userId, name, email, user_type, student_id: sRes.insertId, registration_no };
            } else if (user_type === 'ADMIN') {
                const aRes = await txQuery(
                    `INSERT INTO admins (user_id) VALUES (?)`,
                    [userId]
                );
                resultUser = { user_id: userId, name, email, user_type, admin_id: aRes.insertId };
            } else if (user_type === 'TECHNICIAN') {
                const tRes = await txQuery(
                    `INSERT INTO technicians (user_id, specialization) VALUES (?, ?)`,
                    [userId, specialization.trim()]
                );
                resultUser = { user_id: userId, name, email, user_type, technician_id: tRes.insertId, specialization };
            }
        });

        // Sign token
        const token = jwt.sign(
            { user_id: resultUser.user_id, email: resultUser.email, user_type: resultUser.user_type },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: resultUser
        });

    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ success: false, message: 'Error registering user: ' + err.message });
    }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const users = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Get subtype details
        let subtypeInfo = {};
        if (user.user_type === 'STUDENT') {
            const students = await db.query('SELECT student_id, registration_no FROM students WHERE user_id = ?', [user.user_id]);
            if (students.length > 0) {
                subtypeInfo = students[0];
            }
        } else if (user.user_type === 'ADMIN') {
            const admins = await db.query('SELECT admin_id FROM admins WHERE user_id = ?', [user.user_id]);
            if (admins.length > 0) {
                subtypeInfo = admins[0];
            }
        } else if (user.user_type === 'TECHNICIAN') {
            const techs = await db.query('SELECT technician_id, specialization FROM technicians WHERE user_id = ?', [user.user_id]);
            if (techs.length > 0) {
                subtypeInfo = techs[0];
            }
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, user_type: user.user_type },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const safeUser = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            user_type: user.user_type,
            ...subtypeInfo
        };

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: safeUser
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

/**
 * GET /api/auth/demo-users
 * Convenient demo credentials for project evaluation
 */
router.get('/demo-users', async (req, res) => {
    try {
        const users = await db.query(`
            SELECT u.user_id, u.name, u.email, u.user_type,
                   s.student_id, s.registration_no,
                   a.admin_id,
                   t.technician_id, t.specialization
            FROM users u
            LEFT JOIN students s ON u.user_id = s.user_id
            LEFT JOIN admins a ON u.user_id = a.user_id
            LEFT JOIN technicians t ON u.user_id = t.user_id
            ORDER BY u.user_type, u.user_id
        `);

        res.json({
            success: true,
            defaultPassword: 'password123',
            users
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
