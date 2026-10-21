const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_campus_maintenance_jwt_key_2026_xyz!';

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch fresh user data with subtype info
        const users = await db.query('SELECT user_id, name, email, phone, user_type FROM users WHERE user_id = ?', [decoded.user_id]);
        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found or deleted.' });
        }

        const user = users[0];

        // Enrich with subtype specific ID
        if (user.user_type === 'STUDENT') {
            const students = await db.query('SELECT student_id, registration_no FROM students WHERE user_id = ?', [user.user_id]);
            if (students.length > 0) {
                user.student_id = students[0].student_id;
                user.registration_no = students[0].registration_no;
            }
        } else if (user.user_type === 'ADMIN') {
            const admins = await db.query('SELECT admin_id FROM admins WHERE user_id = ?', [user.user_id]);
            if (admins.length > 0) {
                user.admin_id = admins[0].admin_id;
            }
        } else if (user.user_type === 'TECHNICIAN') {
            const techs = await db.query('SELECT technician_id, specialization FROM technicians WHERE user_id = ?', [user.user_id]);
            if (techs.length > 0) {
                user.technician_id = techs[0].technician_id;
                user.specialization = techs[0].specialization;
            }
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token.', error: err.message });
    }
}

function requireRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        }
        if (!allowedRoles.includes(req.user.user_type)) {
            return res.status(403).json({ 
                success: false, 
                message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] roles. Your role is ${req.user.user_type}.` 
            });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole,
    JWT_SECRET
};
