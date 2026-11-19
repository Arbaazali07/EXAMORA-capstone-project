-- ============================================================================
-- EXAMORA: Smart Online Examination & Assessment Management System
-- Database Performance Indexes (MySQL 8.0+)
-- ============================================================================

USE examora_db;

-- ----------------------------------------------------------------------------
-- 1. Examination & Course Optimization Indexes
-- ----------------------------------------------------------------------------
-- Speed up queries filtering exams by course and status (e.g. active exams list)
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_start_end ON exams(start_time, end_time);
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);

-- Speed up course lookups by department
CREATE INDEX idx_courses_department_id ON courses(department_id);

-- ----------------------------------------------------------------------------
-- 2. Student & Registration Indexes
-- ----------------------------------------------------------------------------
-- Speed up queries checking registrations for a student or exam
CREATE INDEX idx_registrations_student_id ON registrations(student_id);
CREATE INDEX idx_registrations_exam_id ON registrations(exam_id);
CREATE INDEX idx_registrations_status ON registrations(status);

-- Student queries by department and semester
CREATE INDEX idx_students_dept_sem ON students(department_id, semester_id);
CREATE INDEX idx_students_roll_number ON students(roll_number);

-- ----------------------------------------------------------------------------
-- 3. Attempt & Session Indexes (Critical for real-time exam concurrency)
-- ----------------------------------------------------------------------------
-- Speed up attempt lookup by student and exam
CREATE INDEX idx_attempts_student_id ON attempts(student_id);
CREATE INDEX idx_attempts_exam_id ON attempts(exam_id);
CREATE INDEX idx_attempts_status ON attempts(status);
CREATE INDEX idx_attempts_submit_time ON attempts(submit_time);
CREATE INDEX idx_attempts_composite_search ON attempts(exam_id, student_id, status);

-- ----------------------------------------------------------------------------
-- 4. Question & Option Indexes
-- ----------------------------------------------------------------------------
-- Speed up fetching questions for an exam or course
CREATE INDEX idx_questions_course_id ON questions(course_id);
CREATE INDEX idx_questions_type_difficulty ON questions(question_type, difficulty);
CREATE INDEX idx_qo_question_id ON question_options(question_id);
CREATE INDEX idx_eq_exam_order ON exam_questions(exam_id, question_order);

-- ----------------------------------------------------------------------------
-- 5. Student Answers & Evaluation Indexes
-- ----------------------------------------------------------------------------
-- Speed up answer autosave and evaluation queries
CREATE INDEX idx_sa_attempt_id ON student_answers(attempt_id);
CREATE INDEX idx_sa_question_id ON student_answers(question_id);
CREATE INDEX idx_sa_evaluated ON student_answers(is_evaluated);

-- ----------------------------------------------------------------------------
-- 6. Results & Analytics Indexes
-- ----------------------------------------------------------------------------
-- Fast ranking, filtering, and report generation
CREATE INDEX idx_results_exam_id ON results(exam_id);
CREATE INDEX idx_results_student_id ON results(student_id);
CREATE INDEX idx_results_percentage ON results(percentage DESC);
CREATE INDEX idx_results_exam_rank ON results(exam_id, rank_in_exam);
CREATE INDEX idx_results_is_passed ON results(is_passed);

-- ----------------------------------------------------------------------------
-- 7. Audit Log Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_audit_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

