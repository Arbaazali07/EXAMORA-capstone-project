# EXAMORA: RESTful API Specifications & Architecture Documentation
## Base URL: `http://localhost:5000/api`

---

### Authentication Headers
All protected endpoints require an HTTP `Authorization` header containing a valid JSON Web Token (JWT):
```http
Authorization: Bearer <jwt_session_token>
```

---

### 1. Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
Registers a new student account with student profile attributes.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "username": "student_055",
    "email": "student_055@student.examora.edu",
    "password": "password123",
    "full_name": "Rohan Mehra",
    "roll_number": "24CSE055",
    "department_id": 1,
    "semester_id": 1,
    "phone": "+91 98765 00055"
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "token": "...", "user": { ... } }`
  - `409 Conflict`: Username, email, or roll number already registered.

#### `POST /api/auth/login`
Authenticates Admin, Teacher, or Student and issues a 7-day JWT.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "identifier": "admin@examora.edu",
    "password": "password123"
  }
  ```
- **Responses:**
  - `200 OK`: Returns JWT token and unified profile.
  - `401 Unauthorized`: Invalid credentials.

#### `GET /api/auth/me`
Retrieves authenticated user profile and academic context.
- **Access:** Authenticated

---

### 2. Administrator Endpoints (`/api/admin`)
*(Protected by `authorizeRoles('admin')`)*

#### `GET /api/admin/stats`
Returns system KPI metrics (total students, teachers, courses, exams, submissions, average score, pass percentage, department breakdown).

#### `GET /api/admin/students`
Fetches student directory with optional filters (`department_id`, `semester_id`, `search`).

#### `POST /api/admin/students`
Creates a student user account and corresponding `students` profile.

#### `GET /api/admin/teachers`
Fetches faculty directory with course counts and authored questions.

#### `POST /api/admin/teachers`
Creates a faculty member with employee ID and department assignment.

#### `GET /api/admin/departments` | `POST /api/admin/departments`
Academic department management.

#### `GET /api/admin/courses` | `POST /api/admin/courses`
Curriculum course management.

#### `GET /api/admin/semesters`
Semesters list.

#### `GET /api/admin/exams`
Comprehensive list of all examinations across university.

#### `PUT /api/admin/exams/:examId/status`
Updates status (`draft`, `scheduled`, `published`, `ongoing`, `closed`, `archived`) or toggles result publication.

#### `GET /api/admin/audit-logs`
Fetches chronological audit trail of administrative and security events.

---

### 3. Faculty / Teacher Endpoints (`/api/teacher`)
*(Protected by `authorizeRoles('teacher', 'admin')`)*

#### `GET /api/teacher/courses`
Returns courses assigned to the logged-in instructor.

#### `GET /api/teacher/questions`
Question bank repository with filters (`course_id`, `difficulty`, `question_type`, `search`). Returns questions with options.

#### `POST /api/teacher/questions`
Creates a new question with options (supports single_choice, multiple_choice, true_false, descriptive).
- **Request Body:**
  ```json
  {
    "course_id": 1,
    "question_text": "What is the primary role of a Clustered Index?",
    "question_type": "single_choice",
    "marks": 2.0,
    "negative_marks": 0.5,
    "difficulty": "medium",
    "topic": "Indexing",
    "explanation": "Dictates physical ordering of rows.",
    "options": [
      { "key": "A", "text": "Determines physical order and leaf stores rows", "is_correct": true },
      { "key": "B", "text": "Stores pointers to memory addresses", "is_correct": false }
    ]
  }
  ```

#### `DELETE /api/teacher/questions/:questionId`
Deletes a question from question bank.

#### `GET /api/teacher/exams`
Returns exams created by this instructor with submission statistics.

#### `POST /api/teacher/exams`
Creates an examination with schedules, marks, duration, and question mappings.

#### `GET /api/teacher/exams/:examId/submissions`
Lists student attempts for an exam, indicating grading status and scores.

#### `GET /api/teacher/submissions/:attemptId`
Retrieves detailed answers for an attempt to enable grading.

#### `POST /api/teacher/submissions/:attemptId/evaluate`
Evaluates a student's descriptive response:
- **Request Body:**
  ```json
  {
    "question_id": 5,
    "marks_obtained": 4.5,
    "teacher_feedback": "Excellent explanation of 2PL and write locks."
  }
  ```
Recalculates total score, percentage, grade, pass status, and updates `results` and `attempts`.

#### `POST /api/teacher/exams/:examId/publish-results`
Calculates DENSE_RANK() across all submitted attempts, marks results as published, and updates `exams.is_published_results = 1`.

---

### 4. Student Endpoints (`/api/student`)
*(Protected by `authorizeRoles('student', 'admin')`)*

#### `GET /api/student/dashboard`
Returns student dashboard metrics, upcoming exams, active attempts, and recent scores.

#### `GET /api/student/exams/available`
Lists scheduled and open exams available for the student's program and semester.

#### `POST /api/student/exams/:examId/register`
Enrolls student in an examination.

#### `GET /api/student/results`
Returns published results and grade summaries.

#### `GET /api/student/results/:resultId`
Fetches comprehensive scorecard. If the exam results have been published by the instructor, includes question-by-question review, chosen answers, correct answers, explanations, and teacher feedback.

#### `GET /api/student/analytics`
Returns longitudinal score progressions and subject-wise averages.

---

### 5. Examination Engine Endpoints (`/api/exam`)
*(Protected by `authorizeRoles('student', 'admin')`)*

#### `POST /api/exam/:examId/start`
Starts or resumes an exam attempt. Server validates start/end time windows and single-active-attempt rule.
Returns attempt ID.

#### `GET /api/exam/:attemptId/state`
Returns the active examination runtime state:
- Questions list (sanitized: `is_correct` stripped for security).
- Saved answers map.
- Server-authoritative remaining seconds (`remainingSeconds`).

#### `POST /api/exam/:attemptId/save-answer`
Autosaves response for a question.
- **Request Body:**
  ```json
  {
    "questionId": 12,
    "selectedOptions": ["B"],
    "descriptiveAnswer": null,
    "isMarkedForReview": false
  }
  ```

#### `POST /api/exam/:attemptId/submit`
Executes an ACID MySQL transaction:
1. Acquires exclusive row lock `FOR UPDATE` on attempt.
2. Validates session is `in_progress`.
3. Evaluates all objective questions against answer keys in database.
4. Updates attempt to `evaluated` or `submitted`.
5. Inserts/updates `results` table.
6. Commits transaction and returns result summary.

---

### 6. Analytics Endpoints (`/api/analytics`)

#### `GET /api/analytics/overview`
Aggregated university metrics, grade distribution, department pass rates, and semester trends.

#### `GET /api/analytics/exam/:examId`
Exam performance breakdown: score buckets, top 10 leaderboard, and question difficulty distribution.

---

### 7. Interactive DBMS Laboratory Endpoints (`/api/dbms-lab`)

#### `GET /api/dbms-lab/catalog`
Returns curated syllabus query templates categorized by DDL, DML, DCL, TCL, Joins, Subqueries, Set Operations, Views, Indexes, Window Functions, and CTEs.

#### `POST /api/dbms-lab/execute`
Executes an arbitrary or curated SQL query against MySQL:
- Measures execution time in milliseconds.
- Obtains `EXPLAIN` query execution plan.
- Returns `{ rowCount, executionTimeMs, columns, rows, explainPlan }`.

