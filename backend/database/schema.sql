-- =======================================================================
-- CAMPUS MAINTENANCE TICKET SYSTEM
-- Normalized Relational Database Schema (3NF)
-- Based on Phase 1 EER & Logical ER Diagram
-- Project ID: P17 | Team: Shardul, Tapan, Kshoarya
-- =======================================================================

-- 1. USERS TABLE (Supertype)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('STUDENT', 'ADMIN', 'TECHNICIAN') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS TABLE (Subtype with Total, Disjoint Specialization)
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. ADMINS TABLE (Subtype with Total, Disjoint Specialization)
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. TECHNICIANS TABLE (Subtype with Total, Disjoint Specialization)
CREATE TABLE IF NOT EXISTS technicians (
    technician_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    CONSTRAINT fk_technicians_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. CATEGORIES TABLE (Master table for issue categories)
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    default_priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM'
);

-- 6. LOCATIONS TABLE (Master table for unique campus locations)
CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    building VARCHAR(100) NOT NULL,
    floor_no VARCHAR(20) NOT NULL,
    room_or_area VARCHAR(100) NOT NULL,
    CONSTRAINT uq_location UNIQUE (building, floor_no, room_or_area)
);

-- 7. TICKETS TABLE (Central transaction entity)
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    category_id INT NOT NULL,
    location_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    current_status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_tickets_student FOREIGN KEY (student_id) 
        REFERENCES students(student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) 
        REFERENCES categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_location FOREIGN KEY (location_id) 
        REFERENCES locations(location_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 8. ASSIGNMENTS TABLE (Associative/History entity for technician assignment & reassignment)
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    technician_id INT NOT NULL,
    assigned_by_admin_id INT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    assignment_status ENUM('ACTIVE', 'REASSIGNED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_assignments_ticket FOREIGN KEY (ticket_id) 
        REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assignments_technician FOREIGN KEY (technician_id) 
        REFERENCES technicians(technician_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_assignments_admin FOREIGN KEY (assigned_by_admin_id) 
        REFERENCES admins(admin_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9. STATUS_HISTORY TABLE (Audit entity recording every ticket status transition)
CREATE TABLE IF NOT EXISTS status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    changed_by_user_id INT NOT NULL,
    old_status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED') NULL,
    new_status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED') NOT NULL,
    remarks TEXT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) 
        REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (changed_by_user_id) 
        REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes for high-performance joins and queries
CREATE INDEX idx_tickets_student ON tickets(student_id);
CREATE INDEX idx_tickets_category ON tickets(category_id);
CREATE INDEX idx_tickets_location ON tickets(location_id);
CREATE INDEX idx_tickets_status ON tickets(current_status);
CREATE INDEX idx_assignments_ticket ON assignments(ticket_id);
CREATE INDEX idx_assignments_technician ON assignments(technician_id);
CREATE INDEX idx_history_ticket ON status_history(ticket_id);
