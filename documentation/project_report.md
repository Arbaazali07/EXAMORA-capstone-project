# EXAMORA: Smart Online Examination & Assessment Management System
## University DBMS Capstone Project Comprehensive Technical Report

---

### CHAPTER 1: ABSTRACT
**EXAMORA** is an enterprise-grade, fully functional Smart Online Examination and Assessment Management System designed and engineered to address the complexities of modern academic evaluation. Built using **MySQL 8.0 (InnoDB storage engine)**, **Node.js/Express.js**, and **React.js/Vite**, EXAMORA serves as a comprehensive capstone demonstration of core Database Management System (DBMS) concepts. The platform incorporates a 1:1 specialization hierarchy for user authentication, Boyce-Codd Normal Form (BCNF) relational normalization across 16 tables, ACID transactional submission protocols with pessimistic row-level locking (`SELECT ... FOR UPDATE`), server-authoritative timer validation, automated objective scoring with negative marking, manual teacher grading workflows for descriptive submissions, and analytical window functions (`DENSE_RANK()`, `LAG()`, `LEAD()`, `PARTITION BY`). Furthermore, EXAMORA features an integrated SQL Laboratory allowing examiners and students to execute live queries across all major syllabus areas (DDL, DML, DCL, TCL, Joins, Subqueries, Set Operations, Views, Indexes, and CTEs).

---

### CHAPTER 2: INTRODUCTION
Higher educational institutions require resilient, secure, and mathematically sound digital evaluation systems. Traditional physical paper-based assessments introduce administrative friction, logistical overhead, subjective evaluation delays, and potential paper leakage. While generic learning management tools exist, they frequently suffer from lack of transactional isolation, fragile client-side timer dependency, unnormalized database storage, and opaque reporting.

EXAMORA was conceived from first principles to bridge the gap between rigorous relational database theory and modern full-stack web software engineering. The platform provides role-segregated workspaces for University Administrators, Faculty Instructors, and Enrolled Students, powered by a relational backend deployed on MySQL 8.0.

---

### CHAPTER 3: PROBLEM STATEMENT
Contemporary examination management systems exhibit multiple structural flaws:
1. **Concurrency Failures & Race Conditions:** Concurrent submissions from hundreds of simultaneous candidates trigger race conditions, resulting in lost updates, duplicated attempt records, or corrupted test scores.
2. **Client-Side Timer Vulnerabilities:** Relying on JavaScript browser timers allows candidates to manipulate local clocks or pause network sockets to artificially prolong their test duration.
3. **Data Redundancy & Relational Anomalies:** Denormalized database designs produce severe update, insertion, and deletion anomalies, where modifications to course or instructor metadata cascade into historical score corruption.
4. **Exposure of Answer Keys:** Inadequately engineered APIs transmit complete answer sheets with `is_correct` flags to the frontend client, enabling inspection via browser Developer Tools.
5. **Absence of Pedagogical SQL Inspection:** Academic evaluators lack transparent mechanisms to inspect the physical database execution plans, indexes, and window calculations underpinning platform reports.

---

### CHAPTER 4: OBJECTIVES
The core engineering objectives of EXAMORA comprise:
- **Architectural Normalization:** Design a relational schema adhering strictly to Boyce-Codd Normal Form (BCNF) across 16 core relations.
- **ACID Transaction Guarantee:** Execute final examination submissions within atomic MySQL transactions using `START TRANSACTION`, row-level locks (`FOR UPDATE`), and automated `ROLLBACK` safety.
- **Server-Authoritative Proctoring:** Validate examination windows, candidate eligibility, and countdown timers on the backend server.
- **Automated & Manual Hybrid Grading:** Automate scoring for Single-Choice MCQs, Multiple-Choice MCQs, and True/False questions while providing a grading portal for subjective descriptive questions.
- **DBMS Syllabus Exploration:** Implement an embedded interactive SQL Laboratory and Viva Voce preparation center.

---

### CHAPTER 5: EXISTING SYSTEM
Existing examination workflows rely on either physical paper invigilation or basic web form builders:
- **Physical Exams:** High paper wastage, vulnerability to physical tampering, human grading fatigue, slow tabulation of results, and lack of real-time student performance analytics.
- **Form Builders (Google Forms / Survey Monkey):** No relational validation, lack of server-validated countdown timers, no support for negative marking calculations, zero transactional isolation, and inability to handle composite academic relationships.

---

### CHAPTER 6: PROPOSED SYSTEM
EXAMORA introduces a high-performance Three-Tier Architecture:
1. **Presentation Layer:** React.js single-page application built on Vite, Tailwind CSS, and Recharts, offering a dark navy sidebar navigation, live examination engine, and interactive query playground.
2. **Application / Logic Layer:** Express.js REST API server with JWT authentication, bcrypt password hashing, and role-based access control (RBAC).
3. **Database Layer:** MySQL 8.0 InnoDB database with UTF8MB4 character encoding, candidate keys, foreign key cascading constraints, check constraints, composite performance indexes, and analytical views.

---

### CHAPTER 7: FUNCTIONAL REQUIREMENTS
#### 1. Administration Module
- Manage students, teachers, departments, courses, and semesters.
- University-wide examination scheduling and status governance (`draft`, `scheduled`, `published`, `ongoing`, `closed`, `archived`).
- System-wide security audit logging and macro-level academic analytics.

#### 2. Faculty / Teacher Module
- Manage assigned curriculum courses.
- Maintain a rich Question Bank categorized by course, topic, difficulty (`easy`, `medium`, `hard`), and question type (`single_choice`, `multiple_choice`, `true_false`, `descriptive`).
- Construct examinations with customized durations, marks, and negative marking rates.
- Evaluate subjective student responses with marks and individualized constructive feedback.
- Finalize and publish examination results, triggering automatic class rankings via MySQL window functions.

#### 3. Student Module
- Register and authenticate into the university portal.
- View upcoming examinations and register with single-click validation.
- Attempt examinations through a distraction-free interface with server-validated countdown, question palette, answer autosave, and mark-for-review capabilities.
- Review published scorecards, performance radar distributions, and question answer keys once released.

---

### CHAPTER 8: NON-FUNCTIONAL REQUIREMENTS
- **Performance:** Sub-50 millisecond query execution for candidate answer lookups utilizing composite B+ Tree indexes.
- **Security:** Industry-standard bcrypt password hashing (10 salt rounds), signed JSON Web Tokens (7-day expiry), parameterized prepared statements protecting against SQL injection, and stripping of correct answer flags during active attempts.
- **Reliability & ACID:** InnoDB Write-Ahead Logging (WAL) and atomic transaction submission semantics ensuring data durability.
- **Usability:** Responsive, SaaS-inspired user interface with color-coded countdown indicators and keyboard accessibility.

---

### CHAPTER 9: ENTITY-RELATIONSHIP (ER) DIAGRAM
The conceptual ER diagram models 16 normalized relational entities:
- **1:1 Relationships:** `users` to `students` (specialization), `users` to `teachers` (specialization), `attempts` to `results` (evaluation).
- **1:N Relationships:** `departments` to `courses`, `departments` to `teachers`, `departments` to `students`, `courses` to `exams`, `courses` to `questions`, `questions` to `question_options`, `exams` to `attempts`, `attempts` to `student_answers`.
- **M:N Associative Relationships:**
  - `teachers` and `courses` resolved via `teacher_courses` with `UNIQUE (teacher_id, course_id, semester_id)`.
  - `exams` and `questions` resolved via `exam_questions` with `UNIQUE (exam_id, question_id)`.
  - `exams` and `students` resolved via `registrations` and `attempts`.
  - `attempts` and `questions` resolved via `student_answers`.

---

### CHAPTER 10: RELATIONAL SCHEMA
```text
USERS (id [PK], username [UK], email [UK], password_hash, role, full_name, avatar_url, is_active, created_at)
DEPARTMENTS (id [PK], dept_code [UK], dept_name, description, created_at)
SEMESTERS (id [PK], semester_code [UK], semester_name, academic_year, is_active, created_at)
COURSES (id [PK], course_code [UK], course_name, department_id [FK], credits, description, created_at)
TEACHERS (id [PK], user_id [FK, UK], employee_id [UK], department_id [FK], designation, qualification, phone, created_at)
STUDENTS (id [PK], user_id [FK, UK], roll_number [UK], department_id [FK], semester_id [FK], admission_year, phone, created_at)
TEACHER_COURSES (id [PK], teacher_id [FK], course_id [FK], semester_id [FK], assigned_date, [UK: teacher_id, course_id, semester_id])
EXAMS (id [PK], title, description, course_id [FK], semester_id [FK], teacher_id [FK], start_time, end_time, duration_minutes, total_marks, passing_marks, negative_marking_per_question, instructions, status, is_published_results, created_at)
QUESTIONS (id [PK], course_id [FK], created_by_teacher_id [FK], question_text, question_type, marks, negative_marks, difficulty, topic, explanation, is_active, created_at)
QUESTION_OPTIONS (id [PK], question_id [FK], option_key, option_text, is_correct, created_at)
EXAM_QUESTIONS (id [PK], exam_id [FK], question_id [FK], question_order, custom_marks, custom_negative_marks, [UK: exam_id, question_id])
REGISTRATIONS (id [PK], exam_id [FK], student_id [FK], registration_date, status, [UK: exam_id, student_id])
ATTEMPTS (id [PK], exam_id [FK], student_id [FK], start_time, submit_time, status, total_score, percentage, is_passed, ip_address, created_at)
STUDENT_ANSWERS (id [PK], attempt_id [FK], question_id [FK], selected_options [JSON], descriptive_answer, marks_obtained, is_marked_for_review, is_evaluated, teacher_feedback, updated_at, [UK: attempt_id, question_id])
RESULTS (id [PK], attempt_id [FK, UK], exam_id [FK], student_id [FK], total_questions, attempted_questions, correct_answers, incorrect_answers, unattempted_questions, total_marks, obtained_marks, percentage, is_passed, grade, rank_in_exam, published_at, created_at)
AUDIT_LOGS (id [PK], user_id [FK], action, entity_type, entity_id, details [JSON], ip_address, created_at)
```

---

### CHAPTER 11: DATABASE NORMALIZATION (1NF TO BCNF)
- **0NF to 1NF:** Multi-valued repeating groups (such as arrays of question choices) were decomposed into atomic records in `question_options`.
- **1NF to 2NF:** Partial dependencies on composite candidate keys were eliminated by isolating student, course, and exam metadata into distinct tables where non-prime attributes depend upon the entire primary key.
- **2NF to 3NF:** Transitive dependencies (`student_roll -> dept_code -> dept_name`) were eliminated by establishing independent `departments` and `semesters` lookup relations.
- **3NF to BCNF:** Verified that for every functional dependency $X \rightarrow Y$, $X$ is a superkey of the relation. No non-superkey determines prime attributes.

---

### CHAPTER 12: DATABASE IMPLEMENTATION
Implemented on **MySQL 8.0 Community Server**:
- Storage Engine: **InnoDB** (row-level locking, foreign key enforcement, multi-version concurrency control).
- Character Set: `utf8mb4` with collation `utf8mb4_unicode_ci`.
- Check Constraints: `credits > 0 AND credits <= 10`, `duration_minutes > 0`, `passing_marks <= total_marks`.
- Performance Indexes: Created on `student_id`, `exam_id`, `course_id`, `status`, and composite index on `(exam_id, student_id, status)`.

---

### CHAPTER 13: SQL QUERY EXPLANATIONS
Demonstrated practical application of:
- **Joins:** INNER JOIN for student profiles, LEFT JOIN for attempt participation, SELF JOIN for peer score comparisons, and FULL OUTER JOIN emulated via `LEFT JOIN UNION RIGHT JOIN`.
- **Subqueries:** Scalar subqueries for class average comparisons; correlated subqueries for identifying top course scorers; `EXISTS` and `NOT EXISTS` for activity detection.
- **Views:** Four pre-compiled views (`student_result_view`, `exam_performance_view`, `course_wise_performance_view`, `student_attempt_history_view`).
- **Window Functions:** `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()` for tie-free ranking; `LAG()` and `LEAD()` for adjacent peer score deltas; `PARTITION BY` for departmental running totals.
- **CTEs:** Recursive CTE for question difficulty levels; multi-stage CTE for cohort classifications and longitudinal student score improvements.

---

### CHAPTER 14: FRONTEND ARCHITECTURE
- **Framework:** React 18 with Vite bundling for rapid hot-module replacement.
- **Styling:** Tailwind CSS with a curated palette featuring dark navy sidebars (`#0B1120`), clean light grey canvas areas (`#F8FAFC`), and subtle indigo accents (`#6366F1`).
- **Data Visualization:** Recharts rendering dynamic histograms, donut charts, and longitudinal progress line charts.
- **Icons:** Lucide React icons.
- **Client Routing:** React Router v6 with strict authentication and role guards.

---

### CHAPTER 15: BACKEND ARCHITECTURE
- **Runtime:** Node.js (v24.x) with Express.js micro-framework.
- **Database Driver:** `mysql2/promise` leveraging connection pooling (`connectionLimit: 25`).
- **Security:** Bcrypt (10 rounds) and JSON Web Tokens.
- **Architecture Pattern:** Controller-Service-Repository modular pattern with dedicated error handling and audit logging utilities.

---

### CHAPTER 16: API DOCUMENTATION
Documented over 25 REST endpoints covering Authentication, Administration, Faculty Operations, Student Examination Sessions, Examination Engine Concurrency, Analytics Aggregations, and the Interactive SQL Playground.

---

### CHAPTER 17: SYSTEM TESTING
- **Authentication & RBAC Testing:** Verified token rejection upon role mismatch (e.g. students forbidden from accessing `/api/admin/*` endpoints).
- **Concurrency & Locking Testing:** Simulated concurrent submissions using row-level locking (`SELECT ... FOR UPDATE`), proving immunity to duplicate result insertions.
- **Timer Validation Testing:** Tested intentional client-side clock tampering; verified server timestamp enforcement rejected late submissions.
- **Evaluation Accuracy Testing:** Verified single-choice, multiple-choice, true/false, and negative marking formulas across 85 sample attempts.

---

### CHAPTER 18: RESULTS AND SCREENSHOTS CHECKLIST
1. Professional Login with 1-click University Role Quick-Fill (Admin, Faculty, Student).
2. Administrator Overview with live Recharts department pass-rate graphs.
3. Faculty Question Bank Manager with dynamic options generator and difficulty tagging.
4. Multi-step Examination Creation Wizard with question selector.
5. Faculty Descriptive Grading Portal with live mark updating.
6. Full-screen Distraction-Free Student Examination Engine with active countdown timer and question palette.
7. Student Scorecard and Review view.
8. Interactive DBMS SQL Laboratory with live MySQL query execution and EXPLAIN optimizer plans.
9. Comprehensive 45-Question DBMS Viva Voce Preparation Center.

---

### CHAPTER 19: LIMITATIONS
1. **Network Disconnection Tolerance:** Local browser storage caches intermediate answers, but final atomic submission requires an active TCP connection to the backend server.
2. **Automated Descriptive Grading:** While objective questions are graded instantly, descriptive long-form questions require manual faculty evaluation.

---

### CHAPTER 20: FUTURE SCOPE
1. **AI-Assisted Subjective Grading:** Integration of natural language semantic models to suggest preliminary grading rubrics for descriptive answers.
2. **Automated Proctoring:** Webcam gaze tracking and browser tab-switch detection.
3. **Database Sharding:** Horizontal partitioning of attempt tables across distributed MySQL clusters for institutions with over 100,000 concurrent test-takers.

---

### CHAPTER 21: CONCLUSION
EXAMORA successfully demonstrates that foundational DBMS principles—relational ER modeling, BCNF normalization, ACID transactions, row-level concurrency locks, secondary B+ Tree indexing, and window analytic queries—can be seamlessly integrated into a modern, production-grade full-stack web application. The platform satisfies all academic criteria for a university DBMS capstone project, providing an interactive, verifiable system for examination and viva evaluation.

