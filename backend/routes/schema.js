const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/schema/info
 * Returns metadata about the 3NF schema, tables, and live row counts
 */
router.get('/info', authenticateToken, async (req, res) => {
    try {
        const dbEngine = db.getDbType();
        const tables = [
            'users',
            'students',
            'admins',
            'technicians',
            'categories',
            'locations',
            'tickets',
            'assignments',
            'status_history'
        ];

        const tableStats = [];
        for (const tbl of tables) {
            const countRes = await db.query(`SELECT COUNT(*) AS count FROM ${tbl}`);
            const count = countRes[0]?.count || 0;
            tableStats.push({
                table_name: tbl,
                row_count: count
            });
        }

        const schemaMetadata = {
            project: 'Campus Maintenance Ticket System (Phase 1)',
            projectId: 'P17',
            teamMembers: [
                { name: 'Shardul Parag Rawal', id: '25BCE2548' },
                { name: 'Tapan', id: '25BCE2947' },
                { name: 'Kshoarya Atul Hirawat', id: '25BCE0466' }
            ],
            dbEngine,
            normalForm: 'Third Normal Form (3NF)',
            normalizationSteps: [
                {
                    stage: 'UNF (Unnormalized Form)',
                    issue: 'Single flat record storing repeated lists of technicians per ticket, violating atomicity.',
                    design: 'MAINTENANCE_UNF(TicketID, StudentID, StudentName, CategoryName, LocationID, Title, Description, Status, { TechnicianID, TechName, Specialization, AssignedAt })'
                },
                {
                    stage: '1NF (First Normal Form)',
                    issue: 'Composite key (TicketID + TechnicianID) in assignment table caused partial functional dependencies.',
                    design: 'Extracted repeating groups into separate atomic tables: TICKET_1NF and ASSIGNMENT_1NF.'
                },
                {
                    stage: '2NF (Second Normal Form)',
                    issue: 'Technician details (TechName, Specialization) depended only on TechnicianID, not on composite TicketID+TechnicianID.',
                    design: 'Extracted TECHNICIAN into its own entity; ASSIGNMENT retains only foreign keys and timestamp.'
                },
                {
                    stage: '3NF (Third Normal Form - Final)',
                    issue: 'Transitive dependencies: StudentName depends on StudentID, CategoryName depends on CategoryID.',
                    design: 'Separated USERS, STUDENTS, CATEGORIES, and LOCATIONS into independent master tables referenced by foreign keys.'
                }
            ],
            tables: [
                {
                    name: 'users',
                    type: 'Supertype',
                    primaryKey: 'user_id',
                    foreignKeys: [],
                    columns: ['user_id', 'name', 'email', 'phone', 'password_hash', 'user_type', 'created_at']
                },
                {
                    name: 'students',
                    type: 'Subtype (Total, Disjoint ISA)',
                    primaryKey: 'student_id',
                    foreignKeys: [{ column: 'user_id', references: 'users(user_id)' }],
                    columns: ['student_id', 'user_id', 'registration_no']
                },
                {
                    name: 'admins',
                    type: 'Subtype (Total, Disjoint ISA)',
                    primaryKey: 'admin_id',
                    foreignKeys: [{ column: 'user_id', references: 'users(user_id)' }],
                    columns: ['admin_id', 'user_id']
                },
                {
                    name: 'technicians',
                    type: 'Subtype (Total, Disjoint ISA)',
                    primaryKey: 'technician_id',
                    foreignKeys: [{ column: 'user_id', references: 'users(user_id)' }],
                    columns: ['technician_id', 'user_id', 'specialization']
                },
                {
                    name: 'categories',
                    type: 'Master Table',
                    primaryKey: 'category_id',
                    foreignKeys: [],
                    columns: ['category_id', 'category_name', 'default_priority']
                },
                {
                    name: 'locations',
                    type: 'Master Table',
                    primaryKey: 'location_id',
                    foreignKeys: [],
                    columns: ['location_id', 'building', 'floor_no', 'room_or_area']
                },
                {
                    name: 'tickets',
                    type: 'Central Transaction Entity',
                    primaryKey: 'ticket_id',
                    foreignKeys: [
                        { column: 'student_id', references: 'students(student_id)' },
                        { column: 'category_id', references: 'categories(category_id)' },
                        { column: 'location_id', references: 'locations(location_id)' }
                    ],
                    columns: ['ticket_id', 'student_id', 'category_id', 'location_id', 'title', 'description', 'priority', 'current_status', 'created_at', 'resolved_at']
                },
                {
                    name: 'assignments',
                    type: 'Associative / Historical Entity',
                    primaryKey: 'assignment_id',
                    foreignKeys: [
                        { column: 'ticket_id', references: 'tickets(ticket_id)' },
                        { column: 'technician_id', references: 'technicians(technician_id)' },
                        { column: 'assigned_by_admin_id', references: 'admins(admin_id)' }
                    ],
                    columns: ['assignment_id', 'ticket_id', 'technician_id', 'assigned_by_admin_id', 'assigned_at', 'completed_at', 'assignment_status']
                },
                {
                    name: 'status_history',
                    type: 'Audit Entity',
                    primaryKey: 'history_id',
                    foreignKeys: [
                        { column: 'ticket_id', references: 'tickets(ticket_id)' },
                        { column: 'changed_by_user_id', references: 'users(user_id)' }
                    ],
                    columns: ['history_id', 'ticket_id', 'changed_by_user_id', 'old_status', 'new_status', 'remarks', 'changed_at']
                }
            ],
            tableStats
        };

        res.json({ success: true, data: schemaMetadata });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/schema/query
 * Safe read-only DBMS console for examiners & project evaluation
 */
router.post('/query', authenticateToken, async (req, res) => {
    try {
        const { sql } = req.body;
        if (!sql) {
            return res.status(400).json({ success: false, message: 'SQL query required' });
        }

        const trimmed = sql.trim();
        // Allow only read-only statements
        if (!/^SELECT|^EXPLAIN|^PRAGMA table_info/i.test(trimmed)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Security Guard: Only read-only queries (SELECT, EXPLAIN) are permitted in the interactive DBMS console.' 
            });
        }

        const rows = await db.query(trimmed);
        res.json({
            success: true,
            query: trimmed,
            rowCount: rows.length,
            rows
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
