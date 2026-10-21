const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/tickets
 * Lists tickets filtered by role and query params
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, priority, category_id, building, search } = req.query;
        let queryParams = [];
        let whereClauses = [];

        // Role-based scoping
        if (req.user.user_type === 'STUDENT') {
            if (!req.user.student_id) {
                return res.status(403).json({ success: false, message: 'Student profile missing' });
            }
            whereClauses.push('t.student_id = ?');
            queryParams.push(req.user.student_id);
        } else if (req.user.user_type === 'TECHNICIAN') {
            if (!req.user.technician_id) {
                return res.status(403).json({ success: false, message: 'Technician profile missing' });
            }
            // Technician sees tickets currently or previously assigned to them
            whereClauses.push(`t.ticket_id IN (
                SELECT ticket_id FROM assignments WHERE technician_id = ?
            )`);
            queryParams.push(req.user.technician_id);
        }
        // Admin sees all tickets

        // Query filters
        if (status && status !== 'ALL') {
            whereClauses.push('t.current_status = ?');
            queryParams.push(status);
        }

        if (priority && priority !== 'ALL') {
            whereClauses.push('t.priority = ?');
            queryParams.push(priority);
        }

        if (category_id && category_id !== 'ALL') {
            whereClauses.push('t.category_id = ?');
            queryParams.push(category_id);
        }

        if (building && building !== 'ALL') {
            whereClauses.push('l.building = ?');
            queryParams.push(building);
        }

        if (search) {
            whereClauses.push('(t.title LIKE ? OR t.description LIKE ? OR t.ticket_id = ?)');
            queryParams.push(`%${search}%`, `%${search}%`, isNaN(Number(search)) ? -1 : Number(search));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT 
                t.ticket_id, t.title, t.description, t.priority, t.current_status,
                t.created_at, t.resolved_at,
                c.category_id, c.category_name,
                l.location_id, l.building, l.floor_no, l.room_or_area,
                s.student_id, s.registration_no,
                su.name AS student_name, su.email AS student_email, su.phone AS student_phone,
                curr_a.assignment_id,
                curr_t.technician_id,
                curr_tu.name AS technician_name,
                curr_tu.phone AS technician_phone,
                curr_t.specialization AS technician_specialization
            FROM tickets t
            JOIN categories c ON t.category_id = c.category_id
            JOIN locations l ON t.location_id = l.location_id
            JOIN students s ON t.student_id = s.student_id
            JOIN users su ON s.user_id = su.user_id
            LEFT JOIN assignments curr_a ON t.ticket_id = curr_a.ticket_id AND curr_a.assignment_status = 'ACTIVE'
            LEFT JOIN technicians curr_t ON curr_a.technician_id = curr_t.technician_id
            LEFT JOIN users curr_tu ON curr_t.user_id = curr_tu.user_id
            ${whereSql}
            ORDER BY t.created_at DESC
        `;

        const tickets = await db.query(sql, queryParams);
        res.json({ success: true, count: tickets.length, data: tickets });
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/tickets/:id
 * Fetches ticket detail along with full assignment history and status audit history
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.id;

        const ticketSql = `
            SELECT 
                t.ticket_id, t.title, t.description, t.priority, t.current_status,
                t.created_at, t.resolved_at,
                c.category_id, c.category_name, c.default_priority,
                l.location_id, l.building, l.floor_no, l.room_or_area,
                s.student_id, s.registration_no,
                su.name AS student_name, su.email AS student_email, su.phone AS student_phone
            FROM tickets t
            JOIN categories c ON t.category_id = c.category_id
            JOIN locations l ON t.location_id = l.location_id
            JOIN students s ON t.student_id = s.student_id
            JOIN users su ON s.user_id = su.user_id
            WHERE t.ticket_id = ?
        `;

        const tickets = await db.query(ticketSql, [ticketId]);
        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Access check for students
        if (req.user.user_type === 'STUDENT' && req.user.student_id !== ticket.student_id) {
            return res.status(403).json({ success: false, message: 'Unauthorized to view this ticket.' });
        }

        // Fetch full assignments history
        const assignmentsSql = `
            SELECT 
                a.assignment_id, a.assigned_at, a.completed_at, a.assignment_status,
                t.technician_id, t.specialization,
                u.name AS technician_name, u.email AS technician_email, u.phone AS technician_phone,
                adm_u.name AS assigned_by_admin_name
            FROM assignments a
            JOIN technicians t ON a.technician_id = t.technician_id
            JOIN users u ON t.user_id = u.user_id
            JOIN admins adm ON a.assigned_by_admin_id = adm.admin_id
            JOIN users adm_u ON adm.user_id = adm_u.user_id
            WHERE a.ticket_id = ?
            ORDER BY a.assigned_at ASC
        `;
        const assignments = await db.query(assignmentsSql, [ticketId]);

        // Fetch full status transition history
        const historySql = `
            SELECT 
                sh.history_id, sh.old_status, sh.new_status, sh.remarks, sh.changed_at,
                u.user_id, u.name AS changed_by_name, u.user_type AS changed_by_role
            FROM status_history sh
            JOIN users u ON sh.changed_by_user_id = u.user_id
            WHERE sh.ticket_id = ?
            ORDER BY sh.changed_at ASC
        `;
        const history = await db.query(historySql, [ticketId]);

        res.json({
            success: true,
            data: {
                ...ticket,
                assignments,
                history
            }
        });
    } catch (err) {
        console.error('Error fetching ticket detail:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/tickets
 * Student creates ticket -> INSERT TICKET + initial STATUS_HISTORY
 */
router.post('/', authenticateToken, requireRole('STUDENT'), async (req, res) => {
    try {
        const { title, description, category_id, location_id, priority } = req.body;

        if (!title || !description || !category_id || !location_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title, description, category, and location are required.' 
            });
        }

        // Determine priority: use provided or fallback to category default
        let selectedPriority = priority;
        if (!selectedPriority) {
            const cat = await db.query('SELECT default_priority FROM categories WHERE category_id = ?', [category_id]);
            selectedPriority = cat.length > 0 ? cat[0].default_priority : 'MEDIUM';
        }

        let newTicketId = null;

        await db.transaction(async (txQuery) => {
            // 1. Insert ticket
            const ticketRes = await txQuery(
                `INSERT INTO tickets (student_id, category_id, location_id, title, description, priority, current_status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'OPEN', CURRENT_TIMESTAMP)`,
                [req.user.student_id, category_id, location_id, title.trim(), description.trim(), selectedPriority]
            );

            newTicketId = ticketRes.insertId;

            // 2. Insert initial status history record (FR6 / Section 1.7)
            await txQuery(
                `INSERT INTO status_history (ticket_id, changed_by_user_id, old_status, new_status, remarks, changed_at)
                 VALUES (?, ?, NULL, 'OPEN', ?, CURRENT_TIMESTAMP)`,
                [newTicketId, req.user.user_id, `Ticket created by student ${req.user.name}`]
            );
        });

        res.status(201).json({
            success: true,
            message: 'Maintenance ticket created successfully',
            ticket_id: newTicketId
        });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/tickets/:id/assign
 * Admin assigns or reassigns technician -> INSERT ASSIGNMENT + UPDATE TICKET + INSERT STATUS_HISTORY
 */
router.post('/:id/assign', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { technician_id, remarks } = req.body;

        if (!technician_id) {
            return res.status(400).json({ success: false, message: 'technician_id is required' });
        }

        // Verify ticket exists
        const tickets = await db.query('SELECT ticket_id, current_status FROM tickets WHERE ticket_id = ?', [ticketId]);
        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        const currentTicket = tickets[0];
        const oldStatus = currentTicket.current_status;

        // Verify technician exists
        const techs = await db.query(`
            SELECT t.technician_id, u.name, t.specialization 
            FROM technicians t 
            JOIN users u ON t.user_id = u.user_id 
            WHERE t.technician_id = ?
        `, [technician_id]);

        if (techs.length === 0) {
            return res.status(404).json({ success: false, message: 'Technician not found' });
        }
        const tech = techs[0];

        await db.transaction(async (txQuery) => {
            // 1. Mark any currently active assignments as REASSIGNED
            await txQuery(
                `UPDATE assignments 
                 SET assignment_status = 'REASSIGNED' 
                 WHERE ticket_id = ? AND assignment_status = 'ACTIVE'`,
                [ticketId]
            );

            // 2. Insert new assignment record (FR4 / FR6)
            await txQuery(
                `INSERT INTO assignments (ticket_id, technician_id, assigned_by_admin_id, assigned_at, assignment_status)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE')`,
                [ticketId, technician_id, req.user.admin_id]
            );

            // 3. Update ticket status to ASSIGNED (or preserve IN_PROGRESS if already underway)
            const nextStatus = oldStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'ASSIGNED';
            await txQuery(
                `UPDATE tickets SET current_status = ? WHERE ticket_id = ?`,
                [nextStatus, ticketId]
            );

            // 4. Record in status_history
            const auditRemarks = remarks && remarks.trim() 
                ? remarks.trim() 
                : `Assigned to technician ${tech.name} (${tech.specialization}) by Admin ${req.user.name}`;

            await txQuery(
                `INSERT INTO status_history (ticket_id, changed_by_user_id, old_status, new_status, remarks, changed_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [ticketId, req.user.user_id, oldStatus, nextStatus, auditRemarks]
            );
        });

        res.json({
            success: true,
            message: `Ticket #${ticketId} assigned to technician ${tech.name}`
        });

    } catch (err) {
        console.error('Error assigning technician:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * PATCH /api/tickets/:id/status
 * Technician updates status -> UPDATE TICKET + INSERT STATUS_HISTORY
 * (Allowed: IN_PROGRESS, RESOLVED)
 */
router.patch('/:id/status', authenticateToken, requireRole(['TECHNICIAN', 'ADMIN']), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status, remarks } = req.body;

        if (!status || !['IN_PROGRESS', 'RESOLVED'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Technicians can mark work as IN_PROGRESS or RESOLVED.' 
            });
        }

        const tickets = await db.query('SELECT ticket_id, current_status FROM tickets WHERE ticket_id = ?', [ticketId]);
        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        const currentTicket = tickets[0];
        const oldStatus = currentTicket.current_status;

        // If technician, verify they are assigned to this ticket
        if (req.user.user_type === 'TECHNICIAN') {
            const assignCheck = await db.query(
                `SELECT assignment_id FROM assignments 
                 WHERE ticket_id = ? AND technician_id = ? AND assignment_status = 'ACTIVE'`,
                [ticketId, req.user.technician_id]
            );
            if (assignCheck.length === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Forbidden: You are not actively assigned to this ticket.' 
                });
            }
        }

        await db.transaction(async (txQuery) => {
            // 1. Update ticket
            if (status === 'RESOLVED') {
                await txQuery(
                    `UPDATE tickets SET current_status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
                    [ticketId]
                );
                // Mark active assignment as COMPLETED
                await txQuery(
                    `UPDATE assignments SET completed_at = CURRENT_TIMESTAMP, assignment_status = 'COMPLETED' 
                     WHERE ticket_id = ? AND assignment_status = 'ACTIVE'`,
                    [ticketId]
                );
            } else {
                await txQuery(
                    `UPDATE tickets SET current_status = ? WHERE ticket_id = ?`,
                    [status, ticketId]
                );
            }

            // 2. Insert status history audit
            const historyRemarks = remarks && remarks.trim()
                ? remarks.trim()
                : `Status updated to ${status} by ${req.user.name} (${req.user.user_type})`;

            await txQuery(
                `INSERT INTO status_history (ticket_id, changed_by_user_id, old_status, new_status, remarks, changed_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [ticketId, req.user.user_id, oldStatus, status, historyRemarks]
            );
        });

        res.json({
            success: true,
            message: `Ticket #${ticketId} status updated to ${status}`
        });

    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * PATCH /api/tickets/:id/admin-status
 * Admin archives/cancels duplicate ticket or overrides status
 * Database effect: Preserve record; do not delete audit history.
 */
router.patch('/:id/admin-status', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status, remarks } = req.body;

        const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const tickets = await db.query('SELECT ticket_id, current_status FROM tickets WHERE ticket_id = ?', [ticketId]);
        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        const oldStatus = tickets[0].current_status;

        await db.transaction(async (txQuery) => {
            if (status === 'RESOLVED') {
                await txQuery(
                    `UPDATE tickets SET current_status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
                    [ticketId]
                );
            } else if (status === 'CANCELLED') {
                await txQuery(
                    `UPDATE tickets SET current_status = 'CANCELLED' WHERE ticket_id = ?`,
                    [ticketId]
                );
                await txQuery(
                    `UPDATE assignments SET assignment_status = 'CANCELLED' WHERE ticket_id = ? AND assignment_status = 'ACTIVE'`,
                    [ticketId]
                );
            } else {
                await txQuery(
                    `UPDATE tickets SET current_status = ?, resolved_at = NULL WHERE ticket_id = ?`,
                    [status, ticketId]
                );
            }

            const auditRemarks = remarks && remarks.trim()
                ? remarks.trim()
                : `Admin ${req.user.name} changed status from ${oldStatus} to ${status}`;

            await txQuery(
                `INSERT INTO status_history (ticket_id, changed_by_user_id, old_status, new_status, remarks, changed_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [ticketId, req.user.user_id, oldStatus, status, auditRemarks]
            );
        });

        res.json({
            success: true,
            message: `Ticket #${ticketId} status updated to ${status}`
        });

    } catch (err) {
        console.error('Error changing ticket status:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
