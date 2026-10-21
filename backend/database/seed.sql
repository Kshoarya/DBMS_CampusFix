-- =======================================================================
-- CAMPUS MAINTENANCE TICKET SYSTEM
-- Seed Data for 3NF Database
-- All default user accounts use password: 'password123'
-- Hash: $2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6
-- =======================================================================

-- 1. INSERT USERS (Admins, Students, Technicians)
INSERT INTO users (user_id, name, email, phone, password_hash, user_type) VALUES
-- Admin (ID 1)
(1, 'Shardul Parag Rawal (Admin)', 'admin@campus.edu', '+91 98765 00001', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'ADMIN'),

-- Students (IDs 2, 3, 4)
(2, 'Kshoarya Atul Hirawat', 'kshoarya@campus.edu', '+91 98765 00002', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'STUDENT'),
(3, 'Tapan Patel', 'tapan@campus.edu', '+91 98765 00003', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'STUDENT'),
(4, 'Ananya Sharma', 'ananya@campus.edu', '+91 98765 00004', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'STUDENT'),

-- Technicians (IDs 5, 6, 7, 8, 9)
(5, 'Ramesh Sharma', 'ramesh.tech@campus.edu', '+91 98765 00005', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
(6, 'Suresh Kumar', 'suresh.tech@campus.edu', '+91 98765 00006', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
(7, 'Vikram Singh', 'vikram.tech@campus.edu', '+91 98765 00007', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
(8, 'Anil Verma', 'anil.tech@campus.edu', '+91 98765 00008', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN'),
(9, 'Prakash Rao', 'prakash.tech@campus.edu', '+91 98765 00009', '$2a$10$OsSWA6JivF9lW5dJkfShgubKc.GgTzbQ7NUnNizWD0aI1GxpfODC6', 'TECHNICIAN')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. INSERT ADMINS
INSERT INTO admins (admin_id, user_id) VALUES
(1, 1)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- 3. INSERT STUDENTS
INSERT INTO students (student_id, user_id, registration_no) VALUES
(1, 2, '25BCE0466'),
(2, 3, '25BCE2947'),
(3, 4, '25BCE1120')
ON DUPLICATE KEY UPDATE registration_no=VALUES(registration_no);

-- 4. INSERT TECHNICIANS
INSERT INTO technicians (technician_id, user_id, specialization) VALUES
(1, 5, 'Electrical & Power Systems'),
(2, 6, 'Plumbing & Water Infrastructure'),
(3, 7, 'HVAC & Air Conditioning'),
(4, 8, 'Network & IT Infrastructure'),
(5, 9, 'Carpentry & Furniture')
ON DUPLICATE KEY UPDATE specialization=VALUES(specialization);

-- 5. INSERT CATEGORIES
INSERT INTO categories (category_id, category_name, default_priority) VALUES
(1, 'Electrical', 'HIGH'),
(2, 'Plumbing', 'MEDIUM'),
(3, 'Furniture & Carpentry', 'LOW'),
(4, 'Network & Wi-Fi', 'HIGH'),
(5, 'HVAC & Cooling', 'MEDIUM'),
(6, 'Civil & Infrastructure', 'LOW')
ON DUPLICATE KEY UPDATE default_priority=VALUES(default_priority);

-- 6. INSERT LOCATIONS
INSERT INTO locations (location_id, building, floor_no, room_or_area) VALUES
(1, 'Aryabhata Hostel Block A', '2nd Floor', 'Room 214'),
(2, 'Aryabhata Hostel Block B', '1st Floor', 'Common Study Lounge'),
(3, 'Dr. APJ Abdul Kalam Tech Block', '3rd Floor', 'Computer Lab 304'),
(4, 'Dr. APJ Abdul Kalam Tech Block', 'Ground Floor', 'Auditorium Main Stage'),
(5, 'Central Academic Complex', '2nd Floor', 'Smart Classroom 208'),
(6, 'Central Academic Complex', '4th Floor', 'Electronics Hardware Lab'),
(7, 'Central Library', '1st Floor', 'Reading Hall Wing B'),
(8, 'Sports & Recreation Complex', 'Ground Floor', 'Indoor Badminton Court 2')
ON DUPLICATE KEY UPDATE room_or_area=VALUES(room_or_area);

-- 7. INSERT TICKETS
INSERT INTO tickets (ticket_id, student_id, category_id, location_id, title, description, priority, current_status, created_at, resolved_at) VALUES
(101, 1, 1, 1, 'Main switchboard sparking in Room 214', 'The primary power outlet near study table 2 sparks intermittently whenever a laptop charger is connected. Potential fire hazard.', 'URGENT', 'IN_PROGRESS', '2026-10-19 09:30:00', NULL),
(102, 1, 2, 2, 'Severe water leakage in hostel washroom pipeline', 'Water is leaking continuously under the central basin, accumulating water on the floor and causing slipping hazard.', 'HIGH', 'RESOLVED', '2026-10-18 11:15:00', '2026-10-19 16:40:00'),
(103, 2, 4, 3, 'Access point AP-304 dropped connection', 'Students cannot authenticate to campus Wi-Fi in Lab 304. Shows connection timed out on all terminals.', 'HIGH', 'ASSIGNED', '2026-10-20 14:00:00', NULL),
(104, 3, 3, 5, 'Broken wooden study chair armrest', 'One desk chair in row 4 has a loose armrest with protruding nails.', 'LOW', 'OPEN', '2026-10-21 08:30:00', NULL),
(105, 2, 5, 7, 'Air conditioning unit blowing warm air', 'AC unit 3 in Reading Hall B is humming loudly and blowing humid warm air instead of cooling.', 'MEDIUM', 'ASSIGNED', '2026-10-20 16:20:00', NULL)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 8. INSERT ASSIGNMENTS (History of technician assignment & reassignment)
INSERT INTO assignments (assignment_id, ticket_id, technician_id, assigned_by_admin_id, assigned_at, completed_at, assignment_status) VALUES
-- Ticket 101: Initially assigned to tech 1 (Ramesh), currently active
(1, 101, 1, 1, '2026-10-19 10:00:00', NULL, 'ACTIVE'),
-- Ticket 102: Assigned to tech 2 (Suresh) and completed
(2, 102, 2, 1, '2026-10-18 12:00:00', '2026-10-19 16:40:00', 'COMPLETED'),
-- Ticket 103: Assigned to tech 4 (Anil)
(3, 103, 4, 1, '2026-10-20 14:30:00', NULL, 'ACTIVE'),
-- Ticket 105: Reassignment demonstration! Initially assigned to tech 1 (mistakenly), then reassigned to tech 3 (HVAC specialist Vikram)
(4, 105, 1, 1, '2026-10-20 16:30:00', NULL, 'REASSIGNED'),
(5, 105, 3, 1, '2026-10-20 17:00:00', NULL, 'ACTIVE')
ON DUPLICATE KEY UPDATE assignment_status=VALUES(assignment_status);

-- 9. INSERT STATUS_HISTORY (Complete audit trail of transitions)
INSERT INTO status_history (history_id, ticket_id, changed_by_user_id, old_status, new_status, remarks, changed_at) VALUES
-- Ticket 101 History
(1, 101, 2, NULL, 'OPEN', 'Ticket logged by student Kshoarya Hirawat', '2026-10-19 09:30:00'),
(2, 101, 1, 'OPEN', 'ASSIGNED', 'Assigned to Senior Electrician Ramesh Sharma', '2026-10-19 10:00:00'),
(3, 101, 5, 'ASSIGNED', 'IN_PROGRESS', 'Inspection started on site; breaker isolated and replacement board requested', '2026-10-19 11:20:00'),

-- Ticket 102 History
(4, 102, 2, NULL, 'OPEN', 'Ticket logged by student Kshoarya Hirawat', '2026-10-18 11:15:00'),
(5, 102, 1, 'OPEN', 'ASSIGNED', 'Assigned to Suresh Kumar (Plumbing)', '2026-10-18 12:00:00'),
(6, 102, 6, 'ASSIGNED', 'IN_PROGRESS', 'Replaced faulty O-ring gasket and sealed joint', '2026-10-19 14:00:00'),
(7, 102, 6, 'IN_PROGRESS', 'RESOLVED', 'Pressure test passed, leak completely resolved. Area cleaned.', '2026-10-19 16:40:00'),

-- Ticket 103 History
(8, 103, 3, NULL, 'OPEN', 'Ticket logged by student Tapan Patel', '2026-10-20 14:00:00'),
(9, 103, 1, 'OPEN', 'ASSIGNED', 'Assigned to Network Admin Anil Verma', '2026-10-20 14:30:00'),

-- Ticket 104 History
(10, 104, 4, NULL, 'OPEN', 'Ticket logged by student Ananya Sharma', '2026-10-21 08:30:00'),

-- Ticket 105 History (with reassignment audit)
(11, 105, 3, NULL, 'OPEN', 'Ticket logged by student Tapan Patel', '2026-10-20 16:20:00'),
(12, 105, 1, 'OPEN', 'ASSIGNED', 'Assigned initially to Ramesh Sharma', '2026-10-20 16:30:00'),
(13, 105, 1, 'ASSIGNED', 'ASSIGNED', 'Reassigned to Vikram Singh (HVAC Specialist) for refrigerant check', '2026-10-20 17:00:00')
ON DUPLICATE KEY UPDATE remarks=VALUES(remarks);
