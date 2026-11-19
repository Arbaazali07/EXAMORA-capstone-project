-- ============================================================================
-- EXAMORA: Smart Online Examination & Assessment Management System
-- Database Views (MySQL 8.0+)
-- ============================================================================

USE examora_db;

DROP VIEW IF EXISTS student_result_view;
DROP VIEW IF EXISTS exam_performance_view;
DROP VIEW IF EXISTS course_wise_performance_view;
DROP VIEW IF EXISTS student_attempt_history_view;

-- ----------------------------------------------------------------------------
-- 1. student_result_view
-- Complete student examination scorecard joining results, students, users,
-- exams, courses, departments, and semesters.
-- ----------------------------------------------------------------------------
CREATE VIEW student_result_view AS
SELECT 
    r.id AS result_id,
    r.attempt_id,
    r.exam_id,
    e.title AS exam_title,
    c.course_code,
    c.course_name,
    d.dept_code,
    d.dept_name,
    sem.semester_name,
    s.id AS student_id,
    s.roll_number,
    u.full_name AS student_name,
    u.email AS student_email,
    r.total_questions,
    r.attempted_questions,
    r.correct_answers,
    r.incorrect_answers,
    r.unattempted_questions,
    r.total_marks,
    r.obtained_marks,
    r.percentage,
    r.is_passed,
    r.grade,
    r.rank_in_exam,
    r.published_at,
    a.start_time AS attempt_start_time,
    a.submit_time AS attempt_submit_time,
    TIMESTAMPDIFF(MINUTE, a.start_time, a.submit_time) AS duration_spent_minutes
FROM results r
INNER JOIN attempts a ON r.attempt_id = a.id
INNER JOIN exams e ON r.exam_id = e.id
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN departments d ON c.department_id = d.id
INNER JOIN semesters sem ON e.semester_id = sem.id
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id;

-- ----------------------------------------------------------------------------
-- 2. exam_performance_view
-- Aggregated statistical performance metrics for each examination.
-- ----------------------------------------------------------------------------
CREATE VIEW exam_performance_view AS
SELECT 
    e.id AS exam_id,
    e.title AS exam_title,
    c.course_code,
    c.course_name,
    d.dept_name,
    u_teach.full_name AS instructor_name,
    e.total_marks,
    e.passing_marks,
    e.status AS exam_status,
    COUNT(DISTINCT reg.id) AS total_registrations,
    COUNT(DISTINCT a.id) AS total_attempts,
    COUNT(DISTINCT CASE WHEN a.status IN ('submitted', 'evaluated', 'auto_submitted') THEN a.id END) AS completed_submissions,
    ROUND(IFNULL(AVG(r.obtained_marks), 0), 2) AS average_score,
    ROUND(IFNULL(MAX(r.obtained_marks), 0), 2) AS highest_score,
    ROUND(IFNULL(MIN(r.obtained_marks), 0), 2) AS lowest_score,
    ROUND(IFNULL(AVG(r.percentage), 0), 2) AS average_percentage,
    COUNT(DISTINCT CASE WHEN r.is_passed = 1 THEN r.id END) AS passed_count,
    COUNT(DISTINCT CASE WHEN r.is_passed = 0 AND r.id IS NOT NULL THEN r.id END) AS failed_count,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT r.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN r.is_passed = 1 THEN r.id END) * 100.0) / COUNT(DISTINCT r.id)
            ELSE 0.00 
        END, 2
    ) AS pass_percentage
FROM exams e
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN departments d ON c.department_id = d.id
INNER JOIN teachers t ON e.teacher_id = t.id
INNER JOIN users u_teach ON t.user_id = u_teach.id
LEFT JOIN registrations reg ON e.id = reg.exam_id
LEFT JOIN attempts a ON e.id = a.exam_id
LEFT JOIN results r ON a.id = r.attempt_id
GROUP BY 
    e.id, e.title, c.course_code, c.course_name, d.dept_name, 
    u_teach.full_name, e.total_marks, e.passing_marks, e.status;

-- ----------------------------------------------------------------------------
-- 3. course_wise_performance_view
-- Cross-examination academic summary grouped by course and department.
-- ----------------------------------------------------------------------------
CREATE VIEW course_wise_performance_view AS
SELECT 
    c.id AS course_id,
    c.course_code,
    c.course_name,
    c.credits,
    d.dept_code,
    d.dept_name,
    COUNT(DISTINCT e.id) AS total_exams_conducted,
    COUNT(DISTINCT a.id) AS total_attempts,
    ROUND(IFNULL(AVG(r.percentage), 0), 2) AS course_avg_percentage,
    ROUND(IFNULL(MAX(r.percentage), 0), 2) AS course_max_percentage,
    ROUND(IFNULL(MIN(r.percentage), 0), 2) AS course_min_percentage,
    COUNT(DISTINCT CASE WHEN r.is_passed = 1 THEN r.id END) AS total_passes,
    COUNT(DISTINCT CASE WHEN r.is_passed = 0 AND r.id IS NOT NULL THEN r.id END) AS total_fails,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT r.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN r.is_passed = 1 THEN r.id END) * 100.0) / COUNT(DISTINCT r.id)
            ELSE 0.00 
        END, 2
    ) AS overall_pass_rate
FROM courses c
INNER JOIN departments d ON c.department_id = d.id
LEFT JOIN exams e ON c.id = e.course_id
LEFT JOIN attempts a ON e.id = a.exam_id
LEFT JOIN results r ON a.id = r.attempt_id
GROUP BY c.id, c.course_code, c.course_name, c.credits, d.dept_code, d.dept_name;

-- ----------------------------------------------------------------------------
-- 4. student_attempt_history_view
-- Chronological test session logs for monitoring, auditing, and student profiles.
-- ----------------------------------------------------------------------------
CREATE VIEW student_attempt_history_view AS
SELECT 
    a.id AS attempt_id,
    s.id AS student_id,
    s.roll_number,
    u.full_name AS student_name,
    e.id AS exam_id,
    e.title AS exam_title,
    c.course_code,
    c.course_name,
    a.start_time,
    a.submit_time,
    a.status AS attempt_status,
    TIMESTAMPDIFF(MINUTE, a.start_time, IFNULL(a.submit_time, NOW())) AS minutes_spent,
    e.duration_minutes AS max_duration_minutes,
    a.total_score,
    a.percentage,
    a.is_passed,
    IFNULL(r.grade, 'N/A') AS final_grade,
    IFNULL(r.rank_in_exam, 0) AS exam_rank,
    a.ip_address
FROM attempts a
INNER JOIN students s ON a.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
INNER JOIN exams e ON a.exam_id = e.id
INNER JOIN courses c ON e.course_id = c.id
LEFT JOIN results r ON a.id = r.attempt_id;

