# Campus Maintenance Ticket System (Project P17)
### Normalized Relational Database-Driven Campus Maintenance Application
**Project Phase 1 Implementation**  
**Team Members**:
- Shardul Parag Rawal (`25BCE2548`)
- Tapan (`25BCE2947`)
- Kshoarya Atul Hirawat (`25BCE0466`)

---

## 1. Project Overview & Problem Statement
Campus maintenance complaints are traditionally reported through unstructured channels such as word-of-mouth, phone calls, or messaging groups. As a result:
- The same issue is repeatedly reported.
- Complaints do not reach the appropriately qualified technician.
- Students and administrators have no real-time visibility into whether an issue is open, assigned, in progress, or resolved.
- Critical history regarding reassignments and resolution actions is lost.

**Campus Maintenance Ticket System** provides a structured digital workflow powered by a normalized **Third Normal Form (3NF)** relational database where:
1. **Students** raise maintenance requests with category, campus location, and priority.
2. **Administrators** verify complaints and assign or reassign qualified technicians while retaining full reassignment history.
3. **Technicians** update progress to `IN_PROGRESS` and `RESOLVED` with mandatory audit remarks.
4. **Every single status change and reassignment** is permanently recorded in historical audit tables without overwriting past actions.

---

## 2. Tech Stack
- **Frontend**: React (Vite), Vanilla CSS design system, Lucide icons.
- **Backend**: Node.js, Express REST API, JSON Web Tokens (JWT), `bcryptjs`.
- **Database**:
  - **MySQL** via `mysql2/promise` (Production DDL in [`backend/database/schema.sql`](file:///c:/Users/Kshoarya/Desktop/Programs/Program%20files/AntiGravity/DBMS/backend/database/schema.sql) and [`seed.sql`](file:///c:/Users/Kshoarya/Desktop/Programs/Program%20files/AntiGravity/DBMS/backend/database/seed.sql)).
  - **Embedded SQLite Fallback**: Zero-configuration embedded relational engine with identical 3NF tables, foreign key constraints, and seeds for local evaluation.

---

## 3. Database Architecture & 3NF Normalization

### 3.1 Total & Disjoint ISA Specialization (Conceptual EER)
```
                          ┌─────────────┐
                          │    USER     │
                          └──────┬──────┘
                                 │
                   d (Total, Disjoint Specialization)
                   ┌─────────────┼─────────────┐
                   │             │             │
                   ▼             ▼             ▼
             ┌───────────┐ ┌───────────┐ ┌────────────┐
             │  STUDENT  │ │   ADMIN   │ │ TECHNICIAN │
             └─────┬─────┘ └─────┬─────┘ └─────┬──────┘
                   │             │             │
              Raises (1:N)  Creates (1:N)  Receives (1:N)
                   │             │             │
                   ▼             ▼             ▼
             ┌───────────┐ ┌───────────────────────────┐
             │  TICKETS  │ │        ASSIGNMENTS        │
             └─────┬─────┘ └───────────────────────────┘
                   │
             Has (1:1..N)
                   │
                   ▼
             ┌───────────────┐
             │ STATUS_HISTORY│
             └───────────────┘
```

### 3.2 Relational Model (Logical ER - 9 Tables)
1. **`users`** (`user_id` PK, `name`, `email` UQ, `phone`, `password_hash`, `user_type`)
2. **`students`** (`student_id` PK, `user_id` FK UQ -> users, `registration_no` UQ)
3. **`admins`** (`admin_id` PK, `user_id` FK UQ -> users)
4. **`technicians`** (`technician_id` PK, `user_id` FK UQ -> users, `specialization` NOT NULL)
5. **`categories`** (`category_id` PK, `category_name` UQ, `default_priority`)
6. **`locations`** (`location_id` PK, `building`, `floor_no`, `room_or_area`, UQ(`building`,`floor_no`,`room_or_area`))
7. **`tickets`** (`ticket_id` PK, `student_id` FK, `category_id` FK, `location_id` FK, `title`, `description`, `priority`, `current_status`, `created_at`, `resolved_at`)
8. **`assignments`** (`assignment_id` PK, `ticket_id` FK, `technician_id` FK, `assigned_by_admin_id` FK, `assigned_at`, `completed_at`, `assignment_status`)
9. **`status_history`** (`history_id` PK, `ticket_id` FK, `changed_by_user_id` FK, `old_status`, `new_status`, `remarks`, `changed_at`)

### 3.3 Normalization Process (UNF to 3NF)
- **UNF**: A single flat sheet storing multiple technicians assigned to one ticket inside a repeating group, violating atomicity.
- **1NF**: Repeating groups eliminated by separating tickets and assignments into atomic tables (`TICKET_1NF` and `ASSIGNMENT_1NF`).
- **2NF**: Eliminating partial functional dependencies on composite keys (`TechnicianID + TicketID`) by isolating personal technician data into `TECHNICIANS`.
- **3NF**: Eliminating transitive functional dependencies (`StudentID -> StudentName`, `CategoryID -> CategoryName`) by decomposing entities into independent master tables referenced via foreign keys.

---

## 4. Pre-Configured Demo Accounts
All default evaluation accounts use password: **`password123`**

| Role | Name | Email | Details |
|---|---|---|---|
| **Student** | Kshoarya Atul Hirawat | `kshoarya@campus.edu` | Reg: `25BCE0466` |
| **Student** | Tapan Patel | `tapan@campus.edu` | Reg: `25BCE2947` |
| **Admin** | Shardul Parag Rawal | `admin@campus.edu` | Campus Central Administrator |
| **Technician** | Ramesh Sharma | `ramesh.tech@campus.edu` | Electrical & Power Systems |
| **Technician** | Suresh Kumar | `suresh.tech@campus.edu` | Plumbing & Water Infrastructure |
| **Technician** | Vikram Singh | `vikram.tech@campus.edu` | HVAC & Cooling Systems |
| **Technician** | Anil Verma | `anil.tech@campus.edu` | Network & IT Infrastructure |

*(You can also use the one-click **Instant Role Switcher** in the top navigation bar to test all roles immediately without retyping credentials).*

---

## 5. Running the Application Locally

### 5.1 Prerequisites
- Node.js (v18+)
- npm (v9+)

### 5.2 Starting the Backend Server
```bash
cd backend
npm install
node server.js
```
The server will run on **`http://localhost:5000`**.  
*Note: If MySQL is not running on your computer, the backend automatically uses the built-in SQLite engine with the identical schema and seed data so you can test immediately!*

#### (Optional) Using a Local MySQL Server
Edit [`backend/.env`](file:///c:/Users/Kshoarya/Desktop/Programs/Program%20files/AntiGravity/DBMS/backend/.env):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_maintenance_db
DB_TYPE=mysql
```
Run `npm run seed` or start `node server.js` to automatically apply [`schema.sql`](file:///c:/Users/Kshoarya/Desktop/Programs/Program%20files/AntiGravity/DBMS/backend/database/schema.sql) and [`seed.sql`](file:///c:/Users/Kshoarya/Desktop/Programs/Program%20files/AntiGravity/DBMS/backend/database/seed.sql).

### 5.3 Starting the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in any web browser.

---

## 6. Key Application Features

### 6.1 Ticket Hub (Role-Adaptive)
- **Student**: View own maintenance requests, raise new complaints with category and location selectors, monitor status live.
- **Admin**: Overview of all campus tickets, assign / reassign technicians with workload insights, resolve or cancel duplicate tickets.
- **Technician**: View assigned work queue, update status to `IN_PROGRESS` or `RESOLVED` with mandatory audit remarks.
- **Audit Modal**: Inspect the full progression timeline showing who made each change, when, and what remarks were recorded.

### 6.2 Campus Analytics & Reports
- **Aggregate KPIs**: Total tickets, open, assigned, in progress, resolved, and average turnaround time.
- **By Building**: Unresolved vs resolved complaints per building with progress bars.
- **By Category**: Issue distribution across Electrical, Plumbing, Network, HVAC, Carpentry, and Civil.
- **Technician Workload**: Active tasks, completed tasks, and historical assignments.

### 6.3 Interactive DBMS Review Tab
- **9 Normalized Tables**: Live table view with column types, Primary Keys, Foreign Keys, and live row counts.
- **3NF Walkthrough**: Visual explanation of UNF -> 1NF -> 2NF -> 3NF.
- **Interactive SQL Terminal**: Execute live `SELECT` queries on the database and inspect tabular results. Includes 4 pre-built evaluation queries.
