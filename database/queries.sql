-- ============================================================================
-- EXAMORA: Smart Online Examination & Assessment Management System
-- Comprehensive University DBMS SQL Query Suite (MySQL 8.0+)
-- Covers: DDL, DML, DCL, TCL, JOINS, SUBQUERIES, SET OPERATIONS, VIEWS,
--         INDEXES (EXPLAIN ANALYZE), WINDOW FUNCTIONS, and CTEs.
-- ============================================================================

USE examora_db;

-- ============================================================================
-- SECTION A: DATA DEFINITION LANGUAGE (DDL)
-- Demonstrates schema creation, modification, and table lifecycle management.
-- ============================================================================

-- 1. CREATE: Creating a temporary demonstration table for exam feedback
CREATE TABLE IF NOT EXISTS exam_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ef_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_ef_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. ALTER: Adding an indexing column and modifying column constraints
ALTER TABLE exam_feedback 
    ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE AFTER rating;

ALTER TABLE exam_feedback 
    MODIFY COLUMN comments VARCHAR(1000) NULL;

-- 3. DROP: Safely dropping the demonstration table
DROP TABLE IF EXISTS exam_feedback;


-- ============================================================================
-- SECTION B: DATA MANIPULATION LANGUAGE (DML)
-- Demonstrates inserting, updating, deleting, and complex selection of tuples.
-- ============================================================================

-- 1. INSERT: Inserting a new course with parameter validation
INSERT INTO courses (course_code, course_name, department_id, credits, description)
VALUES ('CS309', 'Cloud Computing & Virtualization', 1, 3, 'Foundational study of distributed cloud architectures')
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name);

-- 2. UPDATE: Increasing passing marks for an exam safely
UPDATE exams 
SET passing_marks = 45.00, updated_at = NOW()
WHERE course_id = (SELECT id FROM courses WHERE course_code = 'CS309')
  AND status = 'draft';

-- 3. DELETE: Pruning unassigned demo records
DELETE FROM courses 
WHERE course_code = 'CS309' 
  AND id NOT IN (SELECT DISTINCT course_id FROM exams);

-- 4. SELECT: Filtering active examinations with duration greater than 45 mins
SELECT id, title, duration_minutes, total_marks, passing_marks
FROM exams
WHERE status = 'published' AND duration_minutes >= 45
ORDER BY start_time ASC;


-- ============================================================================
-- SECTION C: DATA CONTROL LANGUAGE (DCL)
-- Demonstrates permission management and role privileges in MySQL.
-- (Note: Executed with administrative privileges in production environments)
-- ============================================================================

-- Create a dedicated exam proctor user
-- CREATE USER IF NOT EXISTS 'exam_proctor'@'localhost' IDENTIFIED BY 'Proctor@Secure2026';

-- Grant SELECT privileges on exam runtime tables
-- GRANT SELECT ON examora_db.exams TO 'exam_proctor'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON examora_db.attempts TO 'exam_proctor'@'localhost';
-- GRANT SELECT ON examora_db.student_result_view TO 'exam_proctor'@'localhost';

-- Revoke write privileges
-- REVOKE INSERT, UPDATE ON examora_db.attempts FROM 'exam_proctor'@'localhost';

-- Flush privilege cache
-- FLUSH PRIVILEGES;


-- ============================================================================
-- SECTION D: TRANSACTION CONTROL LANGUAGE (TCL)
-- Demonstrates ACID transactions, SAVEPOINTs, and atomic rollback semantics.
-- ============================================================================

-- Simulation of an atomic exam registration workflow with rollback safety
START TRANSACTION;

-- Step 1: Place a savepoint before registration
SAVEPOINT before_registration;

-- Step 2: Attempt inserting a student registration
INSERT INTO registrations (exam_id, student_id, status)
VALUES (1, 1, 'registered')
ON DUPLICATE KEY UPDATE status = 'registered';

-- Step 3: Insert audit log entry
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
VALUES (1, 'STUDENT_EXAM_REGISTRATION', 'registration', 1, JSON_OBJECT('exam_id', 1, 'student_id', 1));

-- Rollback to savepoint if error occurred (Demonstration):
-- ROLLBACK TO SAVEPOINT before_registration;

-- Commit the transaction atomically
COMMIT;


-- ============================================================================
-- SECTION E: RELATIONAL JOINS
-- Demonstrates INNER, LEFT, RIGHT, CROSS, SELF, and FULL OUTER JOINS.
-- ============================================================================

-- 1. INNER JOIN: Students with their department, semester, and user profile
SELECT 
    s.roll_number,
    u.full_name AS student_name,
    u.email,
    d.dept_name,
    sem.semester_name
FROM students s
INNER JOIN users u ON s.user_id = u.id
INNER JOIN departments d ON s.department_id = d.id
INNER JOIN semesters sem ON s.semester_id = sem.id
ORDER BY s.roll_number;

-- 2. LEFT JOIN: All exams and any attempts made (including exams with zero attempts)
SELECT 
    e.id AS exam_id,
    e.title AS exam_title,
    e.status,
    COUNT(a.id) AS total_attempts_recorded
FROM exams e
LEFT JOIN attempts a ON e.id = a.exam_id
GROUP BY e.id, e.title, e.status
ORDER BY total_attempts_recorded DESC;

-- 3. RIGHT JOIN: All teachers and any exams they have scheduled
SELECT 
    u.full_name AS teacher_name,
    t.designation,
    e.title AS exam_title,
    e.start_time
FROM exams e
RIGHT JOIN teachers t ON e.teacher_id = t.id
INNER JOIN users u ON t.user_id = u.id
ORDER BY u.full_name;

-- 4. CROSS JOIN: Cartesian product of departments and semesters (Curriculum Matrix)
SELECT 
    d.dept_code,
    d.dept_name,
    sem.semester_name,
    sem.academic_year
FROM departments d
CROSS JOIN semesters sem
ORDER BY d.dept_code, sem.semester_name;

-- 5. SELF JOIN: Comparing peer performance in the same examination
-- Finds pairs of students in Exam #1 where Student A scored strictly higher than Student B
SELECT 
    CONCAT(u1.full_name, ' (', s1.roll_number, ')') AS higher_scorer,
    r1.obtained_marks AS score_a,
    CONCAT(u2.full_name, ' (', s2.roll_number, ')') AS lower_scorer,
    r2.obtained_marks AS score_b,
    (r1.obtained_marks - r2.obtained_marks) AS score_difference
FROM results r1
INNER JOIN results r2 ON r1.exam_id = r2.exam_id AND r1.obtained_marks > r2.obtained_marks
INNER JOIN students s1 ON r1.student_id = s1.id
INNER JOIN users u1 ON s1.user_id = u1.id
INNER JOIN students s2 ON r2.student_id = s2.id
INNER JOIN users u2 ON s2.user_id = u2.id
WHERE r1.exam_id = 1
ORDER BY score_difference DESC
LIMIT 10;

-- 6. FULL OUTER JOIN: Emulated in MySQL using LEFT JOIN UNION RIGHT JOIN
-- Lists all courses and all exams, including courses without exams and exams without mapped courses
SELECT 
    c.id AS course_id,
    c.course_code,
    c.course_name,
    e.id AS exam_id,
    e.title AS exam_title
FROM courses c
LEFT JOIN exams e ON c.id = e.course_id

UNION

SELECT 
    c.id AS course_id,
    c.course_code,
    c.course_name,
    e.id AS exam_id,
    e.title AS exam_title
FROM courses c
RIGHT JOIN exams e ON c.id = e.course_id;


-- ============================================================================
-- SECTION F: SUBQUERIES
-- Demonstrates Nested, Correlated, EXISTS, NOT EXISTS, IN, ANY, and ALL queries.
-- ============================================================================

-- 1. NESTED SUBQUERY (Scalar): Students who scored higher than the class average in Exam #1
SELECT 
    s.roll_number,
    u.full_name,
    r.obtained_marks
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.exam_id = 1 
  AND r.obtained_marks > (
      SELECT AVG(obtained_marks) 
      FROM results 
      WHERE exam_id = 1
  )
ORDER BY r.obtained_marks DESC;

-- 2. CORRELATED SUBQUERY: Top scorer within each individual course
SELECT 
    c.course_code,
    c.course_name,
    u.full_name AS top_student,
    r.obtained_marks
FROM results r
INNER JOIN exams e ON r.exam_id = e.id
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.obtained_marks = (
    SELECT MAX(r_sub.obtained_marks)
    FROM results r_sub
    INNER JOIN exams e_sub ON r_sub.exam_id = e_sub.id
    WHERE e_sub.course_id = c.id
);

-- 3. EXISTS: Find all teachers who have created at least one published exam
SELECT 
    t.id,
    u.full_name,
    t.designation
FROM teachers t
INNER JOIN users u ON t.user_id = u.id
WHERE EXISTS (
    SELECT 1 
    FROM exams e 
    WHERE e.teacher_id = t.id AND e.status = 'published'
);

-- 4. NOT EXISTS: Find students who have NOT attempted any examination yet
SELECT 
    s.roll_number,
    u.full_name,
    d.dept_name
FROM students s
INNER JOIN users u ON s.user_id = u.id
INNER JOIN departments d ON s.department_id = d.id
WHERE NOT EXISTS (
    SELECT 1 
    FROM attempts a 
    WHERE a.student_id = s.id
);

-- 5. IN: Courses that currently have questions categorized as 'hard' difficulty
SELECT course_code, course_name
FROM courses
WHERE id IN (
    SELECT DISTINCT course_id 
    FROM questions 
    WHERE difficulty = 'hard'
);

-- 6. ANY / SOME: Exams where duration is longer than ANY exam conducted by Department #2
SELECT id, title, duration_minutes
FROM exams
WHERE duration_minutes > ANY (
    SELECT e2.duration_minutes
    FROM exams e2
    INNER JOIN courses c2 ON e2.course_id = c2.id
    WHERE c2.department_id = 2
);

-- 7. ALL: Students whose score in Exam #1 is greater than ALL scores in Exam #2
SELECT s.roll_number, u.full_name, r.obtained_marks
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.exam_id = 1 
  AND r.obtained_marks > ALL (
      SELECT obtained_marks 
      FROM results 
      WHERE exam_id = 2
  );


-- ============================================================================
-- SECTION G: SET OPERATIONS
-- Demonstrates UNION, UNION ALL, INTERSECT, and EXCEPT (with MySQL 8 emulation).
-- ============================================================================

-- 1. UNION: Unique list of all active participants (both teachers and students)
SELECT u.full_name, u.email, 'Faculty' AS role_category
FROM users u
INNER JOIN teachers t ON u.id = t.user_id

UNION

SELECT u.full_name, u.email, 'Student' AS role_category
FROM users u
INNER JOIN students s ON u.id = s.user_id
ORDER BY full_name;

-- 2. UNION ALL: Combined log of user IDs who created questions and took exams
SELECT created_by_teacher_id AS user_ref_id, 'Authored Question' AS activity_type
FROM questions

UNION ALL

SELECT student_id AS user_ref_id, 'Attempted Examination' AS activity_type
FROM attempts;

-- 3. INTERSECT (Emulation): Students who registered for Exam #1 AND Exam #2
SELECT r1.student_id, u.full_name, s.roll_number
FROM registrations r1
INNER JOIN registrations r2 ON r1.student_id = r2.student_id AND r2.exam_id = 2
INNER JOIN students s ON r1.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r1.exam_id = 1;

-- 4. EXCEPT / MINUS (Emulation): Students who registered for Exam #1 but NEVER registered for Exam #2
SELECT r1.student_id, u.full_name, s.roll_number
FROM registrations r1
INNER JOIN students s ON r1.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r1.exam_id = 1
  AND NOT EXISTS (
      SELECT 1 
      FROM registrations r2 
      WHERE r2.student_id = r1.student_id AND r2.exam_id = 2
  );


-- ============================================================================
-- SECTION H: DATABASE VIEWS
-- Selecting from the pre-defined architectural views.
-- ============================================================================

-- 1. Querying student_result_view: Honor Roll (Score >= 75%)
SELECT roll_number, student_name, course_code, obtained_marks, percentage, grade, rank_in_exam
FROM student_result_view
WHERE percentage >= 75.00
ORDER BY percentage DESC;

-- 2. Querying exam_performance_view: Executive Summary of all exams
SELECT exam_title, course_code, instructor_name, total_attempts, average_score, highest_score, pass_percentage
FROM exam_performance_view
ORDER BY pass_percentage DESC;

-- 3. Querying course_wise_performance_view: Departmental Subject Evaluation
SELECT dept_code, course_code, course_name, total_exams_conducted, course_avg_percentage, overall_pass_rate
FROM course_wise_performance_view
ORDER BY course_avg_percentage DESC;

-- 4. Querying student_attempt_history_view: Audit trail for a specific student
SELECT roll_number, student_name, exam_title, start_time, minutes_spent, attempt_status, total_score, final_grade
FROM student_attempt_history_view
WHERE roll_number = '24CSE001'
ORDER BY start_time DESC;


-- ============================================================================
-- SECTION I: INDEX PERFORMANCE & EXPLAIN ANALYZE
-- Demonstrates optimizer execution plan using created indexes.
-- ============================================================================

-- Query testing index idx_attempts_composite_search and idx_results_exam_rank
EXPLAIN
SELECT a.id, a.student_id, r.obtained_marks, r.rank_in_exam
FROM attempts a
INNER JOIN results r ON a.id = r.attempt_id
WHERE a.exam_id = 1 AND a.status = 'evaluated'
ORDER BY r.rank_in_exam ASC;


-- ============================================================================
-- SECTION J: WINDOW FUNCTIONS (ANALYTIC SQL)
-- Demonstrates ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM OVER, AVG OVER,
-- and PARTITION BY.
-- ============================================================================

-- 1. ROW_NUMBER(), RANK(), DENSE_RANK(): Comparing ranking behaviors across ties
SELECT 
    s.roll_number,
    u.full_name,
    e.title AS exam_title,
    r.obtained_marks,
    ROW_NUMBER() OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS row_num,
    RANK() OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS standard_rank,
    DENSE_RANK() OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS dense_rank
FROM results r
INNER JOIN exams e ON r.exam_id = e.id
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.exam_id = 1
ORDER BY r.obtained_marks DESC;

-- 2. LAG() and LEAD(): Score comparison with preceding and succeeding peer
SELECT 
    s.roll_number,
    u.full_name,
    r.obtained_marks,
    LAG(r.obtained_marks, 1) OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS previous_higher_score,
    (LAG(r.obtained_marks, 1) OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) - r.obtained_marks) AS deficit_from_higher_peer,
    LEAD(r.obtained_marks, 1) OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS next_lower_score
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.exam_id = 1
ORDER BY r.obtained_marks DESC;

-- 3. SUM() OVER() and AVG() OVER() with PARTITION BY:
-- Running cumulative score and deviation from overall course average
SELECT 
    c.course_code,
    s.roll_number,
    u.full_name,
    r.obtained_marks,
    ROUND(AVG(r.obtained_marks) OVER (PARTITION BY c.id), 2) AS course_mean_score,
    ROUND(r.obtained_marks - AVG(r.obtained_marks) OVER (PARTITION BY c.id), 2) AS variance_from_course_mean,
    ROUND(SUM(r.obtained_marks) OVER (PARTITION BY c.id ORDER BY r.obtained_marks DESC), 2) AS running_cumulative_marks
FROM results r
INNER JOIN exams e ON r.exam_id = e.id
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
ORDER BY c.course_code, r.obtained_marks DESC;


-- ============================================================================
-- SECTION K: COMMON TABLE EXPRESSIONS (CTEs)
-- Demonstrates multi-stage WITH queries and recursive CTEs.
-- ============================================================================

-- 1. CTE: Semester-wise student pass percentage and honors classification
WITH SemesterStats AS (
    SELECT 
        sem.id AS semester_id,
        sem.semester_name,
        COUNT(DISTINCT r.id) AS total_attempts,
        SUM(CASE WHEN r.is_passed = 1 THEN 1 ELSE 0 END) AS total_passes,
        ROUND(AVG(r.percentage), 2) AS avg_sem_percentage
    FROM semesters sem
    INNER JOIN exams e ON sem.id = e.semester_id
    INNER JOIN results r ON e.id = r.exam_id
    GROUP BY sem.id, sem.semester_name
)
SELECT 
    semester_name,
    total_attempts,
    total_passes,
    avg_sem_percentage,
    ROUND((total_passes * 100.0) / total_attempts, 2) AS pass_percentage,
    CASE 
        WHEN (total_passes * 100.0) / total_attempts >= 80 THEN 'Outstanding Cohort'
        WHEN (total_passes * 100.0) / total_attempts >= 60 THEN 'Satisfactory Cohort'
        ELSE 'Remedial Attention Required'
    END AS academic_evaluation
FROM SemesterStats;

-- 2. CTE: Identifying students who failed multiple examinations
WITH FailedExamsCTE AS (
    SELECT 
        s.id AS student_id,
        s.roll_number,
        u.full_name,
        d.dept_code,
        COUNT(r.id) AS fail_count,
        GROUP_CONCAT(c.course_code SEPARATOR ', ') AS failed_courses
    FROM results r
    INNER JOIN exams e ON r.exam_id = e.id
    INNER JOIN courses c ON e.course_id = c.id
    INNER JOIN students s ON r.student_id = s.id
    INNER JOIN users u ON s.user_id = u.id
    INNER JOIN departments d ON s.department_id = d.id
    WHERE r.is_passed = 0
    GROUP BY s.id, s.roll_number, u.full_name, d.dept_code
)
SELECT * 
FROM FailedExamsCTE
WHERE fail_count >= 1
ORDER BY fail_count DESC;

-- 3. CTE: Student score improvement between sequential examinations
WITH StudentChronologicalScores AS (
    SELECT 
        s.roll_number,
        u.full_name,
        e.title AS exam_title,
        r.percentage,
        a.submit_time,
        LAG(r.percentage, 1) OVER (PARTITION BY s.id ORDER BY a.submit_time ASC) AS previous_percentage
    FROM results r
    INNER JOIN attempts a ON r.attempt_id = a.id
    INNER JOIN exams e ON r.exam_id = e.id
    INNER JOIN students s ON r.student_id = s.id
    INNER JOIN users u ON s.user_id = u.id
)
SELECT 
    roll_number,
    full_name,
    exam_title,
    previous_percentage,
    percentage AS current_percentage,
    ROUND(percentage - previous_percentage, 2) AS percentage_improvement
FROM StudentChronologicalScores
WHERE previous_percentage IS NOT NULL
ORDER BY percentage_improvement DESC;

-- 4. RECURSIVE CTE: Question hierarchy / difficulty sequence levels
WITH RECURSIVE DifficultyLevels (level_num, difficulty_name, next_level) AS (
    SELECT 1 AS level_num, 'easy' AS difficulty_name, 'medium' AS next_level
    UNION ALL
    SELECT dl.level_num + 1, dl.next_level, 'hard'
    FROM DifficultyLevels dl
    WHERE dl.level_num = 1
    UNION ALL
    SELECT dl.level_num + 1, dl.next_level, 'mastery'
    FROM DifficultyLevels dl
    WHERE dl.level_num = 2
)
SELECT level_num, difficulty_name, next_level FROM DifficultyLevels;

