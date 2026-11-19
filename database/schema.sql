-- ============================================================================
-- EXAMORA: Smart Online Examination & Assessment Management System
-- Database Schema Definition (MySQL 8.0+)
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS examora_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE examora_db;

-- Disable foreign key checks during schema re-creation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS attempts;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS teacher_courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS semesters;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Base authentication and user profile table)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_username_len CHECK (CHAR_LENGTH(username) >= 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. DEPARTMENTS TABLE (Academic departments)
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_code VARCHAR(20) NOT NULL UNIQUE,
    dept_name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. SEMESTERS TABLE (Academic semesters)
-- ----------------------------------------------------------------------------
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_code VARCHAR(20) NOT NULL UNIQUE,
    semester_name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. COURSES TABLE (Academic subjects)
-- ----------------------------------------------------------------------------
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_dept FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE CASCADE,
    CONSTRAINT chk_credits_range CHECK (credits > 0 AND credits <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TEACHERS TABLE (Faculty profile linked 1:1 with users)
-- ----------------------------------------------------------------------------
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    employee_id VARCHAR(30) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    designation VARCHAR(50) DEFAULT 'Assistant Professor',
    qualification VARCHAR(100) DEFAULT 'M.Tech / Ph.D',
    phone VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_teachers_dept FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. STUDENTS TABLE (Student profile linked 1:1 with users)
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    roll_number VARCHAR(30) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    semester_id INT NOT NULL,
    admission_year INT NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_dept FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_students_sem FOREIGN KEY (semester_id) 
        REFERENCES semesters(id) ON DELETE RESTRICT,
    CONSTRAINT chk_admission_year CHECK (admission_year >= 2000 AND admission_year <= 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TEACHER_COURSES TABLE (Many-to-Many mapping: Teachers & Courses per Semester)
-- ----------------------------------------------------------------------------
CREATE TABLE teacher_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    course_id INT NOT NULL,
    semester_id INT NOT NULL,
    assigned_date DATE DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_tc_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_course FOREIGN KEY (course_id) 
        REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_sem FOREIGN KEY (semester_id) 
        REFERENCES semesters(id) ON DELETE CASCADE,
    CONSTRAINT uk_teacher_course_sem UNIQUE (teacher_id, course_id, semester_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. EXAMS TABLE (Examination definition and schedule)
-- ----------------------------------------------------------------------------
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    course_id INT NOT NULL,
    semester_id INT NOT NULL,
    teacher_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    total_marks DECIMAL(6,2) NOT NULL DEFAULT 100.00,
    passing_marks DECIMAL(6,2) NOT NULL DEFAULT 40.00,
    negative_marking_per_question DECIMAL(4,2) DEFAULT 0.00,
    instructions TEXT DEFAULT NULL,
    status ENUM('draft', 'scheduled', 'published', 'ongoing', 'closed', 'archived') DEFAULT 'draft',
    is_published_results BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exams_course FOREIGN KEY (course_id) 
        REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_exams_sem FOREIGN KEY (semester_id) 
        REFERENCES semesters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_exams_teacher FOREIGN KEY (teacher_id) 
        REFERENCES teachers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_exam_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_exam_marks CHECK (total_marks > 0 AND passing_marks >= 0 AND passing_marks <= total_marks),
    CONSTRAINT chk_exam_neg_marking CHECK (negative_marking_per_question >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. QUESTIONS TABLE (Question bank repository)
-- ----------------------------------------------------------------------------
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    created_by_teacher_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('single_choice', 'multiple_choice', 'true_false', 'descriptive') NOT NULL,
    marks DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    negative_marks DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    topic VARCHAR(100) DEFAULT 'General',
    explanation TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_questions_course FOREIGN KEY (course_id) 
        REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_questions_teacher FOREIGN KEY (created_by_teacher_id) 
        REFERENCES teachers(id) ON DELETE RESTRICT,
    CONSTRAINT chk_question_marks CHECK (marks > 0 AND negative_marks >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. QUESTION_OPTIONS TABLE (Options for MCQ and True/False questions)
-- ----------------------------------------------------------------------------
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_key VARCHAR(10) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qo_question FOREIGN KEY (question_id) 
        REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. EXAM_QUESTIONS TABLE (Questions mapped to specific examinations)
-- ----------------------------------------------------------------------------
CREATE TABLE exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    question_order INT NOT NULL DEFAULT 1,
    custom_marks DECIMAL(5,2) DEFAULT NULL,
    custom_negative_marks DECIMAL(5,2) DEFAULT NULL,
    CONSTRAINT fk_eq_exam FOREIGN KEY (exam_id) 
        REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_eq_question FOREIGN KEY (question_id) 
        REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT uk_exam_question UNIQUE (exam_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. REGISTRATIONS TABLE (Student registration for examinations)
-- ----------------------------------------------------------------------------
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'approved', 'cancelled') DEFAULT 'approved',
    CONSTRAINT fk_reg_exam FOREIGN KEY (exam_id) 
        REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT uk_exam_student_reg UNIQUE (exam_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. ATTEMPTS TABLE (Student exam session / attempt tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    submit_time DATETIME DEFAULT NULL,
    status ENUM('in_progress', 'submitted', 'evaluated', 'auto_submitted', 'abandoned') DEFAULT 'in_progress',
    total_score DECIMAL(6,2) DEFAULT 0.00,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempts_exam FOREIGN KEY (exam_id) 
        REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. STUDENT_ANSWERS TABLE (Individual question responses in an attempt)
-- ----------------------------------------------------------------------------
CREATE TABLE student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_options JSON DEFAULT NULL,
    descriptive_answer TEXT DEFAULT NULL,
    marks_obtained DECIMAL(5,2) DEFAULT 0.00,
    is_marked_for_review BOOLEAN DEFAULT FALSE,
    is_evaluated BOOLEAN DEFAULT FALSE,
    teacher_feedback TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sa_attempt FOREIGN KEY (attempt_id) 
        REFERENCES attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_question FOREIGN KEY (question_id) 
        REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT uk_attempt_question UNIQUE (attempt_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. RESULTS TABLE (Consolidated scorecards and rankings)
-- ----------------------------------------------------------------------------
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL UNIQUE,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    total_questions INT NOT NULL DEFAULT 0,
    attempted_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    incorrect_answers INT NOT NULL DEFAULT 0,
    unattempted_questions INT NOT NULL DEFAULT 0,
    total_marks DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    obtained_marks DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    grade VARCHAR(5) DEFAULT 'F',
    rank_in_exam INT DEFAULT NULL,
    published_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_attempt FOREIGN KEY (attempt_id) 
        REFERENCES attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_exam FOREIGN KEY (exam_id) 
        REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_student FOREIGN KEY (student_id) 
        REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. AUDIT_LOGS TABLE (Security and activity tracing)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

