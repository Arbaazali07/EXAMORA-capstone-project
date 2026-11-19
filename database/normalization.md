# EXAMORA: Database Normalization Document
## Formal Relational Database Design, Functional Dependencies & Normal Forms (1NF to BCNF)

---

### 1. Executive Summary

In relational database design, **Normalization** is the systematic technique of organizing data in a database to eliminate redundancy, avoid update/insert/delete anomalies, and enforce data integrity through well-defined mathematical functional dependencies.

This document details the rigorous theoretical and practical decomposition process undertaken for **EXAMORA: Smart Online Examination & Assessment Management System**, demonstrating step-by-step transformation from an unnormalized relation ($0NF$) up to **Boyce-Codd Normal Form (BCNF)**.

---

### 2. The Unnormalized Relation ($0NF$)

Consider a hypothetical flat legacy examination spreadsheet or single relation before normalization:

```text
UNNORMALIZED_EXAM_RECORD (
    student_roll, student_name, student_email, dept_code, dept_name, 
    semester_code, semester_name, 
    course_code, course_name, course_credits,
    teacher_emp_id, teacher_name, teacher_email, teacher_designation,
    exam_id, exam_title, exam_start, exam_end, exam_duration,
    question_id, question_text, question_type, question_marks,
    option_keys, option_texts, correct_options,
    student_answer, marks_obtained, is_passed, total_score, exam_rank
)
```

#### Anomalies Present in $0NF$:

1. **Non-Atomic Attributes (Violation of 1NF):**
   - Attributes like `option_keys` (`['A', 'B', 'C', 'D']`), `option_texts`, and `correct_options` contain repeating groups / multi-valued sets in a single cell.
2. **Insertion Anomaly:**
   - A new department, course, or teacher cannot be entered into the system unless a student takes an exam and answers questions for that course.
3. **Update / Modification Anomaly:**
   - If a course name or credit changes (e.g., `CS301` from 3 to 4 credits), thousands of duplicate records across historical exam attempts must be updated. Any missed update causes data inconsistency.
4. **Deletion Anomaly:**
   - If a student withdraws and their examination record is deleted, critical course metadata, teacher details, and question bank data are unintentionally deleted.

---

### 3. First Normal Form (1NF)

#### Definition:
A relation $R$ is in **First Normal Form (1NF)** if and only if:
1. Every attribute domain contains only atomic (indivisible) values.
2. There are no repeating groups or multivalued arrays stored within a single tuple.
3. Each record is uniquely identifiable by a Primary Key.

#### Transformation to 1NF:
We flatten repeating groups. Each individual option is given its own atomic tuple, and composite keys are identified.

```text
R_1NF (
    student_roll, course_code, exam_id, question_id, option_key,
    student_name, student_email, dept_code, dept_name,
    semester_code, semester_name, course_name, course_credits,
    teacher_emp_id, teacher_name, teacher_designation,
    exam_title, exam_start, exam_end, exam_duration,
    question_text, question_type, question_marks,
    option_text, is_correct, student_answer, marks_obtained
)
```

**Candidate Key for R_1NF:**
$$\{ \text{student\_roll}, \text{exam\_id}, \text{question\_id}, \text{option\_key} \}$$

---

### 4. Functional Dependencies (FDs) in the Domain

Let us formalize the functional dependencies governing the EXAMORA system:

1. **$FD_1$ (Student):**
   $$\text{student\_roll} \rightarrow \{ \text{student\_name}, \text{student\_email}, \text{dept\_code}, \text{semester\_code} \}$$
2. **$FD_2$ (Department):**
   $$\text{dept\_code} \rightarrow \{ \text{dept\_name} \}$$
3. **$FD_3$ (Semester):**
   $$\text{semester\_code} \rightarrow \{ \text{semester\_name}, \text{academic\_year} \}$$
4. **$FD_4$ (Course):**
   $$\text{course\_code} \rightarrow \{ \text{course\_name}, \text{course\_credits}, \text{dept\_code} \}$$
5. **$FD_5$ (Teacher):**
   $$\text{teacher\_emp\_id} \rightarrow \{ \text{teacher\_name}, \text{teacher\_email}, \text{teacher\_designation}, \text{dept\_code} \}$$
6. **$FD_6$ (Exam):**
   $$\text{exam\_id} \rightarrow \{ \text{exam\_title}, \text{course\_code}, \text{semester\_code}, \text{teacher\_emp\_id}, \text{exam\_start}, \text{exam\_end}, \text{exam\_duration} \}$$
7. **$FD_7$ (Question):**
   $$\text{question\_id} \rightarrow \{ \text{course\_code}, \text{question\_text}, \text{question\_type}, \text{question\_marks} \}$$
8. **$FD_8$ (Option):**
   $$\{ \text{question\_id}, \text{option\_key} \} \rightarrow \{ \text{option\_text}, \text{is\_correct} \}$$
9. **$FD_9$ (Student Exam Answer):**
   $$\{ \text{student\_roll}, \text{exam\_id}, \text{question\_id} \} \rightarrow \{ \text{student\_answer}, \text{marks\_obtained} \}$$

---

### 5. Second Normal Form (2NF)

#### Definition:
A relation $R$ is in **Second Normal Form (2NF)** if:
1. It is in **1NF**.
2. **No non-prime attribute is partially dependent on any candidate key.** (Every non-prime attribute must depend on the *entire* candidate key, not a proper subset of it).

#### Partial Dependencies in $R_{1NF}$:
- Candidate Key: $\{ \text{student\_roll}, \text{exam\_id}, \text{question\_id}, \text{option\_key} \}$
- Partial Dependency 1: $\text{student\_roll} \rightarrow \text{student\_name}, \text{student\_email}$ (depends only on part of the key).
- Partial Dependency 2: $\text{exam\_id} \rightarrow \text{exam\_title}, \text{exam\_start}, \text{exam\_duration}$.
- Partial Dependency 3: $\text{question\_id} \rightarrow \text{question\_text}, \text{question\_marks}$.
- Partial Dependency 4: $\{ \text{question\_id}, \text{option\_key} \} \rightarrow \text{option\_text}, \text{is\_correct}$.

#### 2NF Decomposition:
To eliminate partial dependencies, we decompose $R_{1NF}$ into separate relations matching each determinant:

1. **`STUDENTS_2NF`** ($\underline{\text{student\_roll}}$, student\_name, student\_email, dept\_code, dept\_name, semester\_code, semester\_name)
2. **`COURSES_2NF`** ($\underline{\text{course\_code}}$, course\_name, course\_credits, dept\_code, dept\_name)
3. **`TEACHERS_2NF`** ($\underline{\text{teacher\_emp\_id}}$, teacher\_name, teacher\_designation, dept\_code, dept\_name)
4. **`EXAMS_2NF`** ($\underline{\text{exam\_id}}$, exam\_title, course\_code, teacher\_emp\_id, semester\_code, exam\_start, exam\_end, exam\_duration)
5. **`QUESTIONS_2NF`** ($\underline{\text{question\_id}}$, course\_code, question\_text, question\_type, question\_marks)
6. **`QUESTION_OPTIONS_2NF`** ($\underline{\text{question\_id}, \text{option\_key}}$, option\_text, is\_correct)
7. **`STUDENT_ANSWERS_2NF`** ($\underline{\text{student\_roll}, \text{exam\_id}, \text{question\_id}}$, student\_answer, marks\_obtained)

All non-prime attributes now depend on the *whole* primary key of their respective relations. Hence, all relations are in **2NF**.

---

### 6. Third Normal Form (3NF)

#### Definition:
A relation $R$ is in **Third Normal Form (3NF)** if:
1. It is in **2NF**.
2. **No non-prime attribute is transitively dependent on the primary key.**
   - Formally, for every non-trivial functional dependency $X \rightarrow Y$:
     - Either $X$ is a superkey of $R$, OR
     - $Y$ is a prime attribute (part of a candidate key).

#### Transitive Dependencies in 2NF Relations:
1. In `STUDENTS_2NF`:
   $$\text{student\_roll} \rightarrow \text{dept\_code} \quad \text{and} \quad \text{dept\_code} \rightarrow \text{dept\_name}$$
   Therefore, $\text{student\_roll} \rightarrow \text{dept\_name}$ is a transitive dependency!
   Similarly:
   $$\text{student\_roll} \rightarrow \text{semester\_code} \quad \text{and} \quad \text{semester\_code} \rightarrow \text{semester\_name}$$
2. In `COURSES_2NF`:
   $$\text{course\_code} \rightarrow \text{dept\_code} \quad \text{and} \quad \text{dept\_code} \rightarrow \text{dept\_name}$$
3. In `TEACHERS_2NF`:
   $$\text{teacher\_emp\_id} \rightarrow \text{dept\_code} \quad \text{and} \quad \text{dept\_code} \rightarrow \text{dept\_name}$$

#### 3NF Decomposition:
To eliminate transitive dependencies, we isolate `departments` and `semesters` into independent entity tables referenced via Foreign Keys:

1. **`DEPARTMENTS`** ($\underline{\text{id}}$, dept\_code, dept\_name, description)
   - Determinant: $\text{dept\_code}$ is a candidate key.
2. **`SEMESTERS`** ($\underline{\text{id}}$, semester\_code, semester\_name, academic\_year)
   - Determinant: $\text{semester\_code}$ is a candidate key.
3. **`COURSES`** ($\underline{\text{id}}$, course\_code, course\_name, credits, department\_id)
   - Foreign Key: `department_id` references `departments(id)`.
4. **`USERS`** ($\underline{\text{id}}$, username, email, password\_hash, role, full\_name)
   - Eliminates redundant user account fields across teachers, students, and admins.
5. **`STUDENTS`** ($\underline{\text{id}}$, user\_id, roll\_number, department\_id, semester\_id, admission\_year)
   - Foreign Keys: `user_id`, `department_id`, `semester_id`.
6. **`TEACHERS`** ($\underline{\text{id}}$, user\_id, employee\_id, department\_id, designation, qualification)
   - Foreign Keys: `user_id`, `department_id`.
7. **`EXAMS`** ($\underline{\text{id}}$, title, course\_id, semester\_id, teacher\_id, start\_time, end\_time, duration\_minutes, total\_marks, passing\_marks)
   - Foreign Keys: `course_id`, `semester_id`, `teacher_id`.

Every determinant is now a superkey. Transitive dependencies are completely eliminated. The schema is in **3NF**.

---

### 7. Boyce-Codd Normal Form (BCNF)

#### Definition:
A relation $R$ is in **Boyce-Codd Normal Form (BCNF)** if and only if:
- For every non-trivial functional dependency $X \rightarrow Y$, **$X$ is a superkey of $R$**.
*(BCNF is a stricter version of 3NF where non-prime attributes cannot be determined by non-superkeys, even if $Y$ is a prime attribute).*

#### Verification of BCNF in EXAMORA:

| Relation | Primary / Candidate Keys | Functional Dependencies | Is Determinant a Superkey? | BCNF Compliant? |
| :--- | :--- | :--- | :---: | :---: |
| `users` | `id`, `username`, `email` | `username` $\rightarrow$ all; `email` $\rightarrow$ all; `id` $\rightarrow$ all | YES | **YES** |
| `departments`| `id`, `dept_code` | `id` $\rightarrow$ all; `dept_code` $\rightarrow$ all | YES | **YES** |
| `semesters` | `id`, `semester_code` | `id` $\rightarrow$ all; `semester_code` $\rightarrow$ all | YES | **YES** |
| `courses` | `id`, `course_code` | `id` $\rightarrow$ all; `course_code` $\rightarrow$ all | YES | **YES** |
| `teachers` | `id`, `user_id`, `employee_id` | `id` $\rightarrow$ all; `user_id` $\rightarrow$ all; `employee_id` $\rightarrow$ all | YES | **YES** |
| `students` | `id`, `user_id`, `roll_number` | `id` $\rightarrow$ all; `user_id` $\rightarrow$ all; `roll_number` $\rightarrow$ all | YES | **YES** |
| `teacher_courses`| `id`, `(teacher_id, course_id, semester_id)` | `(teacher_id, course_id, semester_id)` $\rightarrow$ `assigned_date` | YES | **YES** |
| `exams` | `id` | `id` $\rightarrow$ all | YES | **YES** |
| `questions` | `id` | `id` $\rightarrow$ all | YES | **YES** |
| `question_options`| `id`, `(question_id, option_key)` | `id` $\rightarrow$ all; `(question_id, option_key)` $\rightarrow$ `option_text`, `is_correct` | YES | **YES** |
| `exam_questions`| `id`, `(exam_id, question_id)` | `(exam_id, question_id)` $\rightarrow$ `question_order`, `custom_marks` | YES | **YES** |
| `registrations` | `id`, `(exam_id, student_id)` | `(exam_id, student_id)` $\rightarrow$ `registration_date`, `status` | YES | **YES** |
| `attempts` | `id` | `id` $\rightarrow$ all | YES | **YES** |
| `student_answers`| `id`, `(attempt_id, question_id)`| `(attempt_id, question_id)` $\rightarrow$ `selected_options`, `marks_obtained` | YES | **YES** |
| `results` | `id`, `attempt_id` | `id` $\rightarrow$ all; `attempt_id` $\rightarrow$ all | YES | **YES** |
| `audit_logs` | `id` | `id` $\rightarrow$ all | YES | **YES** |

**Conclusion:** In every single relation of EXAMORA, every determinant of every non-trivial functional dependency is a superkey. Therefore, the schema is strictly in **Boyce-Codd Normal Form (BCNF)**.

---

### 8. Preservation Properties

1. **Dependency Preservation:**
   Every functional dependency present in the initial universe of discourse is preserved either within an individual relation or through foreign key constraints that connect them.
2. **Lossless Join Decomposition:**
   For every decomposition $R \rightarrow (R_1, R_2)$, the condition:
   $$(R_1 \cap R_2 \rightarrow R_1) \quad \text{OR} \quad (R_1 \cap R_2 \rightarrow R_2)$$
   holds true. Rejoining any relation with its parents using `INNER JOIN` produces the exact original tuples without generating spurious tuples.

