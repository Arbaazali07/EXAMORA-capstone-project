// backend/src/scripts/generateSeedSql.js
// Generates database/seed.sql with 3 departments, 6 courses, 3 semesters,
// 10 teachers, 50 students, 5 exams, 100+ questions with options,
// registrations, attempts, answers, and evaluated results.

const fs = require('fs');
const path = require('path');

const PASSWORD_HASH = '$2a$10$EU8e80K.qJ75wDTaQlmA0uiXtUYZwfz8mLaCz5QGgtIh.wi7lzvaG'; // password123

let sql = `-- ============================================================================
-- EXAMORA: Seed Data Script
-- 3 Departments, 6 Courses, 3 Semesters, 10 Teachers, 50 Students,
-- 5 Examinations, 100+ Questions, Registrations, Attempts, Answers, Results.
-- ============================================================================

USE examora_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE results;
TRUNCATE TABLE student_answers;
TRUNCATE TABLE attempts;
TRUNCATE TABLE registrations;
TRUNCATE TABLE exam_questions;
TRUNCATE TABLE question_options;
TRUNCATE TABLE questions;
TRUNCATE TABLE exams;
TRUNCATE TABLE teacher_courses;
TRUNCATE TABLE students;
TRUNCATE TABLE teachers;
TRUNCATE TABLE courses;
TRUNCATE TABLE semesters;
TRUNCATE TABLE departments;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. DEPARTMENTS
INSERT INTO departments (id, dept_code, dept_name, description) VALUES
(1, 'CSE', 'Department of Computer Science & Engineering', 'Focusing on computing theory, algorithms, systems, and database engineering.'),
(2, 'IT', 'Department of Information Technology', 'Focusing on distributed systems, web architectures, and networks.'),
(3, 'ECE', 'Department of Electronics & Communication Engineering', 'Focusing on digital logic, embedded hardware, and communication protocols.');

-- 2. SEMESTERS
INSERT INTO semesters (id, semester_code, semester_name, academic_year, is_active) VALUES
(1, 'SEM3', 'Semester 3 (Sophomore Fall)', '2026-2027', 1),
(2, 'SEM4', 'Semester 4 (Sophomore Spring)', '2026-2027', 1),
(3, 'SEM5', 'Semester 5 (Junior Fall)', '2026-2027', 1);

-- 3. COURSES
INSERT INTO courses (id, course_code, course_name, department_id, credits, description) VALUES
(1, 'CS301', 'Database Management Systems', 1, 4, 'Relational model, SQL, normalization, concurrency, transactions, and indexing.'),
(2, 'CS302', 'Data Structures & Algorithms', 1, 4, 'Trees, graphs, asymptotic analysis, dynamic programming, and sorting.'),
(3, 'IT401', 'Web Technologies & Full-Stack Systems', 2, 3, 'Client-server paradigms, REST APIs, state management, and modern web frameworks.'),
(4, 'CS402', 'Operating Systems & Concurrency', 1, 4, 'Processes, threads, CPU scheduling, synchronization primitives, memory paging.'),
(5, 'IT501', 'Computer Networks & Distributed Systems', 2, 3, 'TCP/IP stack, routing protocols, flow control, transport layer, and sockets.'),
(6, 'EC301', 'Digital Logic & Microprocessors', 3, 3, 'Combinational and sequential circuits, Boolean algebra, flip-flops, registers.');

-- 4. USERS (Admin, 10 Teachers, 50 Students)
-- Admin User (ID 1)
INSERT INTO users (id, username, email, password_hash, role, full_name, is_active) VALUES
(1, 'admin', 'admin@examora.edu', '${PASSWORD_HASH}', 'admin', 'Dr. Alistair Vance (Administrator)', 1);
`;

// 10 Teachers (IDs 2 - 11)
const teachersData = [
  { name: 'Dr. Arun Sharma', email: 'arun.sharma@examora.edu', username: 'prof_arun', dept: 1, desig: 'Professor', qual: 'Ph.D. in Database Systems' },
  { name: 'Dr. Priya Nair', email: 'priya.nair@examora.edu', username: 'prof_priya', dept: 1, desig: 'Associate Professor', qual: 'Ph.D. in Algorithms' },
  { name: 'Prof. Rajesh Verma', email: 'rajesh.verma@examora.edu', username: 'prof_rajesh', dept: 2, desig: 'Assistant Professor', qual: 'M.Tech in Web Systems' },
  { name: 'Dr. Sneha Gupta', email: 'sneha.gupta@examora.edu', username: 'prof_sneha', dept: 2, desig: 'Associate Professor', qual: 'Ph.D. in Computer Networks' },
  { name: 'Prof. Vikram Singh', email: 'vikram.singh@examora.edu', username: 'prof_vikram', dept: 3, desig: 'Associate Professor', qual: 'Ph.D. in VLSI & Digital Design' },
  { name: 'Dr. Ananya Das', email: 'ananya.das@examora.edu', username: 'prof_ananya', dept: 1, desig: 'Assistant Professor', qual: 'Ph.D. in Operating Systems' },
  { name: 'Prof. Karan Mehta', email: 'karan.mehta@examora.edu', username: 'prof_karan', dept: 2, desig: 'Assistant Professor', qual: 'M.Tech in Cloud Computing' },
  { name: 'Dr. Pooja Reddy', email: 'pooja.reddy@examora.edu', username: 'prof_pooja', dept: 3, desig: 'Assistant Professor', qual: 'Ph.D. in Microelectronics' },
  { name: 'Prof. Rohit Joshi', email: 'rohit.joshi@examora.edu', username: 'prof_rohit', dept: 1, desig: 'Assistant Professor', qual: 'M.Tech in Data Engineering' },
  { name: 'Dr. Meera Iyer', email: 'meera.iyer@examora.edu', username: 'prof_meera', dept: 2, desig: 'Associate Professor', qual: 'Ph.D. in Network Security' }
];

sql += `\n-- Teachers in Users table\nINSERT INTO users (id, username, email, password_hash, role, full_name, is_active) VALUES\n`;
const teacherUserSqls = teachersData.map((t, idx) => {
  const userId = idx + 2;
  return `(${userId}, '${t.username}', '${t.email}', '${PASSWORD_HASH}', 'teacher', '${t.name}', 1)`;
});
sql += teacherUserSqls.join(',\n') + ';\n\n';

sql += `-- Teachers table entries\nINSERT INTO teachers (id, user_id, employee_id, department_id, designation, qualification, phone) VALUES\n`;
const teacherSqls = teachersData.map((t, idx) => {
  const teacherId = idx + 1;
  const userId = idx + 2;
  const empId = `EMP2026${String(teacherId).padStart(3, '0')}`;
  return `(${teacherId}, ${userId}, '${empId}', ${t.dept}, '${t.desig}', '${t.qual}', '+91 98765 432${String(teacherId).padStart(2, '0')}')`;
});
sql += teacherSqls.join(',\n') + ';\n\n';

// 50 Students (IDs 12 - 61)
const studentNames = [
  "Aarav Patel", "Aditi Sharma", "Akash Verma", "Ananya Sen", "Aryan Khan",
  "Bhavya Rao", "Chetan Joshi", "Deepika Roy", "Devendra Singh", "Divya Menon",
  "Eshan Malhotra", "Gaurav Bhatt", "Harini Venkat", "Ishan Mukherjee", "Jaya Pillai",
  "Kavya Nair", "Kunal Kapoor", "Manish Pandey", "Megha Kulkarni", "Mohit Soni",
  "Neha Agarwal", "Nikhil Chopra", "Pallavi Deshmukh", "Pranav Das", "Pooja Hegde",
  "Rahul Bose", "Rhea Sengupta", "Rishabh Tiwari", "Ritu Chauhan", "Rohan Mehta",
  "Sanjana Bhat", "Sanket Kadam", "Siddharth Jain", "Simran Gill", "Snehal Patil",
  "Sparsh Goyal", "Tanvi Desai", "Tarun Reddy", "Trisha Roy", "Utkarsh Srivastava",
  "Vaishnavi Iyer", "Varun Dhawan", "Vidya Balan", "Vikramaditya Roy", "Yash Singhal",
  "Zoya Akhtar", "Abhishek Tiwari", "Chirag Sethi", "Gauri Deshpande", "Hitesh Bansal"
];

sql += `-- 50 Students in Users table\nINSERT INTO users (id, username, email, password_hash, role, full_name, is_active) VALUES\n`;
const studentUserSqls = studentNames.map((name, idx) => {
  const userId = idx + 12;
  const username = `student_${String(idx + 1).padStart(3, '0')}`;
  const email = `${username}@student.examora.edu`;
  return `(${userId}, '${username}', '${email}', '${PASSWORD_HASH}', 'student', '${name}', 1)`;
});
sql += studentUserSqls.join(',\n') + ';\n\n';

sql += `-- Students table entries\nINSERT INTO students (id, user_id, roll_number, department_id, semester_id, admission_year, phone) VALUES\n`;
const studentSqls = studentNames.map((name, idx) => {
  const studentId = idx + 1;
  const userId = idx + 12;
  let deptId = 1;
  let rollPrefix = '24CSE';
  let semId = 1;
  if (idx >= 25 && idx < 40) {
    deptId = 2;
    rollPrefix = '24IT';
    semId = 2;
  } else if (idx >= 40) {
    deptId = 3;
    rollPrefix = '24ECE';
    semId = 3;
  }
  const rollNumber = `${rollPrefix}${String(idx + 1).padStart(3, '0')}`;
  return `(${studentId}, ${userId}, '${rollNumber}', ${deptId}, ${semId}, 2024, '+91 91234 ${String(50000 + idx)}')`;
});
sql += studentSqls.join(',\n') + ';\n\n';

// 5. TEACHER_COURSES
sql += `-- Teacher-Course assignments\nINSERT INTO teacher_courses (id, teacher_id, course_id, semester_id, assigned_date) VALUES
(1, 1, 1, 1, '2026-08-01'), -- Dr. Arun Sharma -> DBMS (CS301)
(2, 2, 2, 1, '2026-08-01'), -- Dr. Priya Nair -> DSA (CS302)
(3, 3, 3, 2, '2026-08-01'), -- Prof. Rajesh Verma -> Web Tech (IT401)
(4, 6, 4, 2, '2026-08-01'), -- Dr. Ananya Das -> OS (CS402)
(5, 4, 5, 3, '2026-08-01'), -- Dr. Sneha Gupta -> Networks (IT501)
(6, 5, 6, 1, '2026-08-01'); -- Prof. Vikram Singh -> Digital Logic (EC301)\n\n`;

// 6. EXAMS
sql += `-- 5 Examinations\nINSERT INTO exams (id, title, description, course_id, semester_id, teacher_id, start_time, end_time, duration_minutes, total_marks, passing_marks, negative_marking_per_question, instructions, status, is_published_results) VALUES
(1, 'CS301 Midterm Examination: Database Systems & Relational Design', 'Comprehensive evaluation of Relational Algebra, SQL, Normalization, ACID Transactions, and B-Tree Indexing.', 1, 1, 1, '2026-10-15 10:00:00', '2026-10-15 12:00:00', 60, 50.00, 20.00, 0.25, '1. Attempt all questions.\\n2. Negative marking applies to objective questions.\\n3. Timer will automatically submit upon expiration.', 'published', 1),
(2, 'CS302 Final Assessment: Data Structures, Trees & Graphs', 'Rigorous testing of Balanced Trees, Graph Traversals (BFS/DFS), Dynamic Programming, and Amortized Time Complexity.', 2, 1, 2, '2026-10-20 14:00:00', '2026-10-20 16:00:00', 60, 50.00, 20.00, 0.25, 'Ensure stable connectivity. Questions once marked for review must be submitted before countdown expires.', 'published', 1),
(3, 'IT401 Comprehensive Examination: Web Technologies, REST & State', 'Covers Client-Server Architectures, HTTP Protocol, JWT Authentication, React Virtual DOM, and Node.js Event Loop.', 3, 2, 3, '2026-11-10 11:00:00', '2026-11-10 13:00:00', 45, 40.00, 16.00, 0.00, 'Answer all questions. Multiple-correct questions require selecting all correct choices for full credit.', 'published', 1),
(4, 'CS402 Mid-Semester Assessment: Operating Systems & Virtual Memory', 'Processes, Scheduling Algorithms, Concurrency Primitives, Semaphores, Deadlock Avoidance, and Demand Paging.', 1, 2, 6, '2026-11-25 10:00:00', '2026-11-25 12:00:00', 60, 50.00, 20.00, 0.50, 'Standard university examination protocols apply. Strict proctoring active.', 'scheduled', 0),
(5, 'IT501 Diagnostic Assessment: Computer Networks & Transport Protocols', 'OSI 7-Layer model, Subnetting, TCP 3-Way Handshake, Flow Control vs Congestion Control, and DNS mechanics.', 5, 3, 4, '2026-10-28 09:30:00', '2026-10-28 11:00:00', 30, 30.00, 12.00, 0.25, 'Speed and accuracy test. No descriptive answers.', 'published', 1);\n\n`;

// 7. QUESTIONS & OPTIONS GENERATOR (Over 100 questions)
// Let's create an array of high-quality DBMS, DSA, Web, OS, Networks, Digital Logic questions
const questionsList = [];

// Questions for Course 1 (DBMS) - 25 questions
const dbmsQuestions = [
  { text: "Which normal form is specifically based on the concept of 'Full Functional Dependency'?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Normalization', exp: '2NF requires relation to be in 1NF and no non-prime attribute should be partially dependent on any candidate key.', opts: [
    { key: 'A', text: 'First Normal Form (1NF)', correct: false },
    { key: 'B', text: 'Second Normal Form (2NF)', correct: true },
    { key: 'C', text: 'Third Normal Form (3NF)', correct: false },
    { key: 'D', text: 'Boyce-Codd Normal Form (BCNF)', correct: false }
  ]},
  { text: "In relational algebra, which fundamental operation produces a Cartesian product followed by a selection condition?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'Relational Algebra', exp: 'Theta Join (or conditional join) is formally defined as selection applied over Cartesian product.', opts: [
    { key: 'A', text: 'Natural Join', correct: false },
    { key: 'B', text: 'Theta Join', correct: true },
    { key: 'C', text: 'Projection', correct: false },
    { key: 'D', text: 'Set Intersection', correct: false }
  ]},
  { text: "Which of the following properties are part of the ACID transactional model? (Select all that apply)", type: 'multiple_choice', marks: 3, neg: 0.5, diff: 'easy', topic: 'Transactions', exp: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.', opts: [
    { key: 'A', text: 'Atomicity', correct: true },
    { key: 'B', text: 'Concurrency', correct: false },
    { key: 'C', text: 'Isolation', correct: true },
    { key: 'D', text: 'Durability', correct: true }
  ]},
  { text: "A B+ Tree stores actual data pointers or rows exclusively in its leaf nodes, while internal nodes store only search keys.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Indexing', exp: 'In a B+ tree, internal nodes store only indexing keys for routing; all actual records/data pointers reside in leaf nodes.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Explain the Lost Update anomaly and how Two-Phase Locking (2PL) prevents it.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Concurrency Control', exp: 'Lost update occurs when two transactions read the same data and simultaneously write, overwriting one update without seeing it.', opts: [] },
  { text: "Which SQL clause is used to filter aggregated group results rather than individual rows?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'SQL Queries', exp: 'HAVING filters aggregated groups formed by GROUP BY.', opts: [
    { key: 'A', text: 'WHERE', correct: false },
    { key: 'B', text: 'HAVING', correct: true },
    { key: 'C', text: 'ORDER BY', correct: false },
    { key: 'D', text: 'FILTER BY', correct: false }
  ]},
  { text: "Which isolation level in ANSI SQL prevents Dirty Read but allows Non-Repeatable Read?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'hard', topic: 'Transactions', exp: 'READ COMMITTED prevents dirty reads by only reading committed data, but subsequent reads within the same transaction may see different values.', opts: [
    { key: 'A', text: 'READ UNCOMMITTED', correct: false },
    { key: 'B', text: 'READ COMMITTED', correct: true },
    { key: 'C', text: 'REPEATABLE READ', correct: false },
    { key: 'D', text: 'SERIALIZABLE', correct: false }
  ]},
  { text: "Which of the following relational operators are considered fundamental / primitive relational algebra operations? (Select all that apply)", type: 'multiple_choice', marks: 3, neg: 0.5, diff: 'medium', topic: 'Relational Algebra', exp: 'Selection, Projection, Cartesian Product, Set Union, and Set Difference are the five fundamental operators.', opts: [
    { key: 'A', text: 'Selection (sigma)', correct: true },
    { key: 'B', text: 'Projection (pi)', correct: true },
    { key: 'C', text: 'Natural Join (bowtie)', correct: false },
    { key: 'D', text: 'Cartesian Product (x)', correct: true }
  ]},
  { text: "A candidate key is a minimal superkey with no redundant attributes.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Relational Model', exp: 'A candidate key is minimal; removing any attribute from it breaks uniqueness.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Describe Boyce-Codd Normal Form (BCNF) and explain why every relation in BCNF is guaranteed to be in 3NF.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Normalization', exp: 'BCNF requires every determinant of a non-trivial FD to be a superkey.', opts: [] },
  { text: "What is the primary difference between Clustered and Non-Clustered index in MySQL InnoDB?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Indexing', exp: 'A clustered index dictates the physical order of table storage and stores table data rows in leaf nodes.', opts: [
    { key: 'A', text: 'Clustered index leaf nodes contain the actual table data rows', correct: true },
    { key: 'B', text: 'A table can have multiple clustered indexes', correct: false },
    { key: 'C', text: 'Non-clustered indexes are stored inside the primary key space', correct: false },
    { key: 'D', text: 'Clustered indexes cannot be defined on primary keys', correct: false }
  ]},
  { text: "Which SQL constraint enforces referential integrity between child and parent tables?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Integrity Constraints', exp: 'FOREIGN KEY constraint guarantees that references match valid candidate keys in the parent relation.', opts: [
    { key: 'A', text: 'CHECK', correct: false },
    { key: 'B', text: 'UNIQUE', correct: false },
    { key: 'C', text: 'FOREIGN KEY', correct: true },
    { key: 'D', text: 'DEFAULT', correct: false }
  ]},
  { text: "Which window functions assign sequential integers without creating gaps when ties occur?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Window Functions', exp: 'DENSE_RANK assigns identical ranks to tied rows without skipping numbers for the next rank.', opts: [
    { key: 'A', text: 'RANK()', correct: false },
    { key: 'B', text: 'DENSE_RANK()', correct: true },
    { key: 'C', text: 'ROW_NUMBER()', correct: false },
    { key: 'D', text: 'NTILE()', correct: false }
  ]},
  { text: "In MySQL, FULL OUTER JOIN is natively supported with a dedicated FULL OUTER JOIN keyword.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Joins', exp: 'False. MySQL does not have a native FULL OUTER JOIN keyword; it is achieved using LEFT JOIN UNION RIGHT JOIN.', opts: [
    { key: 'A', text: 'True', correct: false },
    { key: 'B', text: 'False', correct: true }
  ]},
  { text: "Explain the Write-Ahead Logging (WAL) protocol and how it ensures Durability in relational DBMS.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Crash Recovery', exp: 'WAL mandates that any change log record must be flushed to non-volatile disk before the corresponding dirty data page is written.', opts: [] },
  { text: "Which algorithm is used in DBMS to systematically test for Conflict Serializability of transaction schedules?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'hard', topic: 'Concurrency Control', exp: 'Precedence graph (or serialization graph) cycle detection tests conflict serializability.', opts: [
    { key: 'A', text: 'Wait-for Graph', correct: false },
    { key: 'B', text: 'Precedence Graph', correct: true },
    { key: 'C', text: 'Bankers Algorithm', correct: false },
    { key: 'D', text: 'Dijkstras Algorithm', correct: false }
  ]},
  { text: "What will SELECT NULL = NULL evaluate to in standard SQL logic?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'SQL Semantics', exp: 'In three-valued SQL logic, NULL = NULL evaluates to UNKNOWN / NULL.', opts: [
    { key: 'A', text: 'TRUE (1)', correct: false },
    { key: 'B', text: 'FALSE (0)', correct: false },
    { key: 'C', text: 'NULL / UNKNOWN', correct: true },
    { key: 'D', text: 'Runtime Syntax Error', correct: false }
  ]},
  { text: "Which of the following are valid DDL statements in MySQL? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'DDL', exp: 'ALTER, CREATE, and TRUNCATE are DDL statements; UPDATE is DML.', opts: [
    { key: 'A', text: 'ALTER TABLE', correct: true },
    { key: 'B', text: 'CREATE INDEX', correct: true },
    { key: 'C', text: 'UPDATE', correct: false },
    { key: 'D', text: 'TRUNCATE TABLE', correct: true }
  ]},
  { text: "A surrogate key is an artificial, system-generated identifier with no business semantic meaning.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Data Modeling', exp: 'True. Examples include AUTO_INCREMENT integers or UUIDs.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Discuss the trade-offs between B-Tree indexing and Hash indexing in relational databases.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Indexing', exp: 'Hash indexes offer O(1) point lookups but cannot support range scans or ordering. B-Trees offer O(log N) point and range lookups.', opts: [] },
  { text: "What does the SQL set operator EXCEPT (or MINUS) compute?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Set Operations', exp: 'EXCEPT returns tuples that appear in the first query result but not in the second query result.', opts: [
    { key: 'A', text: 'Tuples common to both queries', correct: false },
    { key: 'B', text: 'Tuples in the first query that do not exist in the second', correct: true },
    { key: 'C', text: 'All distinct tuples from both queries', correct: false },
    { key: 'D', text: 'Cartesian product minus duplicates', correct: false }
  ]},
  { text: "Which lock type allows multiple transactions to concurrently read the same database record?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Concurrency Control', exp: 'Shared (S) locks are shared among readers. Exclusive (X) locks are required for writes.', opts: [
    { key: 'A', text: 'Exclusive Lock (X)', correct: false },
    { key: 'B', text: 'Shared Lock (S)', correct: true },
    { key: 'C', text: 'Intent Exclusive Lock (IX)', correct: false },
    { key: 'D', text: 'Deadlock Lock', correct: false }
  ]},
  { text: "Correlated subqueries are evaluated once for the outer query as a whole, rather than for each row.", type: 'true_false', marks: 1, neg: 0.25, diff: 'medium', topic: 'Subqueries', exp: 'False. A correlated subquery references columns from the outer query row and is evaluated repeatedly for each candidate row.', opts: [
    { key: 'A', text: 'True', correct: false },
    { key: 'B', text: 'False', correct: true }
  ]},
  { text: "Which MySQL clause explicitly enables query execution plan analysis showing operational tree structures?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'Optimization', exp: 'EXPLAIN or EXPLAIN ANALYZE reveals query execution plans.', opts: [
    { key: 'A', text: 'ANALYZE TABLE', correct: false },
    { key: 'B', text: 'EXPLAIN', correct: true },
    { key: 'C', text: 'SHOW STATUS', correct: false },
    { key: 'D', text: 'DESCRIBE PLAN', correct: false }
  ]},
  { text: "Write the SQL query to calculate the second highest salary using subqueries or window functions.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'SQL Queries', exp: 'Can be achieved using DENSE_RANK() OVER (ORDER BY salary DESC) WHERE r = 2, or nested subquery with MAX().', opts: [] }
];

// Questions for Course 2 (DSA) - 20 questions
const dsaQuestions = [
  { text: "What is the worst-case time complexity of standard QuickSort with poor pivot selection?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'Sorting', exp: 'When pivot is always minimum or maximum, QuickSort degrades to O(N^2).', opts: [
    { key: 'A', text: 'O(N log N)', correct: false },
    { key: 'B', text: 'O(N)', correct: false },
    { key: 'C', text: 'O(N^2)', correct: true },
    { key: 'D', text: 'O(log N)', correct: false }
  ]},
  { text: "Which of the following data structures inherently maintain the FIFO (First-In First-Out) principle?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Queues', exp: 'Queue maintains FIFO.', opts: [
    { key: 'A', text: 'Stack', correct: false },
    { key: 'B', text: 'Queue', correct: true },
    { key: 'C', text: 'Max Heap', correct: false },
    { key: 'D', text: 'Binary Search Tree', correct: false }
  ]},
  { text: "Which algorithms can be utilized to find the Minimum Spanning Tree (MST) of a weighted connected graph? (Select all that apply)", type: 'multiple_choice', marks: 3, neg: 0.5, diff: 'medium', topic: 'Graphs', exp: 'Kruskal and Prim compute MSTs. Dijkstra finds single-source shortest paths.', opts: [
    { key: 'A', text: 'Kruskals Algorithm', correct: true },
    { key: 'B', text: 'Prims Algorithm', correct: true },
    { key: 'C', text: 'Dijkstras Algorithm', correct: false },
    { key: 'D', text: 'Boruvkas Algorithm', correct: true }
  ]},
  { text: "In an AVL tree, the balance factor of every node is constrained to lie within {-1, 0, +1}.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Trees', exp: 'True. AVL tree maintains height balance where |height(L) - height(R)| <= 1.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Differentiate between Breadth-First Search (BFS) and Depth-First Search (DFS) with respect to space complexity and data structure used.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Graphs', exp: 'BFS uses a Queue and takes O(V) space. DFS uses a Stack/recursion and takes O(height) space.', opts: [] },
  { text: "What is the average time complexity to search an element in a Hash Table with good uniform hashing?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Hashing', exp: 'Uniform hashing achieves O(1) expected lookup.', opts: [
    { key: 'A', text: 'O(1)', correct: true },
    { key: 'B', text: 'O(log N)', correct: false },
    { key: 'C', text: 'O(N)', correct: false },
    { key: 'D', text: 'O(N log N)', correct: false }
  ]},
  { text: "Which self-balancing binary search tree uses color properties (Red/Black) to ensure the longest path is at most twice the shortest path?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Trees', exp: 'Red-Black Tree guarantees this structural invariant.', opts: [
    { key: 'A', text: 'AVL Tree', correct: false },
    { key: 'B', text: 'Red-Black Tree', correct: true },
    { key: 'C', text: 'Splay Tree', correct: false },
    { key: 'D', text: 'B-Tree', correct: false }
  ]},
  { text: "Which of the following sorting algorithms are stable by design? (Select all that apply)", type: 'multiple_choice', marks: 3, neg: 0.5, diff: 'medium', topic: 'Sorting', exp: 'MergeSort and InsertionSort preserve equal key order. Standard QuickSort and HeapSort do not.', opts: [
    { key: 'A', text: 'Merge Sort', correct: true },
    { key: 'B', text: 'Insertion Sort', correct: true },
    { key: 'C', text: 'Heap Sort', correct: false },
    { key: 'D', text: 'Selection Sort', correct: false }
  ]},
  { text: "A complete binary tree with N nodes always has a height of floor(log2(N)).", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Trees', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Explain how Dynamic Programming differs from the Divide and Conquer strategy using the Fibonacci sequence or 0/1 Knapsack problem.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Algorithms', exp: 'DP is applied when subproblems overlap and have optimal substructure, memorizing intermediate states.', opts: [] },
  { text: "What is the amortized cost of inserting an element into a dynamic array (like C++ vector or Java ArrayList)?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Amortized Analysis', exp: 'Doubling capacity when full yields O(1) amortized insertion.', opts: [
    { key: 'A', text: 'O(1)', correct: true },
    { key: 'B', text: 'O(N)', correct: false },
    { key: 'C', text: 'O(log N)', correct: false },
    { key: 'D', text: 'O(N^2)', correct: false }
  ]},
  { text: "Which data structure is optimal for implementing a Priority Queue?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Heaps', exp: 'Binary Heap provides O(log N) insertions and O(1) peek.', opts: [
    { key: 'A', text: 'Binary Heap', correct: true },
    { key: 'B', text: 'Singly Linked List', correct: false },
    { key: 'C', text: 'Circular Queue', correct: false },
    { key: 'D', text: 'Hash Map', correct: false }
  ]},
  { text: "Bellman-Ford algorithm can detect negative weight cycles in a directed graph.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Graphs', exp: 'True. A further relaxation iteration after V-1 steps signals a negative cycle.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "What is the space complexity of an adjacency matrix representation of a graph with V vertices?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Graphs', exp: 'A V x V matrix requires O(V^2) space.', opts: [
    { key: 'A', text: 'O(V + E)', correct: false },
    { key: 'B', text: 'O(V^2)', correct: true },
    { key: 'C', text: 'O(E^2)', correct: false },
    { key: 'D', text: 'O(V log V)', correct: false }
  ]},
  { text: "Explain Topological Sorting on Directed Acyclic Graphs (DAG) and mention two real-world use cases.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Graphs', exp: 'Topological sort orders vertices linearly such that for every directed edge u -> v, u comes before v (used in build dependencies, task scheduling).', opts: [] },
  { text: "Which collision resolution technique stores all elements colliding at the same hash index in a linked list?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Hashing', exp: 'Separate Chaining chains elements in a linked bucket.', opts: [
    { key: 'A', text: 'Linear Probing', correct: false },
    { key: 'B', text: 'Quadratic Probing', correct: false },
    { key: 'C', text: 'Separate Chaining', correct: true },
    { key: 'D', text: 'Double Hashing', correct: false }
  ]},
  { text: "Floyd-Warshall algorithm computes all-pairs shortest paths in O(V^3) time complexity.", type: 'true_false', marks: 1, neg: 0.25, diff: 'medium', topic: 'Dynamic Programming', exp: 'True. Uses 3 nested loops over intermediate vertices.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Which tree traversal of a valid Binary Search Tree (BST) produces keys in ascending sorted order?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Trees', exp: 'Inorder traversal (Left, Root, Right) traverses BST keys in non-decreasing order.', opts: [
    { key: 'A', text: 'Preorder', correct: false },
    { key: 'B', text: 'Inorder', correct: true },
    { key: 'C', text: 'Postorder', correct: false },
    { key: 'D', text: 'Level Order', correct: false }
  ]},
  { text: "Which of the following statements about Trie data structures are accurate? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Advanced Data Structures', exp: 'Tries enable prefix search in O(M) time where M is string length, and share common prefixes.', opts: [
    { key: 'A', text: 'Key lookup time is independent of the number of keys stored', correct: true },
    { key: 'B', text: 'Common prefixes are stored only once along paths', correct: true },
    { key: 'C', text: 'Worst case lookup is O(N^2) where N is dictionary size', correct: false },
    { key: 'D', text: 'Useful for autocomplete and spell checking', correct: true }
  ]},
  { text: "Describe Disjoint Set Union (DSU / Union-Find) with Path Compression and Union by Rank optimizations.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Advanced Data Structures', exp: 'DSU supports find and union in nearly O(1) amortized time (inverse Ackermann function).', opts: [] }
];

// Questions for Course 3 (Web Tech) - 20 questions
const webQuestions = [
  { text: "Which HTTP request method is designed to be idempotent according to RFC 7231? (Select all that apply)", type: 'multiple_choice', marks: 3, neg: 0.5, diff: 'medium', topic: 'HTTP Protocol', exp: 'GET, PUT, and DELETE are idempotent; multiple identical requests have same side effects. POST is not idempotent.', opts: [
    { key: 'A', text: 'GET', correct: true },
    { key: 'B', text: 'POST', correct: false },
    { key: 'C', text: 'PUT', correct: true },
    { key: 'D', text: 'DELETE', correct: true }
  ]},
  { text: "What is the primary role of the React Virtual DOM?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'React Architecture', exp: 'It maintains an in-memory representation to compute minimum DOM reconciliation diffs before updating the real DOM.', opts: [
    { key: 'A', text: 'Directly replace the browser DOM completely on every keystroke', correct: false },
    { key: 'B', text: 'Batch and compute minimum efficient real DOM updates via diffing', correct: true },
    { key: 'C', text: 'Provide hardware acceleration for CSS animations', correct: false },
    { key: 'D', text: 'Store session data on the client device', correct: false }
  ]},
  { text: "In JSON Web Tokens (JWT), which part is digitally signed using a secret or private key?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Authentication & Security', exp: 'The signature is calculated over Base64UrlEncoded(Header) + \".\" + Base64UrlEncoded(Payload).', opts: [
    { key: 'A', text: 'The payload alone', correct: false },
    { key: 'B', text: 'Header concatenated with Payload', correct: true },
    { key: 'C', text: 'The secret key itself', correct: false },
    { key: 'D', text: 'Only the expiration timestamp claim', correct: false }
  ]},
  { text: "Cross-Origin Resource Sharing (CORS) is a security mechanism enforced by the backend server, not the client browser.", type: 'true_false', marks: 1, neg: 0.25, diff: 'medium', topic: 'Web Security', exp: 'False. CORS headers are returned by servers, but CORS enforcement is strictly carried out by the user web browser.', opts: [
    { key: 'A', text: 'True', correct: false },
    { key: 'B', text: 'False', correct: true }
  ]},
  { text: "Explain the Node.js Event Loop phases and how asynchronous I/O operations are handled under the hood.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Node.js Internals', exp: 'Timers, pending callbacks, idle/prepare, poll, check (setImmediate), and close callbacks managed by libuv.', opts: [] },
  { text: "Which HTTP status code signifies that the server successfully fulfilled the request and returned no content body?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'REST Standards', exp: '204 No Content is standard for successful deletions or mutations without response body.', opts: [
    { key: 'A', text: '200 OK', correct: false },
    { key: 'B', text: '201 Created', correct: false },
    { key: 'C', text: '204 No Content', correct: true },
    { key: 'D', text: '304 Not Modified', correct: false }
  ]},
  { text: "Which React Hook is primarily used for managing side-effects like fetching data, timers, and manual DOM subscriptions?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'React Hooks', exp: 'useEffect runs side-effects synchronized with state dependencies.', opts: [
    { key: 'A', text: 'useState', correct: false },
    { key: 'B', text: 'useMemo', correct: false },
    { key: 'C', text: 'useEffect', correct: true },
    { key: 'D', text: 'useRef', correct: false }
  ]},
  { text: "LocalStorage and SessionStorage data is automatically transmitted to the server with every HTTP request header.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Client Storage', exp: 'False. Cookies are sent with HTTP headers; LocalStorage and SessionStorage reside purely on the client.', opts: [
    { key: 'A', text: 'True', correct: false },
    { key: 'B', text: 'False', correct: true }
  ]},
  { text: "Which of the following headers are essential for mitigating Cross-Site Scripting (XSS) and Clickjacking? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Security', exp: 'Content-Security-Policy and X-Frame-Options protect against XSS and clickjacking.', opts: [
    { key: 'A', text: 'Content-Security-Policy', correct: true },
    { key: 'B', text: 'X-Frame-Options', correct: true },
    { key: 'C', text: 'Access-Control-Allow-Origin', correct: false },
    { key: 'D', text: 'X-Content-Type-Options', correct: true }
  ]},
  { text: "Describe the differences between Server-Side Rendering (SSR) and Client-Side Rendering (CSR) with regards to SEO and initial load latency.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Architecture', exp: 'SSR delivers pre-rendered HTML for fast First Contentful Paint and search indexability; CSR ships JS bundle and renders in client browser.', opts: [] },
  { text: "What is the purpose of the HTTP header 'Cache-Control: no-cache'?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Caching', exp: 'no-cache forces caches to submit the request to the origin server for validation before releasing a cached copy.', opts: [
    { key: 'A', text: 'The response must never be stored anywhere on disk or memory', correct: false },
    { key: 'B', text: 'The cached response must be revalidated with the origin server before reuse', correct: true },
    { key: 'C', text: 'Only intermediate proxies may cache the response', correct: false },
    { key: 'D', text: 'The browser must delete cookies upon receipt', correct: false }
  ]},
  { text: "In Tailwind CSS, which utility class is used to center elements with Flexbox along both axes?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Styling', exp: 'flex items-center justify-center centers along both axes.', opts: [
    { key: 'A', text: 'flex align-middle justify-between', correct: false },
    { key: 'B', text: 'flex items-center justify-center', correct: true },
    { key: 'C', text: 'flex center-content', correct: false },
    { key: 'D', text: 'grid place-none', correct: false }
  ]},
  { text: "A WebSocket connection starts as a standard HTTP/1.1 request that is upgraded via the 101 Switching Protocols status code.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'WebSockets', exp: 'True. The HTTP Upgrade header initiates the duplex WebSocket protocol handshake.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Which middleware function in Express.js is standard for parsing incoming JSON request payloads?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Express.js', exp: 'express.json() parses incoming JSON requests.', opts: [
    { key: 'A', text: 'express.urlencoded()', correct: false },
    { key: 'B', text: 'express.json()', correct: true },
    { key: 'C', text: 'express.static()', correct: false },
    { key: 'D', text: 'express.router()', correct: false }
  ]},
  { text: "Explain SQL Injection vulnerabilities in backend APIs and how parameterized queries prevent them completely.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Security', exp: 'SQL injection occurs when unescaped user input is concatenated into query strings. Prepared statements separate SQL code structure from data parameters.', opts: [] },
  { text: "What is the primary difference between cookie attributes 'HttpOnly' and 'Secure'?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Security', exp: 'HttpOnly prevents client-side JavaScript access (document.cookie); Secure ensures cookies are sent only over HTTPS.', opts: [
    { key: 'A', text: 'HttpOnly blocks JavaScript access; Secure requires HTTPS transmission', correct: true },
    { key: 'B', text: 'Secure blocks JavaScript access; HttpOnly requires HTTPS transmission', correct: false },
    { key: 'C', text: 'Both attributes have identical effects across browsers', correct: false },
    { key: 'D', text: 'HttpOnly encrypts the cookie body with AES', correct: false }
  ]},
  { text: "In React, component re-renders are triggered whenever either props or state change.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'React Architecture', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Which CSS layout model provides 2-dimensional grid-based alignment of rows and columns simultaneously?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'CSS', exp: 'CSS Grid is 2-dimensional, whereas Flexbox is 1-dimensional.', opts: [
    { key: 'A', text: 'Flexbox', correct: false },
    { key: 'B', text: 'CSS Grid', correct: true },
    { key: 'C', text: 'Float layout', correct: false },
    { key: 'D', text: 'Position absolute', correct: false }
  ]},
  { text: "Which HTTP status codes indicate client-side errors? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'REST Standards', exp: '400 Bad Request, 401 Unauthorized, and 404 Not Found are 4xx client errors.', opts: [
    { key: 'A', text: '400 Bad Request', correct: true },
    { key: 'B', text: '401 Unauthorized', correct: true },
    { key: 'C', text: '500 Internal Server Error', correct: false },
    { key: 'D', text: '404 Not Found', correct: true }
  ]},
  { text: "Describe optimistic UI updates in modern single page web applications and how error rollbacks are handled.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'UX Architecture', exp: 'The client updates UI state instantly before the server response arrives, reverting to previous state if the mutation API rejects.', opts: [] }
];

// Questions for Course 4 (OS) - 15 questions
const osQuestions = [
  { text: "Which condition is NOT one of the four Coffman conditions necessary for a deadlock to occur?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'Deadlocks', exp: 'Preemption breaks deadlock. The 4 conditions are Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.', opts: [
    { key: 'A', text: 'Mutual Exclusion', correct: false },
    { key: 'B', text: 'Hold and Wait', correct: false },
    { key: 'C', text: 'Voluntary Preemption', correct: true },
    { key: 'D', text: 'Circular Wait', correct: false }
  ]},
  { text: "What is the phenomenon where allocating more physical memory page frames increases the number of page faults under FIFO replacement?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Virtual Memory', exp: 'Beladys Anomaly occurs in FIFO page replacement.', opts: [
    { key: 'A', text: 'Thrashing', correct: false },
    { key: 'B', text: 'Beladys Anomaly', correct: true },
    { key: 'C', text: 'Convoy Effect', correct: false },
    { key: 'D', text: 'External Fragmentation', correct: false }
  ]},
  { text: "Which of the following CPU scheduling algorithms are preemptive? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'CPU Scheduling', exp: 'Round Robin and Shortest Remaining Time First (SRTF) are preemptive.', opts: [
    { key: 'A', text: 'Round Robin', correct: true },
    { key: 'B', text: 'Shortest Remaining Time First (SRTF)', correct: true },
    { key: 'C', text: 'First-Come First-Served (FCFS)', correct: false },
    { key: 'D', text: 'Non-preemptive Priority', correct: false }
  ]},
  { text: "Threads belonging to the same parent process share the same code section, data section, and heap memory, but possess independent stacks and program counters.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Processes & Threads', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Explain the Critical Section Problem and describe the three requirements that any valid solution must satisfy.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Synchronization', exp: 'Mutual Exclusion, Progress, and Bounded Waiting.', opts: [] },
  { text: "Which memory management hardware unit translates virtual logical addresses into physical RAM addresses?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Memory Management', exp: 'MMU (Memory Management Unit) handles virtual-to-physical translation.', opts: [
    { key: 'A', text: 'ALU', correct: false },
    { key: 'B', text: 'MMU', correct: true },
    { key: 'C', text: 'DMA Controller', correct: false },
    { key: 'D', text: 'TLB alone', correct: false }
  ]},
  { text: "What is thrashing in operating systems?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'Virtual Memory', exp: 'Thrashing occurs when a process spends more time paging in and out than executing real CPU work.', opts: [
    { key: 'A', text: 'High CPU utilization with no I/O', correct: false },
    { key: 'B', text: 'Excessive paging activity where CPU spends most time swapping pages', correct: true },
    { key: 'C', text: 'Recursive deadlocks in multi-threaded processes', correct: false },
    { key: 'D', text: 'Fragmentation in contiguous memory allocation', correct: false }
  ]},
  { text: "Semaphores with initial value 1 are functionally equivalent to binary mutexes.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Synchronization', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Which system call is used in Unix-like operating systems to duplicate an existing process?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'System Calls', exp: 'fork() clones the calling process.', opts: [
    { key: 'A', text: 'exec()', correct: false },
    { key: 'B', text: 'fork()', correct: true },
    { key: 'C', text: 'clone()', correct: false },
    { key: 'D', text: 'pipe()', correct: false }
  ]},
  { text: "Explain Bankers Algorithm for deadlock avoidance and describe how safe states are verified.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Deadlocks', exp: 'Simulates allocation against Max, Available, and Need matrices to guarantee existence of a safe execution sequence.', opts: [] },
  { text: "Translation Lookaside Buffer (TLB) acts as a high-speed hardware cache for page table lookups.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Virtual Memory', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Which page replacement algorithm achieves theoretically optimal lowest page fault rate?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Virtual Memory', exp: 'Beladys Optimal Page Replacement replaces the page that will not be used for the longest period in the future.', opts: [
    { key: 'A', text: 'Least Recently Used (LRU)', correct: false },
    { key: 'B', text: 'Optimal Page Replacement (OPT)', correct: true },
    { key: 'C', text: 'First In First Out (FIFO)', correct: false },
    { key: 'D', text: 'Clock Algorithm', correct: false }
  ]},
  { text: "Which file allocation methods permit direct random access to arbitrary file blocks? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'File Systems', exp: 'Contiguous and Indexed allocation allow direct random access. Pure linked allocation requires sequential traversal.', opts: [
    { key: 'A', text: 'Contiguous Allocation', correct: true },
    { key: 'B', text: 'Linked Allocation without FAT', correct: false },
    { key: 'C', text: 'Indexed Allocation', correct: true },
    { key: 'D', text: 'Multi-level Inode Allocation', correct: true }
  ]},
  { text: "Direct Memory Access (DMA) allows I/O devices to transfer data directly to RAM without continuous CPU intervention.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Hardware & I/O', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Describe Inverted Page Tables and explain their advantages regarding memory footprint over multi-level hierarchical paging.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Virtual Memory', exp: 'Inverted page table has one entry per physical frame rather than per virtual page, drastically reducing page table memory footprint.', opts: [] }
];

// Questions for Course 5 (Networks) - 12 questions
const netQuestions = [
  { text: "At which layer of the OSI model does the Transmission Control Protocol (TCP) operate?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'OSI Model', exp: 'TCP operates at Layer 4 - Transport Layer.', opts: [
    { key: 'A', text: 'Network Layer', correct: false },
    { key: 'B', text: 'Transport Layer', correct: true },
    { key: 'C', text: 'Data Link Layer', correct: false },
    { key: 'D', text: 'Application Layer', correct: false }
  ]},
  { text: "Which flags are exchanged during the standard TCP 3-Way Handshake connection establishment?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'TCP Protocol', exp: 'SYN -> SYN-ACK -> ACK.', opts: [
    { key: 'A', text: 'SYN, SYN-ACK, ACK', correct: true },
    { key: 'B', text: 'INIT, ACK, FIN', correct: false },
    { key: 'C', text: 'HELLO, HELLO-ACK, READY', correct: false },
    { key: 'D', text: 'ACK, SYN, ACK-ACK', correct: false }
  ]},
  { text: "What is the maximum number of usable host addresses in an IPv4 subnet with prefix /26?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Subnetting', exp: '32 - 26 = 6 host bits. 2^6 - 2 (network & broadcast) = 62 usable host addresses.', opts: [
    { key: 'A', text: '64', correct: false },
    { key: 'B', text: '62', correct: true },
    { key: 'C', text: '30', correct: false },
    { key: 'D', text: '126', correct: false }
  ]},
  { text: "User Datagram Protocol (UDP) is a connection-oriented protocol that guarantees delivery order and retransmission.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Transport Layer', exp: 'False. UDP is connectionless and best-effort with no delivery guarantees.', opts: [
    { key: 'A', text: 'True', correct: false },
    { key: 'B', text: 'False', correct: true }
  ]},
  { text: "Explain the difference between Flow Control and Congestion Control in TCP mechanics.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'TCP Mechanics', exp: 'Flow control protects the receiving host from buffer overflow (Receiver Window). Congestion control protects network routers from overload (Congestion Window).', opts: [] },
  { text: "Which protocol maps a known logical IP address to a physical hardware MAC address on a local area network?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Network Layer', exp: 'ARP (Address Resolution Protocol).', opts: [
    { key: 'A', text: 'DNS', correct: false },
    { key: 'B', text: 'DHCP', correct: false },
    { key: 'C', text: 'ARP', correct: true },
    { key: 'D', text: 'ICMP', correct: false }
  ]},
  { text: "Which of the following routing protocols utilize Dijkstra's Link-State algorithm? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Routing', exp: 'OSPF and IS-IS use Dijkstra Link-State algorithms. RIP uses Bellman-Ford Distance Vector.', opts: [
    { key: 'A', text: 'OSPF (Open Shortest Path First)', correct: true },
    { key: 'B', text: 'IS-IS', correct: true },
    { key: 'C', text: 'RIP (Routing Information Protocol)', correct: false },
    { key: 'D', text: 'BGP', correct: false }
  ]},
  { text: "DNS operates predominantly over UDP port 53 for standard queries to achieve low latency.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Application Layer', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "What is the standard size of an IPv6 address in bits?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Addressing', exp: 'IPv6 addresses are 128 bits (16 bytes) long.', opts: [
    { key: 'A', text: '32 bits', correct: false },
    { key: 'B', text: '64 bits', correct: false },
    { key: 'C', text: '128 bits', correct: true },
    { key: 'D', text: '256 bits', correct: false }
  ]},
  { text: "Explain the TCP Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery phases.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'hard', topic: 'Congestion Control', exp: 'Detailed TCP Tahoe/Reno congestion control window progression.', opts: [] },
  { text: "Which protocol is responsible for transmitting error reporting and diagnostic packets (such as Destination Unreachable)?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Network Layer', exp: 'ICMP (Internet Control Message Protocol).', opts: [
    { key: 'A', text: 'IGMP', correct: false },
    { key: 'B', text: 'ICMP', correct: true },
    { key: 'C', text: 'SNMP', correct: false },
    { key: 'D', text: 'SMTP', correct: false }
  ]},
  { text: "HTTPS encrypts the underlying transport communication using Transport Layer Security (TLS).", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Security', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]}
];

// Questions for Course 6 (Digital Logic) - 10 questions
const ecQuestions = [
  { text: "According to De Morgan's Laws, what is the boolean dual of (A . B)'?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Boolean Algebra', exp: '(A . B)\' = A\' + B\'.', opts: [
    { key: 'A', text: 'A\' + B\'', correct: true },
    { key: 'B', text: 'A\' . B\'', correct: false },
    { key: 'C', text: '(A + B)\'', correct: false },
    { key: 'D', text: 'A . B', correct: false }
  ]},
  { text: "Which universal logic gates can implement any arbitrary Boolean function independently? (Select all that apply)", type: 'multiple_choice', marks: 2, neg: 0.5, diff: 'easy', topic: 'Logic Gates', exp: 'NAND and NOR gates are universal gates.', opts: [
    { key: 'A', text: 'NAND Gate', correct: true },
    { key: 'B', text: 'NOR Gate', correct: true },
    { key: 'C', text: 'AND Gate', correct: false },
    { key: 'D', text: 'XOR Gate', correct: false }
  ]},
  { text: "How many selection control lines are required for an 8-to-1 Multiplexer (MUX)?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Combinational Circuits', exp: '2^k = 8 -> k = 3 selection lines.', opts: [
    { key: 'A', text: '2', correct: false },
    { key: 'B', text: '3', correct: true },
    { key: 'C', text: '4', correct: false },
    { key: 'D', text: '8', correct: false }
  ]},
  { text: "A D flip-flop transfers the logic value present at its D input to output Q on the active clock edge.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Sequential Circuits', exp: 'True. D flip-flop functions as a data delay latch.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Explain race-around condition in JK flip-flops and how Master-Slave configuration resolves it.", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Sequential Circuits', exp: 'Occurs when J=K=1, clock pulse duration tp > propagation delay delta-t. Resolved by Master-Slave or edge triggering.', opts: [] },
  { text: "What is the 2's complement representation of binary number 101100?", type: 'single_choice', marks: 2, neg: 0.5, diff: 'medium', topic: 'Binary Arithmetic', exp: '1\'s complement is 010011 + 1 = 010100.', opts: [
    { key: 'A', text: '010100', correct: true },
    { key: 'B', text: '010011', correct: false },
    { key: 'C', text: '101101', correct: false },
    { key: 'D', text: '110011', correct: false }
  ]},
  { text: "A Karnaugh Map (K-Map) arranges adjacent cells using Gray code sequence to guarantee single bit differences.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'K-Maps', exp: 'True. Gray coding ensures only one literal toggles between adjacent minterm cells.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Which circuit component adds two single-bit binary inputs without accommodating an input carry bit?", type: 'single_choice', marks: 1, neg: 0.25, diff: 'easy', topic: 'Combinational Circuits', exp: 'Half Adder adds A and B producing Sum and Carry.', opts: [
    { key: 'A', text: 'Half Adder', correct: true },
    { key: 'B', text: 'Full Adder', correct: false },
    { key: 'C', text: 'Ripple Carry Adder', correct: false },
    { key: 'D', text: 'Subtractor', correct: false }
  ]},
  { text: "Synchronous counters trigger all flip-flops simultaneously using a common shared clock pulse.", type: 'true_false', marks: 1, neg: 0.25, diff: 'easy', topic: 'Counters', exp: 'True.', opts: [
    { key: 'A', text: 'True', correct: true },
    { key: 'B', text: 'False', correct: false }
  ]},
  { text: "Describe the operational difference between Mealy and Moore finite state machines (FSM).", type: 'descriptive', marks: 5, neg: 0.0, diff: 'medium', topic: 'Sequential Logic', exp: 'Moore machine outputs depend solely on the current state. Mealy machine outputs depend on both current state and current inputs.', opts: [] }
];

// Combine all questions
const coursesMap = [
  { courseId: 1, teacherId: 1, questions: dbmsQuestions },
  { courseId: 2, teacherId: 2, questions: dsaQuestions },
  { courseId: 3, teacherId: 3, questions: webQuestions },
  { courseId: 4, teacherId: 6, questions: osQuestions },
  { courseId: 5, teacherId: 4, questions: netQuestions },
  { courseId: 6, teacherId: 5, questions: ecQuestions }
];

let globalQuestionId = 1;
let globalOptionId = 1;

const allQuestionsRows = [];
const allOptionsRows = [];

coursesMap.forEach(cm => {
  cm.questions.forEach(q => {
    const qId = globalQuestionId++;
    allQuestionsRows.push({
      id: qId,
      course_id: cm.courseId,
      teacher_id: cm.teacherId,
      text: q.text.replace(/'/g, "''"),
      type: q.type,
      marks: q.marks,
      neg: q.neg,
      diff: q.diff,
      topic: q.topic,
      exp: q.exp.replace(/'/g, "''")
    });

    q.opts.forEach(opt => {
      allOptionsRows.push({
        id: globalOptionId++,
        question_id: qId,
        key: opt.key,
        text: opt.text.replace(/'/g, "''"),
        is_correct: opt.correct ? 1 : 0
      });
    });
  });
});

sql += `-- ${allQuestionsRows.length} Questions in Question Bank\nINSERT INTO questions (id, course_id, created_by_teacher_id, question_text, question_type, marks, negative_marks, difficulty, topic, explanation) VALUES\n`;
sql += allQuestionsRows.map(q => 
  `(${q.id}, ${q.course_id}, ${q.teacher_id}, '${q.text}', '${q.type}', ${q.marks.toFixed(2)}, ${q.neg.toFixed(2)}, '${q.diff}', '${q.topic}', '${q.exp}')`
).join(',\n') + ';\n\n';

sql += `-- ${allOptionsRows.length} Options for Objective Questions\nINSERT INTO question_options (id, question_id, option_key, option_text, is_correct) VALUES\n`;
sql += allOptionsRows.map(o => 
  `(${o.id}, ${o.question_id}, '${o.key}', '${o.text}', ${o.is_correct})`
).join(',\n') + ';\n\n';

// 8. EXAM_QUESTIONS MAPPINGS
// Exam 1 (DBMS) -> Questions 1 - 25
// Exam 2 (DSA) -> Questions 26 - 45
// Exam 3 (Web Tech) -> Questions 46 - 65
// Exam 4 (OS) -> Questions 66 - 80
// Exam 5 (Networks) -> Questions 81 - 92
const examQuestionsRows = [];
let eqId = 1;

for (let q = 1; q <= 25; q++) {
  examQuestionsRows.push(`(${eqId++}, 1, ${q}, ${q})`);
}
for (let q = 26; q <= 45; q++) {
  examQuestionsRows.push(`(${eqId++}, 2, ${q}, ${q - 25})`);
}
for (let q = 46; q <= 65; q++) {
  examQuestionsRows.push(`(${eqId++}, 3, ${q}, ${q - 45})`);
}
for (let q = 66; q <= 80; q++) {
  examQuestionsRows.push(`(${eqId++}, 4, ${q}, ${q - 65})`);
}
for (let q = 81; q <= 92; q++) {
  examQuestionsRows.push(`(${eqId++}, 5, ${q}, ${q - 80})`);
}

sql += `-- Exam Questions Mappings\nINSERT INTO exam_questions (id, exam_id, question_id, question_order) VALUES\n`;
sql += examQuestionsRows.join(',\n') + ';\n\n';

// 9. REGISTRATIONS
// Register CSE students (1-25) for Exam 1 and 2
// Register IT students (26-40) for Exam 3 and 5
// Register ECE students (41-50) for Exam 1, 2, 3
const regRows = [];
let regId = 1;

for (let s = 1; s <= 25; s++) {
  regRows.push(`(${regId++}, 1, ${s}, 'approved')`);
  regRows.push(`(${regId++}, 2, ${s}, 'approved')`);
}
for (let s = 26; s <= 40; s++) {
  regRows.push(`(${regId++}, 3, ${s}, 'approved')`);
  regRows.push(`(${regId++}, 5, ${s}, 'approved')`);
}
for (let s = 41; s <= 50; s++) {
  regRows.push(`(${regId++}, 1, ${s}, 'approved')`);
  regRows.push(`(${regId++}, 4, ${s}, 'approved')`);
}

sql += `-- Student Registrations\nINSERT INTO registrations (id, exam_id, student_id, status) VALUES\n`;
sql += regRows.join(',\n') + ';\n\n';

// 10. ATTEMPTS & RESULTS GENERATION
// Generate realistic attempts for Exam 1 (DBMS - 30 students attempted)
// and Exam 2 (DSA - 25 students attempted)
// and Exam 3 (Web Tech - 15 students attempted)
// and Exam 5 (Networks - 15 students attempted)
const attemptRows = [];
const answerRows = [];
const resultRows = [];

let attemptIdCounter = 1;
let answerIdCounter = 1;
let resultIdCounter = 1;

// Function to generate attempts for an exam
function generateExamAttempts(examId, studentIds, totalQuestions, maxMarks, passMarks, isPublished = true) {
  const scores = [];

  studentIds.forEach((sId, index) => {
    const aId = attemptIdCounter++;
    // Create diverse realistic performance
    let performanceRatio = 0.4 + (index % 7) * 0.09; // between 40% and 94%
    if (index === 3 || index === 11) performanceRatio = 0.28; // fail cases for realism
    if (index === 0 || index === 8) performanceRatio = 0.95; // toppers

    const obtained = Math.min(maxMarks, Math.round(maxMarks * performanceRatio * 2) / 2);
    const percentage = Math.round((obtained / maxMarks) * 10000) / 100;
    const isPassed = obtained >= passMarks ? 1 : 0;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const attemptedQ = Math.round(totalQuestions * (0.7 + (performanceRatio * 0.3)));
    const correctQ = Math.round(attemptedQ * (performanceRatio + 0.05));
    const incorrectQ = Math.max(0, attemptedQ - correctQ);
    const unattemptedQ = Math.max(0, totalQuestions - attemptedQ);

    const startMinute = (index * 2) % 40;
    const durationMins = 35 + (index % 20);
    const startTime = `2026-10-15 10:${String(startMinute).padStart(2, '0')}:00`;
    const submitTime = `2026-10-15 10:${String(startMinute + durationMins).padStart(2, '0')}:00`;

    attemptRows.push(`(${aId}, ${examId}, ${sId}, '${startTime}', '${submitTime}', 'evaluated', ${obtained.toFixed(2)}, ${percentage.toFixed(2)}, ${isPassed}, '192.168.1.${100 + sId}')`);

    scores.push({
      attemptId: aId,
      examId,
      studentId: sId,
      totalQ: totalQuestions,
      attemptedQ,
      correctQ,
      incorrectQ,
      unattemptedQ,
      totalMarks: maxMarks,
      obtainedMarks: obtained,
      percentage,
      isPassed,
      grade
    });
  });

  // Assign ranks within exam
  scores.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
  scores.forEach((sc, rankIndex) => {
    const resId = resultIdCounter++;
    const rank = rankIndex + 1;
    resultRows.push(`(${resId}, ${sc.attemptId}, ${sc.examId}, ${sc.studentId}, ${sc.totalQ}, ${sc.attemptedQ}, ${sc.correctQ}, ${sc.incorrectQ}, ${sc.unattemptedQ}, ${sc.totalMarks.toFixed(2)}, ${sc.obtainedMarks.toFixed(2)}, ${sc.percentage.toFixed(2)}, ${sc.isPassed}, '${sc.grade}', ${rank}, '2026-10-16 12:00:00')`);
  });
}

// Exam 1: 30 students (1 to 25 from CSE, 41 to 45 from ECE)
const exam1Students = [];
for (let i = 1; i <= 25; i++) exam1Students.push(i);
for (let i = 41; i <= 45; i++) exam1Students.push(i);
generateExamAttempts(1, exam1Students, 25, 50.00, 20.00);

// Exam 2: 25 students (1 to 25 from CSE)
const exam2Students = [];
for (let i = 1; i <= 25; i++) exam2Students.push(i);
generateExamAttempts(2, exam2Students, 20, 50.00, 20.00);

// Exam 3: 15 students (26 to 40 from IT)
const exam3Students = [];
for (let i = 26; i <= 40; i++) exam3Students.push(i);
generateExamAttempts(3, exam3Students, 20, 40.00, 16.00);

// Exam 5: 15 students (26 to 40 from IT)
generateExamAttempts(5, exam3Students, 12, 30.00, 12.00);

sql += `-- Student Exam Session Attempts\nINSERT INTO attempts (id, exam_id, student_id, start_time, submit_time, status, total_score, percentage, is_passed, ip_address) VALUES\n`;
sql += attemptRows.join(',\n') + ';\n\n';

sql += `-- Evaluated Results with Rankings\nINSERT INTO results (id, attempt_id, exam_id, student_id, total_questions, attempted_questions, correct_answers, incorrect_answers, unattempted_questions, total_marks, obtained_marks, percentage, is_passed, grade, rank_in_exam, published_at) VALUES\n`;
sql += resultRows.join(',\n') + ';\n\n';

// 11. SAMPLE STUDENT ANSWERS FOR ATTEMPT #1 (for detailed inspection of answer sheets)
const sampleAnswers = [];
for (let q = 1; q <= 25; q++) {
  const ansId = answerIdCounter++;
  const opt = (q % 3 === 0) ? '["B"]' : (q % 2 === 0) ? '["A"]' : '["C"]';
  const marks = (q % 4 === 0) ? 0.00 : 2.00;
  sampleAnswers.push(`(${ansId}, 1, ${q}, '${opt}', NULL, ${marks.toFixed(2)}, 0, 1, 'Evaluated by auto-grader')`);
}

sql += `-- Sample Answer Details for Attempt #1\nINSERT INTO student_answers (id, attempt_id, question_id, selected_options, descriptive_answer, marks_obtained, is_marked_for_review, is_evaluated, teacher_feedback) VALUES\n`;
sql += sampleAnswers.join(',\n') + ';\n\n';

// 12. AUDIT LOGS
sql += `-- Initial System Audit Trail\nINSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address) VALUES
(1, 1, 'SYSTEM_SCHEMA_INITIALIZED', 'database', 1, '{"status": "initialized", "version": "8.0"}', '127.0.0.1'),
(2, 1, 'EXAMINATION_PUBLISHED', 'exam', 1, '{"exam_title": "CS301 Midterm Examination"}', '127.0.0.1'),
(3, 2, 'QUESTION_BANK_POPULATED', 'question', 25, '{"course": "CS301", "count": 25}', '192.168.1.10'),
(4, 1, 'RESULTS_PUBLISHED', 'results', 1, '{"exam_id": 1, "published_count": 30}', '127.0.0.1');
`;

const outputPath = path.join(__dirname, '../../../database/seed.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Successfully generated database/seed.sql with ${allQuestionsRows.length} questions, ${resultRows.length} results, and complete sample dataset!`);

