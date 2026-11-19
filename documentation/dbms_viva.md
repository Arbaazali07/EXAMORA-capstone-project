# EXAMORA: University DBMS Comprehensive Viva-Voce Guide
## 45 Technical Viva Questions & In-Depth Academic Answers based on EXAMORA Implementation

---

### Category 1: Relational Database Design, ER Modeling & Normalization

#### Q1. Explain the entity specialization hierarchy used for Users, Teachers, and Students in EXAMORA.
**Answer:**
EXAMORA utilizes a **1:1 Relational Specialization / Inheritance pattern**.
The base entity table `users` contains universal authentication and profile attributes (`id`, `username`, `email`, `password_hash`, `role`, `full_name`, `created_at`).
Sub-entities `teachers` and `students` have separate tables that reference `users(id)` via a Foreign Key with a `UNIQUE` constraint and `ON DELETE CASCADE`.
- This ensures:
  1. No duplicate email or password storage across roles.
  2. Polymorphic authentication in one central table.
  3. Domain-specific attributes (e.g., `roll_number`, `admission_year`, `semester_id` for students; `employee_id`, `designation` for teachers) remain strongly typed and normalized without NULL-value bloat.

#### Q2. Why is the relationship between Teachers and Courses designed through an associative entity `teacher_courses`?
**Answer:**
The relationship between Teachers and Courses is **Many-to-Many ($M:N$) qualified by Academic Semester**.
A single teacher can teach multiple courses over their career, and a single course (e.g., CS301 - DBMS) can be taught by multiple instructors across different semesters or sections.
By introducing the associative entity `teacher_courses` with a composite unique constraint `UNIQUE (teacher_id, course_id, semester_id)`, the schema cleanly tracks which teacher is responsible for which course in which specific academic term, maintaining 3NF/BCNF.

#### Q3. What is the difference between 3NF and BCNF? Does EXAMORA satisfy BCNF?
**Answer:**
- **3NF:** For every non-trivial functional dependency $X \rightarrow Y$, either $X$ is a superkey OR $Y$ is a prime attribute (part of any candidate key).
- **BCNF (Boyce-Codd Normal Form):** Stricter than 3NF. For *every* non-trivial functional dependency $X \rightarrow Y$, $X$ MUST be a superkey. BCNF disallows cases where a non-superkey determines a prime attribute.
- **In EXAMORA:** Every single determinant in our functional dependencies (e.g., `user_id`, `roll_number`, `employee_id`, `(exam_id, question_id)`, `(attempt_id, question_id)`) is a candidate key or superkey of its respective relation. Therefore, all 16 tables in EXAMORA strictly satisfy BCNF.

#### Q4. How does EXAMORA avoid Insertion, Update, and Deletion Anomalies?
**Answer:**
- **Insertion Anomaly:** In an unnormalized flat table, we could not add a new Department or Course without simultaneously enrolling a student or scheduling an exam. In EXAMORA, `departments` and `courses` are isolated tables, allowing departments and courses to be created independently.
- **Update Anomaly:** Course details (like `course_name` or `credits`) exist in exactly one place in `courses`. Updating a course name requires modifying a single tuple, preventing inconsistent data across historic exams.
- **Deletion Anomaly:** If a student withdraws and their student record is deleted, `ON DELETE CASCADE` removes their attempts and answers, while the parent `departments`, `courses`, and `exams` remain completely intact.

#### Q5. What referential integrity constraints were chosen for `department_id` in `students` vs `courses`? Why?
**Answer:**
- `students.department_id` uses **`ON DELETE RESTRICT`**. A department with active enrolled students cannot be accidentally dropped from the database, preventing orphaned student records.
- `courses.department_id` uses **`ON DELETE CASCADE`**. If an entire academic curriculum or department is legally decommissioned by university administrators, its course catalog is safely pruned along with it.

---

### Category 2: Transaction Management & Concurrency Control (ACID)

#### Q6. What are ACID properties, and how are they practically enforced during exam submission in EXAMORA?
**Answer:**
- **Atomicity:** All operations in exam submission (saving remaining answers, evaluating marks, updating attempt status, inserting into `results`, logging audit trail) are wrapped in `START TRANSACTION` and `COMMIT`. If any error occurs, `ROLLBACK` executes, leaving no half-submitted state.
- **Consistency:** Database integrity constraints (`chk_exam_marks`, foreign keys, check constraints) ensure percentages never exceed 100% and marks are never negative beyond permitted penalization.
- **Isolation:** Managed via InnoDB row-level locking (`SELECT ... FOR UPDATE`) so concurrent submission requests or auto-submit triggers cannot conflict or create duplicate result rows.
- **Durability:** Guaranteed by MySQL InnoDB's Write-Ahead Logging (WAL) and Redo Log (`ib_logfile`), ensuring committed exam results persist even in catastrophic server power failure.

#### Q7. Why did we use `SELECT ... FOR UPDATE` when starting an exam submission?
**Answer:**
`SELECT ... FOR UPDATE` is an **exclusive write lock (X-lock)** placed on the student's attempt row in MySQL.
In an online examination system, a race condition can occur if:
1. The student clicks "Submit Exam".
2. Simultaneously, the background client-side auto-submit timer triggers a second submission request.
Without `FOR UPDATE`, both requests could evaluate the attempt concurrently, resulting in duplicate calculations or corrupted scorecards.
`FOR UPDATE` serializes these requests: the first transaction acquires the lock, transitions the attempt status from `in_progress` to `submitted`/`evaluated`, and commits; the second transaction then wakes up, observes `status !== 'in_progress'`, and aborts cleanly.

#### Q8. What is the Lost Update problem? How does 2-Phase Locking (2PL) prevent it?
**Answer:**
The Lost Update problem occurs when Transaction $T_1$ reads record $R$, Transaction $T_2$ reads record $R$, $T_1$ updates $R$ and commits, and then $T_2$ overwrites $R$ based on its stale read, overwriting $T_1$'s changes.
**Two-Phase Locking (2PL)** prevents this by enforcing:
1. **Growing Phase:** A transaction acquires locks as needed; cannot release any lock.
2. **Shrinking Phase:** Once a transaction releases any lock, it can acquire no new locks.
Because $T_2$ cannot obtain an exclusive lock to write $R$ while $T_1$ holds a lock, $T_2$ is forced to wait until $T_1$ finishes, ensuring conflict serializability.

#### Q9. What are the four ANSI SQL Transaction Isolation Levels, and what read phenomena do they prevent?
**Answer:**
1. **READ UNCOMMITTED:** Lowest level. Allows Dirty Read, Non-Repeatable Read, and Phantom Read.
2. **READ COMMITTED:** Prevents Dirty Reads. Allows Non-Repeatable Read and Phantom Read.
3. **REPEATABLE READ (MySQL InnoDB Default):** Prevents Dirty Reads and Non-Repeatable Reads. MySQL InnoDB also prevents Phantom Reads in practice using Multi-Version Concurrency Control (MVCC) and Next-Key Locks.
4. **SERIALIZABLE:** Strict sequential execution. Emulates 2PL with shared read locks. Prevents all anomalies.

#### Q10. What is a SAVEPOINT in MySQL? How is it used?
**Answer:**
A `SAVEPOINT` establishes an intermediate marker within a transaction without committing the preceding work.
Syntax: `SAVEPOINT savepoint_name;`
If a subsequent non-critical operation fails (e.g., writing a secondary logging row), the transaction can execute `ROLLBACK TO SAVEPOINT savepoint_name;` to undo only that failed step while retaining the primary modifications before finalizing with `COMMIT`.

---

### Category 3: SQL Joins, Subqueries & Set Operations

#### Q11. How is a FULL OUTER JOIN achieved in MySQL 8?
**Answer:**
MySQL does not provide a native `FULL OUTER JOIN` keyword. In EXAMORA, we emulate it using:
```sql
SELECT c.id, c.course_name, e.title 
FROM courses c LEFT JOIN exams e ON c.id = e.course_id
UNION
SELECT c.id, c.course_name, e.title 
FROM courses c RIGHT JOIN exams e ON c.id = e.course_id;
```
The `UNION` operator inherently deduplicates tuples returned by both joins, producing the exact relational algebra definition of Full Outer Join.

#### Q12. Explain the difference between `UNION` and `UNION ALL`.
**Answer:**
- `UNION` combines the result sets of two SELECT queries and performs a distinct sort pass to eliminate duplicate rows. It has an algorithmic overhead of $O(N \log N)$ due to sorting and deduplication.
- `UNION ALL` concatenates the result sets directly without checking for duplicates ($O(N)$ complexity).
In EXAMORA, `UNION ALL` is used when logging aggregated audit streams where duplicate IDs represent distinct events.

#### Q13. How does EXAMORA emulate the `INTERSECT` and `EXCEPT` set operators in MySQL?
**Answer:**
- **INTERSECT Emulation:**
  ```sql
  SELECT r1.student_id FROM registrations r1
  INNER JOIN registrations r2 ON r1.student_id = r2.student_id AND r2.exam_id = 2
  WHERE r1.exam_id = 1;
  ```
  (Can also be achieved using `WHERE student_id IN (...)` or `WHERE EXISTS (...)`).
- **EXCEPT / MINUS Emulation:**
  ```sql
  SELECT r1.student_id FROM registrations r1
  WHERE r1.exam_id = 1
    AND NOT EXISTS (SELECT 1 FROM registrations r2 WHERE r2.student_id = r1.student_id AND r2.exam_id = 2);
  ```

#### Q14. What is a Correlated Subquery? How does it differ from a Nested Subquery?
**Answer:**
- **Nested (Independent) Subquery:** The inner query executes once independently and passes its result to the outer query (e.g., finding students with score above the scalar `AVG(score)`).
- **Correlated Subquery:** The inner query contains a reference to an attribute from the outer query tuple (e.g., finding the top scorer within *each* course `WHERE r.obtained_marks = (SELECT MAX(marks) ... WHERE course_id = outer.course_id)`). It must conceptually evaluate once for every candidate row examined by the outer query.

#### Q15. When is `EXISTS` preferred over `IN` in SQL query optimization?
**Answer:**
`EXISTS` tests for the existence of at least one matching row and terminates evaluation immediately upon finding the first match (short-circuit evaluation).
`IN` evaluates the full inner query and constructs an in-memory set before checking membership. Furthermore, if the subquery in an `IN` clause returns a `NULL`, three-valued SQL logic can produce unexpected non-matches. Hence, `EXISTS` is faster and null-safe for correlated parent-child existence checks.

---

### Category 4: Database Views, Indexing & Query Optimization

#### Q16. What is a Database View? What are the 4 views created in EXAMORA?
**Answer:**
A View is a virtual relational table defined by an underlying stored SQL query. It does not store physical data itself (unless materialized); instead, it executes dynamically when queried.
The 4 views in EXAMORA are:
1. `student_result_view`: Detailed student scorecard joining results, students, users, exams, courses, and departments.
2. `exam_performance_view`: Aggregated statistics for exams (total registered, attempts, average score, pass percentage, min/max marks).
3. `course_wise_performance_view`: Multi-exam course summary with department mappings and pass rates.
4. `student_attempt_history_view`: Chronological exam attempt sessions with duration spent, status, score, and rank.

#### Q17. Can views be updated in MySQL? Are EXAMORA's views updatable?
**Answer:**
In MySQL, a view is updatable only if it maps 1:1 to a single underlying base table without aggregate functions (`SUM`, `AVG`, `COUNT`), `GROUP BY`, `HAVING`, `UNION`, or `DISTINCT`.
Because all 4 views in EXAMORA contain aggregate functions, `GROUP BY`, and multi-table joins for analytical reporting, they are **read-only views**.

#### Q18. What is the difference between a Clustered Index and a Secondary (Non-Clustered) Index in InnoDB?
**Answer:**
- **Clustered Index:** The physical table data in InnoDB is organized as a B+ Tree structured around the Primary Key. The leaf nodes of the clustered index contain the actual row data tuples. Every InnoDB table has exactly one clustered index.
- **Secondary Index:** Defined on non-primary columns (e.g., `idx_attempts_student_id`). The leaf nodes of a secondary index do NOT contain the full data row; instead, they contain the indexed column values and a pointer (the primary key value) back to the clustered index.

#### Q19. Explain Composite Indexes and the "Leftmost Prefix Rule".
**Answer:**
A Composite Index is an index created on two or more columns, such as `idx_attempts_composite_search ON attempts(exam_id, student_id, status)`.
**Leftmost Prefix Rule:** MySQL can use this composite index for queries filtering on:
1. `(exam_id)`
2. `(exam_id, student_id)`
3. `(exam_id, student_id, status)`
However, if a query filters only on `(student_id)` or `(status)`, MySQL cannot use this composite index because the leftmost prefix `exam_id` was not specified in the search predicate.

#### Q20. What is `EXPLAIN ANALYZE` in MySQL 8? How does it help in query tuning?
**Answer:**
While standard `EXPLAIN` shows the query optimizer's *estimated* plan (join order, indexes considered, estimated row counts), `EXPLAIN ANALYZE` actually executes the query, records actual CPU time, loops, actual rows returned at each iterator node in the execution tree, and compares actual performance against estimated costs. It helps pinpoint index misses, sort buffer spills, and hash join bottlenecks.

---

### Category 5: Window Functions & Common Table Expressions (CTEs)

#### Q21. What is the key distinction between Window Functions and Aggregate Functions with `GROUP BY`?
**Answer:**
- `GROUP BY` collapses multiple rows into a single summary row, losing the individuality of the underlying tuples.
- **Window Functions** perform calculations across a specified set of table rows (the window) while **retaining the distinct identity of every individual row** in the output.

#### Q22. Compare `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()` with an example.
**Answer:**
Suppose three students achieve scores of 95, 90, 90, and 85:
- `ROW_NUMBER()`: Assigns strict incrementing integers: 1, 2, 3, 4.
- `RANK()`: Assigns identical rank to ties, but leaves a gap: 1, 2, 2, 4 (skips rank 3).
- `DENSE_RANK()`: Assigns identical rank to ties without gaps: 1, 2, 2, 3.
In EXAMORA, `DENSE_RANK()` is used for academic grading and leaderboard positions so tied scores share the same award tier without penalizing subsequent students.

#### Q23. How do `LAG()` and `LEAD()` window functions work in EXAMORA?
**Answer:**
- `LAG(col, offset)` accesses a value from a previous row at a specified offset relative to the current row within the partition window.
- `LEAD(col, offset)` accesses a value from a subsequent row.
In EXAMORA, `LAG()` is used to compare each student's score against the immediately preceding peer's score to calculate the deficit from the higher rank, as well as tracking score improvements between sequential exams.

#### Q24. What is a Common Table Expression (CTE)? Why is it preferable over deeply nested subqueries?
**Answer:**
A CTE (`WITH cte_name AS (...)`) defines a named temporary result set available within the execution scope of a subsequent SELECT, INSERT, UPDATE, or DELETE statement.
Benefits:
1. **Readability & Modularity:** Replaces hard-to-read deeply nested subqueries with linear, top-to-bottom procedural-style queries.
2. **Reusability:** A CTE can be referenced multiple times within the same outer query without duplicating SQL code.
3. **Recursive Capabilities:** Enables recursive queries for hierarchical data traversal.

#### Q25. Can a CTE in MySQL be recursive? Provide an example from EXAMORA.
**Answer:**
Yes. A Recursive CTE has an initial anchor member, a `UNION ALL`, and a recursive member referencing the CTE itself.
In EXAMORA, we demonstrated a recursive CTE generating academic question difficulty levels from 'easy' to 'medium' to 'hard' and 'mastery'.

---

### Category 6: Database Security, Integrity & Architecture

#### Q26. Why should passwords never be stored in plain text? What hashing algorithm does EXAMORA use?
**Answer:**
Storing plain-text passwords violates fundamental data protection regulations and exposes user credentials in the event of SQL injection or database backups leakage.
EXAMORA uses **bcrypt** with a work factor (salt rounds) of 10. Bcrypt incorporates a cryptographically random salt to defeat rainbow-table attacks and is computationally intensive (key-stretching) to resist brute-force hardware dictionary attacks.

#### Q27. How does EXAMORA prevent SQL Injection attacks?
**Answer:**
EXAMORA utilizes **Parameterized Prepared Statements** via the Node.js `mysql2/promise` library (`pool.query('SELECT ... WHERE id = ?', [id])`).
Parameterized queries separate SQL code structure from user data. The database compiles the SQL statement skeleton first; parameters are transmitted separately as pure literal values, ensuring that malicious strings (e.g. `' OR '1'='1`) can never alter the syntactic execution structure of the query.

#### Q28. How does EXAMORA protect examination answer keys from being inspected by tech-savvy students via browser developer tools?
**Answer:**
When an active examination session is fetched via `GET /api/exam/:attemptId/state`, the SQL query explicitly selects only `id, question_id, option_key, option_text` from `question_options`, strictly omitting the `is_correct` boolean column.
Correct answers and explanations are stored securely on the database server and are only returned after the teacher formally executes `publishExamResults`.

#### Q29. How does EXAMORA ensure that a student cannot submit answers after the time limit has expired?
**Answer:**
EXAMORA implements **Server-Authoritative Time Enforcement**:
1. When the student starts an exam, the server writes `start_time = NOW()` to `attempts`.
2. On every answer save and on final submission, the server checks:
   `NOW() <= attempt.start_time + duration_minutes + grace_period` AND `NOW() <= exam.end_time`.
The frontend countdown timer is purely a visual convenience; an altered or frozen client clock cannot bypass the server-side timestamp validation.

#### Q30. What is the role of the `audit_logs` table in EXAMORA?
**Answer:**
The `audit_logs` table provides an immutable security audit trail. Every critical system action (user registrations, exam publications, attempts started, answers submitted, evaluations finalized) records:
- `user_id` (foreign key to users, with `ON DELETE SET NULL` to retain audit history)
- `action` (action code)
- `entity_type` and `entity_id`
- `details` (JSON payload)
- `ip_address`
- `created_at` (automatic timestamp)

---

### Category 7: Advanced DBMS Concepts & Capstone Viva Deep Dives

#### Q31. What is the difference between TRUNCATE and DELETE in MySQL?
**Answer:**
- `DELETE` is a DML command that removes tuples row-by-row, firing row-level triggers, recording individual log entries in the transaction redo log, and can be rolled back if inside an active transaction.
- `TRUNCATE` is a DDL command that deallocates all data pages of the table, resets the `AUTO_INCREMENT` counter to 1, does not fire triggers, and cannot be safely rolled back in older storage engines. It is significantly faster for resetting entire tables.

#### Q32. What is the InnoDB Buffer Pool, and why is it crucial for database throughput?
**Answer:**
The InnoDB Buffer Pool is a dedicated region in system RAM where InnoDB caches cached table data and index pages. When a query accesses rows, InnoDB checks the Buffer Pool first (cache hit, $O(\mu s)$); only if the page is missing does it read from non-volatile disk ($O(ms)$). Dirty pages are modified in RAM and flushed asynchronously to disk via Write-Ahead Logging (WAL).

#### Q33. What is the difference between Dense Index and Sparse Index?
**Answer:**
- **Dense Index:** Contains an index record for *every single search key value* in the data file.
- **Sparse Index:** Contains index records for only some of the search key values (usually one per disk block/page). Sparse indexes require less space but assume the physical data is sorted by the search key.

#### Q34. How does MySQL handle NULL values in indexing and aggregate functions?
**Answer:**
- Aggregate functions like `AVG()`, `SUM()`, `MIN()`, `MAX()`, and `COUNT(column)` automatically ignore `NULL` values. Only `COUNT(*)` counts rows containing NULLs.
- In MySQL B-Tree indexes, `NULL` values are treated as the lowest possible value and indexed together at the start of the index structure.

#### Q35. What is the difference between Phantom Read and Non-Repeatable Read?
**Answer:**
- **Non-Repeatable Read:** Transaction $T_1$ reads a row. Transaction $T_2$ *modifies* or *deletes* that row and commits. $T_1$ rereads the row and sees the modified data.
- **Phantom Read:** Transaction $T_1$ executes a range query (e.g. `WHERE marks > 80`). Transaction $T_2$ *inserts* a new row satisfying the predicate and commits. $T_1$ re-executes the query and sees a new "phantom" row that was not present previously.

#### Q36. What is a Database Cursor? When is it used?
**Answer:**
A Cursor is a database control structure that allows sequential row-by-row traversal over the result set of a query. In SQL, set-based operations are preferred for performance; cursors are used in stored procedures or batch jobs when procedural logic must process each record independently.

#### Q37. What is Database Sharding? How does it differ from Horizontal Partitioning?
**Answer:**
- **Horizontal Partitioning:** Splitting a large table into smaller physical partitions within the *same database instance* based on a partition key (e.g., partitioning attempts by academic year).
- **Sharding:** Distributing partitions across *multiple distinct physical database servers*, each holding a subset of the data to achieve horizontal write scaling.

#### Q38. What is the Purpose of JSON data type in MySQL 8? How is it used in EXAMORA?
**Answer:**
MySQL 8 provides a native `JSON` binary storage format that performs automatic validation and provides fast path lookups via functions like `JSON_EXTRACT()` and `->>`.
In EXAMORA, `JSON` is used in:
- `student_answers.selected_options`: efficiently stores variable arrays of chosen option keys (`["A", "C"]`) for multiple-choice questions without requiring a bloated secondary junction table for transient picks.
- `audit_logs.details`: stores arbitrary contextual metadata for administrative actions.

#### Q39. What is a Candidate Key vs a Superkey vs a Primary Key?
**Answer:**
- **Superkey:** Any set of attributes within a relation for which no two distinct tuples have identical values.
- **Candidate Key:** A minimal superkey; a superkey from which no attribute can be discarded without losing the uniqueness property.
- **Primary Key:** The single candidate key selected by the database designer to uniquely identify tuples in the relation.

#### Q40. What is 1NF violation and how was it eliminated in EXAMORA?
**Answer:**
1NF is violated when a table contains non-atomic attributes or repeating groups (e.g., storing all 4 options `'A: Yes, B: No, C: Maybe'` in a single text column).
EXAMORA eliminates this by creating a dedicated child relation `question_options` where each choice is an individual atomic tuple linked via `question_id`.

#### Q41. What is the difference between optimistic concurrency control and pessimistic concurrency control?
**Answer:**
- **Pessimistic Concurrency:** Assumes conflicts will occur; locks resources upfront (`SELECT ... FOR UPDATE`, row locks) preventing other transactions from accessing them. Used in EXAMORA during exam submission.
- **Optimistic Concurrency:** Assumes conflicts are rare; allows transactions to proceed without locking, verifying version stamps or update timestamps prior to committing.

#### Q42. What is Two-Tier vs Three-Tier Database Architecture?
**Answer:**
- **Two-Tier (Client-Server):** User interface directly connects to the database engine.
- **Three-Tier (Used in EXAMORA):**
  1. Presentation Layer: React.js Vite Frontend.
  2. Application / Logic Layer: Node.js Express REST API server with JWT authentication and business logic.
  3. Database Layer: MySQL 8.0 InnoDB Relational Database.
This enforces separation of concerns, connection pooling, and prevents clients from directly issuing arbitrary database queries.

#### Q43. What is Foreign Key Action `ON DELETE SET NULL`? Where is it applied?
**Answer:**
When a parent record is deleted, any child foreign key references are automatically set to `NULL` rather than deleting the child record.
In EXAMORA, `audit_logs.user_id` uses `ON DELETE SET NULL`. If an inactive user account is pruned from the system, their historic audit logs remain intact for forensic security compliance, with `user_id` set to NULL.

#### Q44. How does B+ Tree depth affect database query performance?
**Answer:**
B+ Trees possess exceptionally high fan-out (typically 100 to 500 keys per page). Consequently, a table with millions of rows can be indexed within a B+ Tree of depth 3 or 4.
Because the root and internal nodes reside permanently in the InnoDB Buffer Pool RAM, searching for any primary key requires at most 1 or 2 physical disk I/O operations, guaranteeing logarithmic $O(\log N)$ performance.

#### Q45. Why is UTF8MB4 character set required instead of legacy UTF8 in MySQL?
**Answer:**
MySQL's historic `utf8` character set allocated only up to 3 bytes per character, failing to support supplementary Unicode characters (including emojis, scientific notation, and complex mathematical symbols).
`utf8mb4` fully implements 4-byte Unicode encoding, ensuring full compatibility with internationalization and modern student inputs.

