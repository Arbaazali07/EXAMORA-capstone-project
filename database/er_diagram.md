# EXAMORA: Entity-Relationship (ER) Model & Relational Schema Mapping
## Formal DBMS Conceptual, Logical, and Physical Design

---

### 1. Conceptual ER Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o| STUDENTS : "1:1 specializes as"
    USERS ||--o| TEACHERS : "1:1 specializes as"
    USERS ||--o{ AUDIT_LOGS : "1:N triggers"
    
    DEPARTMENTS ||--o{ STUDENTS : "1:N enrolls"
    DEPARTMENTS ||--o{ TEACHERS : "1:N employs"
    DEPARTMENTS ||--o{ COURSES : "1:N offers"
    
    SEMESTERS ||--o{ STUDENTS : "1:N current_term"
    SEMESTERS ||--o{ EXAMS : "1:N schedules"
    SEMESTERS ||--o{ TEACHER_COURSES : "1:N term_assignment"
    
    COURSES ||--o{ TEACHER_COURSES : "1:N taught_via"
    TEACHERS ||--o{ TEACHER_COURSES : "1:N teaches"
    
    COURSES ||--o{ EXAMS : "1:N assesses"
    TEACHERS ||--o{ EXAMS : "1:N creates_and_manages"
    
    COURSES ||--o{ QUESTIONS : "1:N categorizes"
    TEACHERS ||--o{ QUESTIONS : "1:N authors"
    
    QUESTIONS ||--|{ QUESTION_OPTIONS : "1:N has_choices"
    
    EXAMS ||--o{ EXAM_QUESTIONS : "1:N selects"
    QUESTIONS ||--o{ EXAM_QUESTIONS : "1:N included_in"
    
    EXAMS ||--o{ REGISTRATIONS : "1:N receives"
    STUDENTS ||--o{ REGISTRATIONS : "1:N registers_for"
    
    EXAMS ||--o{ ATTEMPTS : "1:N attempted_in"
    STUDENTS ||--o{ ATTEMPTS : "1:N takes"
    
    ATTEMPTS ||--o{ STUDENT_ANSWERS : "1:N records"
    QUESTIONS ||--o{ STUDENT_ANSWERS : "1:N answered_for"
    
    ATTEMPTS ||--|| RESULTS : "1:1 evaluated_as"
    EXAMS ||--o{ RESULTS : "1:N aggregates"
    STUDENTS ||--o{ RESULTS : "1:N receives"

    USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        enum role
        string full_name
        timestamp created_at
    }

    DEPARTMENTS {
        int id PK
        string dept_code UK
        string dept_name
        text description
    }

    SEMESTERS {
        int id PK
        string semester_code UK
        string semester_name
        string academic_year
        boolean is_active
    }

    COURSES {
        int id PK
        string course_code UK
        string course_name
        int department_id FK
        int credits
    }

    TEACHERS {
        int id PK
        int user_id FK,UK
        string employee_id UK
        int department_id FK
        string designation
        string qualification
    }

    STUDENTS {
        int id PK
        int user_id FK,UK
        string roll_number UK
        int department_id FK
        int semester_id FK
        int admission_year
    }

    TEACHER_COURSES {
        int id PK
        int teacher_id FK
        int course_id FK
        int semester_id FK
        date assigned_date
    }

    EXAMS {
        int id PK
        string title
        int course_id FK
        int semester_id FK
        int teacher_id FK
        datetime start_time
        datetime end_time
        int duration_minutes
        decimal total_marks
        decimal passing_marks
        decimal negative_marking_per_question
        enum status
        boolean is_published_results
    }

    QUESTIONS {
        int id PK
        int course_id FK
        int created_by_teacher_id FK
        text question_text
        enum question_type
        decimal marks
        decimal negative_marks
        enum difficulty
        string topic
    }

    QUESTION_OPTIONS {
        int id PK
        int question_id FK
        string option_key
        text option_text
        boolean is_correct
    }

    EXAM_QUESTIONS {
        int id PK
        int exam_id FK
        int question_id FK
        int question_order
        decimal custom_marks
    }

    REGISTRATIONS {
        int id PK
        int exam_id FK
        int student_id FK
        timestamp registration_date
        enum status
    }

    ATTEMPTS {
        int id PK
        int exam_id FK
        int student_id FK
        datetime start_time
        datetime submit_time
        enum status
        decimal total_score
        decimal percentage
        boolean is_passed
    }

    STUDENT_ANSWERS {
        int id PK
        int attempt_id FK
        int question_id FK
        json selected_options
        text descriptive_answer
        decimal marks_obtained
        boolean is_marked_for_review
        boolean is_evaluated
    }

    RESULTS {
        int id PK
        int attempt_id FK,UK
        int exam_id FK
        int student_id FK
        int total_questions
        int correct_answers
        int incorrect_answers
        decimal total_marks
        decimal obtained_marks
        decimal percentage
        boolean is_passed
        string grade
        int rank_in_exam
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string entity_type
        int entity_id
        json details
        timestamp created_at
    }
```

---

### 2. Relationship Cardinalities and Structural Constraints

#### A. One-to-One Relationships (1:1)
1. **`users` to `students` (1:1 Partial Specialization):**
   - Each student record corresponds to exactly one user record (`user_id` has a `UNIQUE` constraint).
   - Not all users are students (some are teachers or admins).
2. **`users` to `teachers` (1:1 Partial Specialization):**
   - Each teacher corresponds to exactly one user record (`user_id` has a `UNIQUE` constraint).
3. **`attempts` to `results` (1:1 Total / Partial Specialization):**
   - An evaluated attempt yields exactly one result row (`attempt_id` has a `UNIQUE` constraint in `results`).
   - A fresh `in_progress` attempt has not yet produced a final result until submitted/evaluated.

#### B. One-to-Many Relationships (1:N)
1. **`departments` to `students` (1:N):**
   - One department enrolls many students. Each student belongs to exactly one department (`ON DELETE RESTRICT` protects academic records).
2. **`departments` to `teachers` (1:N):**
   - One department employs many faculty members.
3. **`departments` to `courses` (1:N):**
   - One department offers multiple academic courses.
4. **`courses` to `exams` (1:N):**
   - A course can have multiple midterms, quizzes, and final exams.
5. **`exams` to `attempts` (1:N):**
   - An exam is attempted by multiple students.
6. **`questions` to `question_options` (1:N):**
   - A single MCQ or True/False question possesses multiple distinct options (e.g., A, B, C, D).

#### C. Many-to-Many Relationships (M:N) Resolved via Associative Entities
1. **`teachers` and `courses` (M:N):**
   - A teacher can teach multiple courses; a course can be taught by multiple teachers across different semesters.
   - **Associative Entity:** `teacher_courses` with composite unique constraint `(teacher_id, course_id, semester_id)`.
2. **`exams` and `questions` (M:N):**
   - An examination comprises multiple questions; questions from the question bank can appear in multiple examinations.
   - **Associative Entity:** `exam_questions` with composite unique constraint `(exam_id, question_id)` and order tracking `question_order`.
3. **`exams` and `students` (M:N):**
   - A student registers for and attempts multiple exams; an exam has registrations and attempts from multiple students.
   - **Associative Entities:** `registrations` and `attempts`.
4. **`attempts` and `questions` (M:N):**
   - An attempt contains responses to multiple questions.
   - **Associative Entity:** `student_answers` with composite unique constraint `(attempt_id, question_id)`.

---

### 3. Referential Integrity Policy

| Child Table | Foreign Key Column | Parent Table | On Delete | On Update | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `students` | `department_id` | `departments` | `RESTRICT` | `CASCADE` | Cannot delete department with enrolled students |
| `teachers` | `department_id` | `departments` | `RESTRICT` | `CASCADE` | Cannot delete department with active faculty |
| `courses` | `department_id` | `departments` | `CASCADE` | `CASCADE` | Course lifecycle follows academic department |
| `exams` | `course_id` | `courses` | `CASCADE` | `CASCADE` | Exams belong directly to course syllabus |
| `exams` | `teacher_id` | `teachers` | `RESTRICT` | `CASCADE` | Exam papers require instructor accountability |
| `attempts` | `exam_id` | `exams` | `CASCADE` | `CASCADE` | Deleting exam cascade cleans student attempts |
| `student_answers`| `attempt_id` | `attempts` | `CASCADE` | `CASCADE` | Answers exist only within an attempt session |
| `results` | `attempt_id` | `attempts` | `CASCADE` | `CASCADE` | Scorecards tied to attempt session |
| `audit_logs` | `user_id` | `users` | `SET NULL` | `CASCADE` | Retain security audit trails even if user is pruned |

