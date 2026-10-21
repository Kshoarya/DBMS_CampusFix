const mysql = require('mysql2/promise');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = 'sqlite'; // 'mysql' or 'sqlite'
let mysqlPool = null;
let sqliteDb = null;

const dbFilePath = path.join(__dirname, '..', 'database', 'campus_maintenance.sqlite');

/**
 * Initialize Database Connection
 */
async function initDatabase() {
    const requestedType = (process.env.DB_TYPE || 'auto').toLowerCase();

    if (requestedType === 'mysql' || requestedType === 'auto') {
        try {
            const host = process.env.DB_HOST || 'localhost';
            const port = process.env.DB_PORT || 3306;
            const user = process.env.DB_USER || 'root';
            const password = process.env.DB_PASSWORD || '';
            const database = process.env.DB_NAME || 'campus_maintenance_db';

            // First check if MySQL server is accessible and create database if needed
            const rootConn = await mysql.createConnection({
                host,
                port,
                user,
                password,
                connectTimeout: 3000
            });

            await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
            await rootConn.end();

            // Create pool
            mysqlPool = mysql.createPool({
                host,
                port,
                user,
                password,
                database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                dateStrings: true
            });

            // Test connection
            const [testRes] = await mysqlPool.query('SELECT 1 + 1 AS result');
            if (testRes && testRes[0].result === 2) {
                dbType = 'mysql';
                console.log(`[DB] Connected successfully to MySQL (${database} on ${host}:${port})`);
                await runMySqlMigrations();
                return;
            }
        } catch (err) {
            if (requestedType === 'mysql') {
                console.error('[DB] Failed to connect to MySQL:', err.message);
                throw err;
            }
            console.log(`[DB] MySQL not reachable (${err.message}). Using built-in SQLite engine with identical 3NF relational schema.`);
        }
    }

    // SQLite Fallback
    dbType = 'sqlite';
    const dbDir = path.dirname(dbFilePath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    sqliteDb = new Database(dbFilePath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');

    console.log(`[DB] SQLite active at: ${dbFilePath}`);
    await runSqliteMigrations();
}

/**
 * Run MySQL schema & seeds
 */
async function runMySqlMigrations() {
    try {
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');

        // Check if users table exists
        const [rows] = await mysqlPool.query("SHOW TABLES LIKE 'users'");
        if (rows.length === 0) {
            console.log('[DB] Initializing MySQL tables from schema.sql...');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            const queries = schemaSql
                .split(';')
                .map(q => q.trim())
                .filter(q => q.length > 0 && !q.startsWith('--'));

            for (const q of queries) {
                await mysqlPool.query(q);
            }

            console.log('[DB] Seeding MySQL with initial data...');
            const seedSql = fs.readFileSync(seedPath, 'utf8');
            const seedQueries = seedSql
                .split(';')
                .map(q => q.trim())
                .filter(q => q.length > 0 && !q.startsWith('--'));

            for (const q of seedQueries) {
                await mysqlPool.query(q);
            }
            console.log('[DB] MySQL schema & seed applied successfully.');
        }
    } catch (err) {
        console.error('[DB] Error during MySQL migration:', err);
    }
}

/**
 * Run SQLite schema & seeds with 100% 3NF parity
 */
async function runSqliteMigrations() {
    try {
        const checkTable = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
        if (!checkTable) {
            console.log('[DB] Initializing SQLite tables with 3NF Schema...');
            
            sqliteDb.exec(`
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    phone TEXT,
                    password_hash TEXT NOT NULL,
                    user_type TEXT CHECK(user_type IN ('STUDENT', 'ADMIN', 'TECHNICIAN')) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS students (
                    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    registration_no TEXT NOT NULL UNIQUE,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
                );

                CREATE TABLE IF NOT EXISTS admins (
                    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
                );

                CREATE TABLE IF NOT EXISTS technicians (
                    technician_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    specialization TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
                );

                CREATE TABLE IF NOT EXISTS categories (
                    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_name TEXT NOT NULL UNIQUE,
                    default_priority TEXT CHECK(default_priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM'
                );

                CREATE TABLE IF NOT EXISTS locations (
                    location_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    building TEXT NOT NULL,
                    floor_no TEXT NOT NULL,
                    room_or_area TEXT NOT NULL,
                    UNIQUE(building, floor_no, room_or_area)
                );

                CREATE TABLE IF NOT EXISTS tickets (
                    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    category_id INTEGER NOT NULL,
                    location_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) NOT NULL DEFAULT 'MEDIUM',
                    current_status TEXT CHECK(current_status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')) NOT NULL DEFAULT 'OPEN',
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    resolved_at DATETIME NULL,
                    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT ON UPDATE CASCADE
                );

                CREATE TABLE IF NOT EXISTS assignments (
                    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER NOT NULL,
                    technician_id INTEGER NOT NULL,
                    assigned_by_admin_id INTEGER NOT NULL,
                    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME NULL,
                    assignment_status TEXT CHECK(assignment_status IN ('ACTIVE', 'REASSIGNED', 'COMPLETED', 'CANCELLED')) NOT NULL DEFAULT 'ACTIVE',
                    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE RESTRICT ON UPDATE CASCADE,
                    FOREIGN KEY (assigned_by_admin_id) REFERENCES admins(admin_id) ON DELETE RESTRICT ON UPDATE CASCADE
                );

                CREATE TABLE IF NOT EXISTS status_history (
                    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id INTEGER NOT NULL,
                    changed_by_user_id INTEGER NOT NULL,
                    old_status TEXT CHECK(old_status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')),
                    new_status TEXT CHECK(new_status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')) NOT NULL,
                    remarks TEXT NULL,
                    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_tickets_student ON tickets(student_id);
                CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category_id);
                CREATE INDEX IF NOT EXISTS idx_tickets_location ON tickets(location_id);
                CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(current_status);
                CREATE INDEX IF NOT EXISTS idx_assignments_ticket ON assignments(ticket_id);
                CREATE INDEX IF NOT EXISTS idx_assignments_technician ON assignments(technician_id);
                CREATE INDEX IF NOT EXISTS idx_history_ticket ON status_history(ticket_id);
            `);

            console.log('[DB] Seeding SQLite database...');
            const seedSql = `
                INSERT INTO users (user_id, name, email, phone, password_hash, user_type) VALUES
                (1, 'Shardul Parag Rawal (Admin)', 'admin@campus.edu', '+91 98765 00001', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'ADMIN'),
                (2, 'Kshoarya Atul Hirawat', 'kshoarya@campus.edu', '+91 98765 00002', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'STUDENT'),
                (3, 'Tapan Patel', 'tapan@campus.edu', '+91 98765 00003', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'STUDENT'),
                (4, 'Ananya Sharma', 'ananya@campus.edu', '+91 98765 00004', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'STUDENT'),
                (5, 'Ramesh Sharma', 'ramesh.tech@campus.edu', '+91 98765 00005', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
                (6, 'Suresh Kumar', 'suresh.tech@campus.edu', '+91 98765 00006', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
                (7, 'Vikram Singh', 'vikram.tech@campus.edu', '+91 98765 00007', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
                (8, 'Anil Verma', 'anil.tech@campus.edu', '+91 98765 00008', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
                (9, 'Prakash Rao', 'prakash.tech@campus.edu', '+91 98765 00009', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN');

                INSERT INTO admins (admin_id, user_id) VALUES (1, 1);

                INSERT INTO students (student_id, user_id, registration_no) VALUES
                (1, 2, '25BCE0466'),
                (2, 3, '25BCE2947'),
                (3, 4, '25BCE1120');

                INSERT INTO technicians (technician_id, user_id, specialization) VALUES
                (1, 5, 'Electrical & Power Systems'),
                (2, 6, 'Plumbing & Water Infrastructure'),
                (3, 7, 'HVAC & Air Conditioning'),
                (4, 8, 'Network & IT Infrastructure'),
                (5, 9, 'Carpentry & Furniture');

                INSERT INTO categories (category_id, category_name, default_priority) VALUES
                (1, 'Electrical', 'HIGH'),
                (2, 'Plumbing', 'MEDIUM'),
                (3, 'Furniture & Carpentry', 'LOW'),
                (4, 'Network & Wi-Fi', 'HIGH'),
                (5, 'HVAC & Cooling', 'MEDIUM'),
                (6, 'Civil & Infrastructure', 'LOW');

                INSERT INTO locations (location_id, building, floor_no, room_or_area) VALUES
                (1, 'Aryabhata Hostel Block A', '2nd Floor', 'Room 214'),
                (2, 'Aryabhata Hostel Block B', '1st Floor', 'Common Study Lounge'),
                (3, 'Dr. APJ Abdul Kalam Tech Block', '3rd Floor', 'Computer Lab 304'),
                (4, 'Dr. APJ Abdul Kalam Tech Block', 'Ground Floor', 'Auditorium Main Stage'),
                (5, 'Central Academic Complex', '2nd Floor', 'Smart Classroom 208'),
                (6, 'Central Academic Complex', '4th Floor', 'Electronics Hardware Lab'),
                (7, 'Central Library', '1st Floor', 'Reading Hall Wing B'),
                (8, 'Sports & Recreation Complex', 'Ground Floor', 'Indoor Badminton Court 2');

                INSERT INTO tickets (ticket_id, student_id, category_id, location_id, title, description, priority, current_status, created_at, resolved_at) VALUES
                (101, 1, 1, 1, 'Main switchboard sparking in Room 214', 'The primary power outlet near study table 2 sparks intermittently whenever a laptop charger is connected. Potential fire hazard.', 'URGENT', 'IN_PROGRESS', '2026-10-19 09:30:00', NULL),
                (102, 1, 2, 2, 'Severe water leakage in hostel washroom pipeline', 'Water is leaking continuously under the central basin, accumulating water on the floor and causing slipping hazard.', 'HIGH', 'RESOLVED', '2026-10-18 11:15:00', '2026-10-19 16:40:00'),
                (103, 2, 4, 3, 'Access point AP-304 dropped connection', 'Students cannot authenticate to campus Wi-Fi in Lab 304. Shows connection timed out on all terminals.', 'HIGH', 'ASSIGNED', '2026-10-20 14:00:00', NULL),
                (104, 3, 3, 5, 'Broken wooden study chair armrest', 'One desk chair in row 4 has a loose armrest with protruding nails.', 'LOW', 'OPEN', '2026-10-21 08:30:00', NULL),
                (105, 2, 5, 7, 'Air conditioning unit blowing warm air', 'AC unit 3 in Reading Hall B is humming loudly and blowing humid warm air instead of cooling.', 'MEDIUM', 'ASSIGNED', '2026-10-20 16:20:00', NULL);

                INSERT INTO assignments (assignment_id, ticket_id, technician_id, assigned_by_admin_id, assigned_at, completed_at, assignment_status) VALUES
                (1, 101, 1, 1, '2026-10-19 10:00:00', NULL, 'ACTIVE'),
                (2, 102, 2, 1, '2026-10-18 12:00:00', '2026-10-19 16:40:00', 'COMPLETED'),
                (3, 103, 4, 1, '2026-10-20 14:30:00', NULL, 'ACTIVE'),
                (4, 105, 1, 1, '2026-10-20 16:30:00', NULL, 'REASSIGNED'),
                (5, 105, 3, 1, '2026-10-20 17:00:00', NULL, 'ACTIVE');

                INSERT INTO status_history (history_id, ticket_id, changed_by_user_id, old_status, new_status, remarks, changed_at) VALUES
                (1, 101, 2, NULL, 'OPEN', 'Ticket logged by student Kshoarya Hirawat', '2026-10-19 09:30:00'),
                (2, 101, 1, 'OPEN', 'ASSIGNED', 'Assigned to Senior Electrician Ramesh Sharma', '2026-10-19 10:00:00'),
                (3, 101, 5, 'ASSIGNED', 'IN_PROGRESS', 'Inspection started on site; breaker isolated and replacement board requested', '2026-10-19 11:20:00'),
                (4, 102, 2, NULL, 'OPEN', 'Ticket logged by student Kshoarya Hirawat', '2026-10-18 11:15:00'),
                (5, 102, 1, 'OPEN', 'ASSIGNED', 'Assigned to Suresh Kumar (Plumbing)', '2026-10-18 12:00:00'),
                (6, 102, 6, 'ASSIGNED', 'IN_PROGRESS', 'Replaced faulty O-ring gasket and sealed joint', '2026-10-19 14:00:00'),
                (7, 102, 6, 'IN_PROGRESS', 'RESOLVED', 'Pressure test passed, leak completely resolved. Area cleaned.', '2026-10-19 16:40:00'),
                (8, 103, 3, NULL, 'OPEN', 'Ticket logged by student Tapan Patel', '2026-10-20 14:00:00'),
                (9, 103, 1, 'OPEN', 'ASSIGNED', 'Assigned to Network Admin Anil Verma', '2026-10-20 14:30:00'),
                (10, 104, 4, NULL, 'OPEN', 'Ticket logged by student Ananya Sharma', '2026-10-21 08:30:00'),
                (11, 105, 3, NULL, 'OPEN', 'Ticket logged by student Tapan Patel', '2026-10-20 16:20:00'),
                (12, 105, 1, 'OPEN', 'ASSIGNED', 'Assigned initially to Ramesh Sharma', '2026-10-20 16:30:00'),
                (13, 105, 1, 'ASSIGNED', 'ASSIGNED', 'Reassigned to Vikram Singh (HVAC Specialist) for refrigerant check', '2026-10-20 17:00:00');
            `;
            sqliteDb.exec(seedSql);
            console.log('[DB] SQLite seeded successfully.');
        }
    } catch (err) {
        console.error('[DB] Error during SQLite initialization:', err);
    }
}

/**
 * Universal Query Method
 * Returns [rows] format for consistency across MySQL and SQLite
 */
async function query(sql, params = []) {
    if (dbType === 'mysql') {
        const [rows, fields] = await mysqlPool.query(sql, params);
        return rows;
    } else {
        // SQLite
        // In SQLite better-sqlite3:
        const trimmed = sql.trim();
        const isSelect = /^SELECT|^PRAGMA|^SHOW|^EXPLAIN/i.test(trimmed);
        const stmt = sqliteDb.prepare(sql);
        
        if (isSelect) {
            const rows = stmt.all(...params);
            return rows;
        } else {
            const info = stmt.run(...params);
            return {
                insertId: info.lastInsertRowid,
                affectedRows: info.changes
            };
        }
    }
}

/**
 * Execute within a transaction
 */
async function transaction(callback) {
    if (dbType === 'mysql') {
        const connection = await mysqlPool.getConnection();
        await connection.beginTransaction();
        try {
            const transQuery = async (sql, params = []) => {
                const [rows] = await connection.query(sql, params);
                return rows;
            };
            const result = await callback(transQuery);
            await connection.commit();
            return result;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } else {
        // SQLite Async Transaction using standard SQL control
        sqliteDb.exec('BEGIN TRANSACTION');
        try {
            const transQuery = async (sql, params = []) => {
                const trimmed = sql.trim();
                const isSelect = /^SELECT|^PRAGMA/i.test(trimmed);
                const stmt = sqliteDb.prepare(sql);
                if (isSelect) {
                    return stmt.all(...params);
                } else {
                    const info = stmt.run(...params);
                    return {
                        insertId: info.lastInsertRowid,
                        affectedRows: info.changes
                    };
                }
            };
            const result = await callback(transQuery);
            sqliteDb.exec('COMMIT');
            return result;
        } catch (err) {
            try { sqliteDb.exec('ROLLBACK'); } catch (_) {}
            throw err;
        }
    }
}

function getDbType() {
    return dbType;
}

module.exports = {
    initDatabase,
    query,
    transaction,
    getDbType
};
