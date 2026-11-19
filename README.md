# EXAMORA: Smart Online Examination & Assessment Management System
## University DBMS Capstone Project (MySQL 8.0 Engine)

![EXAMORA Badge](https://img.shields.io/badge/Database-MySQL%208.0%20(InnoDB)-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-indigo)
![Architecture](https://img.shields.io/badge/Architecture-BCNF%20Normalized%20(16%20Tables)-purple)

---

### 1. Project Overview

**EXAMORA** is a full-stack, enterprise-grade Online Examination and Assessment Management System built specifically to demonstrate core Database Management System (DBMS) concepts for university capstone evaluation.

Unlike toy prototypes, EXAMORA is a production-style three-tier web application featuring:
- **Relational Integrity:** 16 BCNF-normalized tables with primary, foreign, candidate, check, and unique constraints.
- **ACID Transactions:** Full transactional exam submission pipeline with row-level pessimistic locking (`SELECT ... FOR UPDATE`), atomic answer saving, automatic objective grading, and rollback safety.
- **Server-Authoritative Proctoring:** Absolute time validation and single-active-attempt concurrency control enforced strictly on the backend.
- **Interactive SQL Laboratory:** Live in-browser SQL runner allowing faculty examiners to test any query with live millisecond timing and `EXPLAIN` execution plans.
- **Academic Analytics:** Real aggregated MySQL metrics rendered with interactive Recharts diagrams.
- **University Viva Center:** 45 in-depth technical DBMS viva questions with answers based on the real schema.

---

### 2. Technology Stack

- **Database:** MySQL 8.0+ (InnoDB Storage Engine, `utf8mb4` character set, connection pooling via `mysql2/promise`).
- **Backend:** Node.js, Express.js REST API, JSON Web Tokens (JWT), bcrypt password hashing.
- **Frontend:** React.js 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React.

---

### 3. Pre-Configured Demo Accounts

For university viva demonstration and quick evaluation, the login page features **1-Click Quick-Fill** buttons for all three roles:

| Role | Username / Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@examora.edu` | `password123` | Full governance: students, faculty, courses, audit logs, system stats |
| **Faculty Instructor** | `arun.sharma@examora.edu` | `password123` | Manage courses, Question Bank, create exams, grade descriptive questions |
| **Enrolled Student** | `student_001@student.examora.edu` | `password123` | View schedule, take timed exams, palette, view scorecards & reviews |

*(All 50 seeded students and 10 teachers use the default password `password123`).*

---

### 4. Quick Start & Installation Guide

#### Step 1: Clone or Open Workspace
```bash
cd z:\DBMS
```

#### Step 2: Configure MySQL Credentials in Backend
Open `backend/.env` and update `DB_PASSWORD` to match your local MySQL root password:
```ini
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=examora_db
DB_PORT=3306

JWT_SECRET=examora_capstone_jwt_super_secret_key_2026_university_dbms
JWT_EXPIRES_IN=7d
```

#### Step 3: Initialize Database Schema & Seed Data
Run the automated initialization and seeding scripts:
```bash
cd backend

# Initialize Schema tables, Views, and Performance Indexes
npm run db:init

# Populate realistic sample data (3 departments, 6 courses, 10 teachers, 50 students, 100+ questions, attempts & results)
npm run db:seed

# Run smoke test verification
npm run db:test
```

#### Step 4: Start the Backend Server
```bash
# In backend directory:
npm run dev
# Server will start on http://localhost:5000
```

#### Step 5: Start the Frontend Application
Open a new terminal tab:
```bash
cd frontend
npm run dev
# Vite will launch on http://localhost:3000
```

Open your browser and navigate to: **`http://localhost:3000`**

---

### 5. DBMS Syllabus Implementation Reference

| DBMS Concept | Practical Implementation in EXAMORA | Location |
| :--- | :--- | :--- |
| **1NF to BCNF Normalization** | Decomposed from flat structure; verified every determinant is a superkey | `database/normalization.md` |
| **ER Modeling & Specialization** | 1:1 users-to-students/teachers specialization; M:N associative tables | `database/er_diagram.md` |
| **ACID Transactions & TCL** | Multi-step exam submission with `SELECT ... FOR UPDATE` and atomic rollback | `backend/src/controllers/examEngineController.js` |
| **Database Views** | 4 stored views: `student_result_view`, `exam_performance_view`, `course_wise_performance_view`, `student_attempt_history_view` | `database/views.sql` |
| **Relational Joins** | INNER, LEFT, RIGHT, SELF, CROSS, and FULL OUTER (via `LEFT JOIN UNION RIGHT JOIN`) | `database/queries.sql` & SQL Lab |
| **Subqueries** | Scalar, Correlated, `EXISTS`, `NOT EXISTS`, `IN`, `ANY`, `ALL` | `database/queries.sql` & SQL Lab |
| **Set Operations** | `UNION`, `UNION ALL`, `INTERSECT` (emulated), `EXCEPT` (emulated) | `database/queries.sql` & SQL Lab |
| **Window Functions** | `DENSE_RANK()`, `RANK()`, `ROW_NUMBER()`, `LAG()`, `LEAD()`, `PARTITION BY` | `database/queries.sql` & SQL Lab |
| **Common Table Expressions** | Multi-stage CTEs for cohort trends and recursive CTE for difficulty levels | `database/queries.sql` & SQL Lab |
| **Performance Indexing** | Secondary & composite indexes with `EXPLAIN` query plan analysis | `database/indexes.sql` & SQL Lab |

---

### 6. Directory Structure

```text
z:\DBMS/
├── backend/
│   ├── src/
│   │   ├── config/db.js             # MySQL 8.0 connection pool (mysql2/promise)
│   │   ├── controllers/            # Auth, Admin, Teacher, Student, ExamEngine, Analytics, DbmsLab
│   │   ├── middleware/             # JWT auth & RBAC authorization
│   │   ├── routes/                 # Express REST API route definitions
│   │   ├── utils/                  # Evaluator, AuditLogger
│   │   ├── scripts/                # initDb.js, seedDb.js, testDb.js, generateSeedSql.js
│   │   └── server.js               # Express application entrypoint
│   ├── .env                        # Database connection settings
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Sidebar, Navbar, DashboardLayout, StatCard
│   │   ├── context/AuthContext.jsx # Authentication state & role guards
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Split-screen login with 1-click Demo quick-fill
│   │   │   ├── Register.jsx        # Student registration
│   │   │   ├── admin/              # Overview, Students, Teachers, Academics, Exams, Audit Logs
│   │   │   ├── teacher/            # TeacherOverview, QuestionBank, ExamCreator, Submissions & Grading
│   │   │   ├── student/            # StudentOverview, AvailableExams, ExamEngine, Results, Scorecard
│   │   │   └── dbms/               # DbmsLab (SQL Playground), DbmsViva (45 Qs), ArchitectureDocs
│   │   ├── services/api.js         # Axios client with JWT interceptor
│   │   ├── App.jsx                 # Route configurations
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── database/
│   ├── schema.sql                  # 16 normalized tables (InnoDB, utf8mb4)
│   ├── seed.sql                    # 3 depts, 6 courses, 10 teachers, 50 students, 102 questions, 85 results
│   ├── views.sql                   # 4 stored database views
│   ├── indexes.sql                 # B+ Tree performance indexes
│   ├── queries.sql                 # Syllabus SQL demonstration queries
│   ├── normalization.md            # 1NF -> 2NF -> 3NF -> BCNF mathematical walkthrough
│   ├── er_diagram.md               # Mermaid ER model and cardinality specifications
│   └── mysql_setup.md              # Installation and administration manual
├── documentation/
│   ├── project_report.md           # 21-chapter university capstone project report
│   ├── dbms_viva.md                # 45 in-depth university viva voce questions with answers
│   └── api_documentation.md        # Comprehensive REST API specifications
└── README.md                       # Master project guide
```

