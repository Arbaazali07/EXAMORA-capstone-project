# EXAMORA: MySQL Setup & Administration Guide
## University DBMS Installation, Configuration, and Verification

---

### 1. Prerequisites
- **MySQL Server:** Version 8.0 or 8.4 LTS
- **Node.js:** v18.0.0 or higher (v24.x tested and supported)
- **GUI Tool (Optional):** MySQL Workbench 8.0, DBeaver, or phpMyAdmin

---

### 2. Database Creation

Open your terminal or MySQL Workbench and connect to your local MySQL instance as root:

```bash
# Connect using MySQL command line
mysql -u root -p
```

Execute the following commands to create the dedicated database and verify charset:

```sql
CREATE DATABASE IF NOT EXISTS examora_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SHOW DATABASES LIKE 'examora_db';
```

---

### 3. Backend Environment Configuration

In the `backend` folder, create or edit `.env`:

```ini
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=examora_db
DB_PORT=3306

# JWT Secret for Session Authentication
JWT_SECRET=examora_super_secret_jwt_key_2026_capstone
JWT_EXPIRES_IN=7d
```

---

### 4. Automated Database Initialization & Seeding

The backend includes automated migration and seeding scripts that execute all SQL definitions sequentially:

```bash
# Navigate to backend directory
cd backend

# Step 1: Install backend dependencies (if not already done)
npm install

# Step 2: Initialize Database Schema, Views, and Indexes
npm run db:init

# Step 3: Populate realistic sample data (50 students, 10 teachers, 100+ questions, attempts & results)
npm run db:seed

# Step 4: Verify connectivity and count records
npm run db:test
```

---

### 5. Manual Execution via MySQL Workbench or CLI

If you prefer executing SQL files directly:

```bash
# 1. Run Schema
mysql -u root -p examora_db < database/schema.sql

# 2. Run Views
mysql -u root -p examora_db < database/views.sql

# 3. Run Performance Indexes
mysql -u root -p examora_db < database/indexes.sql

# 4. Run Seed Data
mysql -u root -p examora_db < database/seed.sql
```

---

### 6. Verification Checklist

Run these queries in MySQL Workbench to confirm complete setup:

```sql
USE examora_db;

-- 1. Verify all 16 tables exist
SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';

-- 2. Verify all 4 Views exist
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- 3. Verify user accounts
SELECT role, COUNT(*) AS count FROM users GROUP BY role;

-- 4. Verify courses and examinations
SELECT c.course_code, c.course_name, COUNT(e.id) AS exam_count
FROM courses c
LEFT JOIN exams e ON c.id = e.course_id
GROUP BY c.id;

-- 5. Verify pre-computed student results
SELECT COUNT(*) AS total_results, AVG(percentage) AS avg_percentage, MAX(obtained_marks) AS max_marks
FROM results;
```

