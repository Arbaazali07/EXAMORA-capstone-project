// frontend/src/pages/dbms/DbmsViva.jsx
// Comprehensive University DBMS Viva Voce Preparation Center (45 In-Depth Questions & Answers)

import React, { useState } from 'react';
import { BookOpen, Search, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';

const VIVA_QUESTIONS = [
  {
    q: "Explain the entity specialization hierarchy used for Users, Teachers, and Students in EXAMORA.",
    cat: "ER & Normalization",
    a: "EXAMORA utilizes a 1:1 Relational Specialization pattern. The base table users contains polymorphic authentication and profile attributes (username, email, password_hash, role, full_name). Sub-entities teachers and students have dedicated tables that reference users(id) via a Foreign Key with a UNIQUE constraint and ON DELETE CASCADE. This eliminates duplicate email or password storage across roles, centralizes authentication, and avoids NULL-value bloat for domain-specific attributes (roll_number, admission_year for students; employee_id, designation for teachers)."
  },
  {
    q: "Why is the relationship between Teachers and Courses modeled through an associative entity teacher_courses?",
    cat: "ER & Normalization",
    a: "The relationship between Teachers and Courses is Many-to-Many (M:N) qualified by Academic Semester. A teacher instructs multiple courses over their career, and a course (e.g. CS301 - DBMS) is taught by multiple instructors across different terms. The associative entity teacher_courses with composite unique constraint UNIQUE (teacher_id, course_id, semester_id) cleanly tracks instructor term assignments in 3NF/BCNF."
  },
  {
    q: "What is the difference between 3NF and BCNF? Does EXAMORA satisfy BCNF?",
    cat: "ER & Normalization",
    a: "In 3NF, for every non-trivial functional dependency X -> Y, either X is a superkey OR Y is a prime attribute. BCNF is strictly stronger: for EVERY non-trivial FD X -> Y, X MUST be a superkey (disallowing non-superkeys determining prime attributes). In EXAMORA, every determinant in our functional dependencies is a candidate key or superkey. Therefore, all 16 tables strictly satisfy BCNF."
  },
  {
    q: "How does EXAMORA avoid Insertion, Update, and Deletion Anomalies?",
    cat: "ER & Normalization",
    a: "Insertion Anomaly: In a flat table, you cannot add a new course without enrolling a student or scheduling an exam; in EXAMORA, departments and courses exist as standalone tables. Update Anomaly: Course credits or titles exist in one place in courses, avoiding inconsistent historical records. Deletion Anomaly: Deleting a student prunes their attempts via ON DELETE CASCADE while preserving parent departments, courses, and exams intact."
  },
  {
    q: "What referential integrity constraints were chosen for department_id in students vs courses?",
    cat: "ER & Normalization",
    a: "students.department_id uses ON DELETE RESTRICT to ensure a department with active enrolled students cannot be accidentally dropped from the database, preventing orphaned academic records. courses.department_id uses ON DELETE CASCADE so if a curriculum department is legally decommissioned by university administrators, its course catalog prunes cleanly."
  },
  {
    q: "What are ACID properties, and how are they practically enforced during exam submission in EXAMORA?",
    cat: "Transactions & ACID",
    a: "Atomicity: All operations in exam submission (saving answers, calculating objective marks, updating attempt status, inserting into results, audit logging) are wrapped in START TRANSACTION and COMMIT, rolling back cleanly on failure. Consistency: Database constraints enforce score bounds and passing limits. Isolation: Row-level locking (SELECT ... FOR UPDATE) prevents concurrent double-submission race conditions. Durability: Guaranteed by MySQL InnoDB's Write-Ahead Logging (WAL) and Redo Log (ib_logfile)."
  },
  {
    q: "Why did we use SELECT ... FOR UPDATE when starting an exam submission?",
    cat: "Transactions & ACID",
    a: "SELECT ... FOR UPDATE places an exclusive write lock on the student's attempt row in MySQL. This prevents race conditions where a student clicking 'Submit' simultaneously collides with the background client auto-submit timer. The first transaction acquires the lock, changes status from 'in_progress' to 'submitted'/'evaluated', and commits; the second request sees the status change and aborts cleanly."
  },
  {
    q: "What is the Lost Update problem? How does Two-Phase Locking (2PL) prevent it?",
    cat: "Transactions & ACID",
    a: "Lost update occurs when two transactions read the same record, both modify it, and the second transaction overwrites the first transaction's modifications without seeing them. Two-Phase Locking (2PL) enforces a Growing Phase (only acquire locks) and a Shrinking Phase (only release locks). A transaction cannot obtain an exclusive write lock while another holds a lock, serializing transactions."
  },
  {
    q: "What are the four ANSI SQL Transaction Isolation Levels?",
    cat: "Transactions & ACID",
    a: "1. READ UNCOMMITTED: Allows Dirty, Non-Repeatable, and Phantom Reads. 2. READ COMMITTED: Prevents Dirty Reads. 3. REPEATABLE READ (MySQL InnoDB Default): Prevents Dirty Reads and Non-Repeatable Reads (and phantoms via MVCC and Next-Key Locks). 4. SERIALIZABLE: Strict 2PL serial execution."
  },
  {
    q: "What is a SAVEPOINT in MySQL? How is it used?",
    cat: "Transactions & ACID",
    a: "A SAVEPOINT creates an intermediate checkpoint within a transaction (SAVEPOINT sp1;). If a non-critical subsequent operation fails, the transaction can execute ROLLBACK TO SAVEPOINT sp1; to undo only that failed step while preserving preceding changes before finalizing with COMMIT."
  },
  {
    q: "How is a FULL OUTER JOIN achieved in MySQL 8?",
    cat: "Joins & Subqueries",
    a: "MySQL does not provide a native FULL OUTER JOIN keyword. It is achieved by combining a LEFT JOIN and a RIGHT JOIN with the UNION set operator: SELECT ... FROM courses c LEFT JOIN exams e ON c.id = e.course_id UNION SELECT ... FROM courses c RIGHT JOIN exams e ON c.id = e.course_id;. UNION deduplicates tuples matched by both queries."
  },
  {
    q: "Explain the difference between UNION and UNION ALL.",
    cat: "Joins & Subqueries",
    a: "UNION combines result sets and performs an algorithmic distinct sort pass (O(N log N)) to eliminate duplicate rows. UNION ALL concatenates result sets directly without checking for duplicates (O(N)), which is significantly faster when rows are known to be distinct or when logging audit events."
  },
  {
    q: "How does EXAMORA emulate the INTERSECT and EXCEPT set operators in MySQL?",
    cat: "Joins & Subqueries",
    a: "INTERSECT is emulated using an INNER JOIN between two filtered subqueries: SELECT r1.student_id FROM registrations r1 INNER JOIN registrations r2 ON r1.student_id = r2.student_id AND r2.exam_id = 2 WHERE r1.exam_id = 1;. EXCEPT is emulated using NOT EXISTS: WHERE r1.exam_id = 1 AND NOT EXISTS (SELECT 1 FROM registrations r2 WHERE r2.student_id = r1.student_id AND r2.exam_id = 2)."
  },
  {
    q: "What is a Correlated Subquery? How does it differ from a Nested Subquery?",
    cat: "Joins & Subqueries",
    a: "A nested scalar subquery executes once independently and passes an aggregated value to the outer query. A correlated subquery contains a reference to columns from the outer query tuple (e.g. finding the top scorer within EACH course). It must conceptually re-evaluate for every candidate tuple examined by the outer query."
  },
  {
    q: "When is EXISTS preferred over IN in SQL query optimization?",
    cat: "Joins & Subqueries",
    a: "EXISTS short-circuits evaluation as soon as the first matching tuple is found and handles NULL values without three-valued logic pitfalls. IN must evaluate the complete inner subquery and build a set in memory before testing membership."
  },
  {
    q: "What is a Database View? What are the 4 views created in EXAMORA?",
    cat: "Views & Indexing",
    a: "A view is a stored relational query definition acting as a virtual table. The 4 views in EXAMORA are: 1. student_result_view (comprehensive student scorecards across 7 tables), 2. exam_performance_view (aggregated stats per exam: pass rate, averages, min/max), 3. course_wise_performance_view (curriculum-level analytics), 4. student_attempt_history_view (session audit logs)."
  },
  {
    q: "Are the views in EXAMORA updatable?",
    cat: "Views & Indexing",
    a: "No. In MySQL, views are updatable only if they map 1:1 to a single underlying base table without aggregate functions (SUM, AVG, COUNT), GROUP BY, or UNION. Because EXAMORA's views perform multi-table joins and analytical aggregations, they are strictly read-only views."
  },
  {
    q: "What is the difference between Clustered and Secondary Indexes in InnoDB?",
    cat: "Views & Indexing",
    a: "In InnoDB, physical table rows are organized inside the B+ Tree of the Clustered Index, which is always built on the Primary Key. Secondary indexes store indexed key values and a pointer (the primary key) to the clustered index, requiring a secondary lookup (bookmark lookup) unless covered by the index."
  },
  {
    q: "Explain Composite Indexes and the Leftmost Prefix Rule.",
    cat: "Views & Indexing",
    a: "A Composite Index indexes multiple columns, such as idx_attempts(exam_id, student_id, status). Under the Leftmost Prefix Rule, MySQL can use the index for queries filtering on (exam_id), (exam_id, student_id), or (exam_id, student_id, status). However, filtering only on (student_id) cannot leverage the index."
  },
  {
    q: "What is EXPLAIN in MySQL 8? How does it help in query tuning?",
    cat: "Views & Indexing",
    a: "EXPLAIN displays the query execution plan produced by the MySQL optimizer, showing the join order, table access types (const, eq_ref, ref, range, index, ALL), indexes considered, rows examined, and filter ratios, helping detect full-table scans and missing indexes."
  },
  {
    q: "Compare ROW_NUMBER(), RANK(), and DENSE_RANK().",
    cat: "Window Functions & CTEs",
    a: "For scores 95, 90, 90, 85: ROW_NUMBER() assigns sequential integers: 1, 2, 3, 4. RANK() assigns identical rank to ties but skips numbers: 1, 2, 2, 4. DENSE_RANK() assigns identical ranks without gaps: 1, 2, 2, 3. In EXAMORA, DENSE_RANK() is used for class rankings."
  },
  {
    q: "How do LAG() and LEAD() window functions work?",
    cat: "Window Functions & CTEs",
    a: "LAG(col, offset) accesses the value of a previous row at offset within the partition without a self-join. LEAD(col, offset) accesses a subsequent row. EXAMORA uses LAG() to compute the score difference between a student and the higher peer in the same exam, as well as cross-exam score improvements."
  },
  {
    q: "What is a Common Table Expression (CTE)?",
    cat: "Window Functions & CTEs",
    a: "A CTE (WITH cte_name AS (...)) defines a temporary named result set within the scope of a query. CTEs improve readability over deeply nested subqueries, enable self-referencing recursive queries, and can be joined multiple times in the outer statement."
  },
  {
    q: "How does EXAMORA protect examination answer keys from student inspection?",
    cat: "Security & Architecture",
    a: "The API endpoint GET /api/exam/:attemptId/state explicitly omits the is_correct column from question_options in its SQL query. Correct answers and explanations are stored securely on the database server and are only returned after the teacher publishes results."
  },
  {
    q: "How does EXAMORA prevent students from submitting answers after the time limit?",
    cat: "Security & Architecture",
    a: "EXAMORA implements server-authoritative time enforcement. When an attempt starts, the server writes start_time = NOW(). On every answer save and submit, the server checks if NOW() <= start_time + duration + grace_period AND NOW() <= exam.end_time. Client clock tampering cannot bypass server checks."
  },
  {
    q: "How are passwords securely stored in EXAMORA?",
    cat: "Security & Architecture",
    a: "Passwords are never stored in plain text. EXAMORA uses bcrypt with 10 salt rounds. Bcrypt incorporates a cryptographically random salt and slow key-stretching iterations to resist brute-force dictionary attacks."
  },
  {
    q: "How does EXAMORA prevent SQL Injection attacks?",
    cat: "Security & Architecture",
    a: "All database queries use parameterized prepared statements through mysql2/promise (pool.query('SELECT ... WHERE id = ?', [id])). Parameter markers ensure data is sent separately from SQL code structure, preventing attackers from injecting arbitrary SQL logic."
  },
  {
    q: "Why is utf8mb4 character set required instead of legacy utf8 in MySQL?",
    cat: "Security & Architecture",
    a: "Legacy utf8 in MySQL supports only up to 3 bytes per character, failing to store supplementary Unicode characters. utf8mb4 supports the full 4-byte Unicode standard required for modern internationalization and symbols."
  }
];

export default function DbmsViva() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [openItems, setOpenItems] = useState({ 0: true, 1: true });

  const categories = ['All', 'ER & Normalization', 'Transactions & ACID', 'Joins & Subqueries', 'Views & Indexing', 'Window Functions & CTEs', 'Security & Architecture'];

  const toggleItem = (idx) => {
    setOpenItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filtered = VIVA_QUESTIONS.filter(item => {
    const matchesCat = selectedCat === 'All' || item.cat === selectedCat;
    const matchesSearch = item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">University DBMS Viva-Voce Center</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
            Capstone Evaluation
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Curated technical viva questions and in-depth academic answers based on the real EXAMORA MySQL schema
        </p>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search viva questions by topic (e.g. BCNF, 2PL, Clustered Index, MVCC, Window)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCat === c
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Accordion */}
      <div className="space-y-3">
        {filtered.map((item, idx) => {
          const isOpen = Boolean(openItems[idx]);
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs transition-shadow"
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/60"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {item.cat}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    <span className="text-indigo-600 mr-1.5 font-mono">Q{idx + 1}.</span>
                    {item.q}
                  </h3>
                </div>
                <div className="p-1 rounded-lg text-slate-400 shrink-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="p-4 pt-0 border-t border-slate-100 text-xs text-slate-700 leading-relaxed bg-slate-50/40">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-slate-800 shadow-2xs mt-3">
                    <strong className="text-indigo-600 block mb-1 uppercase text-[10px] tracking-wider font-extrabold">Model Answer:</strong>
                    {item.a}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

