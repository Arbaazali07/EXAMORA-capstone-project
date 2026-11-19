// backend/src/controllers/dbmsLabController.js
// Interactive DBMS Syllabus Laboratory & Live SQL Query Execution Engine

const { query } = require('../config/db');

// Predefined Curated Syllabus Demonstration Queries
const SYLLABUS_CATALOG = [
  {
    id: 'joins_inner',
    category: 'JOINS',
    title: 'INNER JOIN: Multi-Table Academic Mapping',
    description: 'Retrieves complete student profiles joined with User authentication, Department, and Semester records.',
    concept: 'Matches tuples with identical foreign key references across tables; excludes unassociated records.',
    sql: `SELECT s.roll_number, u.full_name AS student_name, u.email, d.dept_name, sem.semester_name
FROM students s
INNER JOIN users u ON s.user_id = u.id
INNER JOIN departments d ON s.department_id = d.id
INNER JOIN semesters sem ON s.semester_id = sem.id
ORDER BY s.roll_number ASC
LIMIT 15;`
  },
  {
    id: 'joins_left',
    category: 'JOINS',
    title: 'LEFT JOIN: Examination Attempt Participation',
    description: 'Fetches all examinations and counts total student attempts, including examinations with zero attempts.',
    concept: 'Preserves all records from the left relation (exams) even if matching right records (attempts) do not exist.',
    sql: `SELECT e.id AS exam_id, e.title AS exam_title, e.status, COUNT(a.id) AS total_attempts_recorded
FROM exams e
LEFT JOIN attempts a ON e.id = a.exam_id
GROUP BY e.id, e.title, e.status
ORDER BY total_attempts_recorded DESC;`
  },
  {
    id: 'joins_self',
    category: 'JOINS',
    title: 'SELF JOIN: Peer Performance Comparison',
    description: 'Compares marks between students who took Exam #1 to find pairs where Student A outscored Student B.',
    concept: 'Joins a table to itself to evaluate intra-table record relationships and calculate relative score deltas.',
    sql: `SELECT 
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
LIMIT 10;`
  },
  {
    id: 'joins_full_outer',
    category: 'JOINS',
    title: 'FULL OUTER JOIN Emulation (LEFT JOIN UNION RIGHT JOIN)',
    description: 'Combines all courses and all exams, including unassigned courses or unmapped exams without duplicates.',
    concept: 'MySQL lacks native FULL OUTER JOIN; emulated safely using LEFT JOIN UNION RIGHT JOIN to eliminate duplicate rows.',
    sql: `SELECT c.id AS course_id, c.course_code, c.course_name, e.id AS exam_id, e.title AS exam_title
FROM courses c
LEFT JOIN exams e ON c.id = e.course_id
UNION
SELECT c.id AS course_id, c.course_code, c.course_name, e.id AS exam_id, e.title AS exam_title
FROM courses c
RIGHT JOIN exams e ON c.id = e.course_id
LIMIT 20;`
  },
  {
    id: 'subqueries_scalar',
    category: 'SUBQUERIES',
    title: 'Nested Scalar Subquery: Above-Average Scorers',
    description: 'Finds students in Exam #1 who achieved marks strictly higher than the overall class arithmetic mean.',
    concept: 'Evaluates an inner scalar subquery once, returning an aggregated value to filter outer tuples.',
    sql: `SELECT s.roll_number, u.full_name, r.obtained_marks, r.percentage, r.grade
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.exam_id = 1 
  AND r.obtained_marks > (
      SELECT AVG(obtained_marks) 
      FROM results 
      WHERE exam_id = 1
  )
ORDER BY r.obtained_marks DESC;`
  },
  {
    id: 'subqueries_correlated',
    category: 'SUBQUERIES',
    title: 'Correlated Subquery: Subject Topper Identification',
    description: 'Identifies the highest-scoring student individually within each distinct academic course.',
    concept: 'The inner subquery references the outer query course_id, re-executing for each outer tuple evaluated.',
    sql: `SELECT c.course_code, c.course_name, u.full_name AS top_student, r.obtained_marks
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
);`
  },
  {
    id: 'subqueries_exists',
    category: 'SUBQUERIES',
    title: 'EXISTS & NOT EXISTS: Active vs Inactive Students',
    description: 'Finds students who have NOT attempted any examination in the system yet.',
    concept: 'Boolean existential quantifier checks if the subquery returns at least one row, stopping early for performance.',
    sql: `SELECT s.roll_number, u.full_name, d.dept_name
FROM students s
INNER JOIN users u ON s.user_id = u.id
INNER JOIN departments d ON s.department_id = d.id
WHERE NOT EXISTS (
    SELECT 1 
    FROM attempts a 
    WHERE a.student_id = s.id
)
LIMIT 10;`
  },
  {
    id: 'set_union',
    category: 'SET OPERATIONS',
    title: 'UNION: Distinct Directory of Academic Personnel',
    description: 'Generates a unified list of all teachers and students with their campus role designation.',
    concept: 'Combines tuple streams from two queries, eliminating duplicate rows across sets.',
    sql: `SELECT u.full_name, u.email, 'Faculty' AS role_category
FROM users u
INNER JOIN teachers t ON u.id = t.user_id
UNION
SELECT u.full_name, u.email, 'Student' AS role_category
FROM users u
INNER JOIN students s ON u.id = s.user_id
ORDER BY full_name ASC
LIMIT 20;`
  },
  {
    id: 'set_intersect',
    category: 'SET OPERATIONS',
    title: 'INTERSECT Emulation: Multi-Exam Registrants',
    description: 'Finds students who registered for both Exam #1 AND Exam #2.',
    concept: 'Emulates relational set intersection using INNER JOIN between two filtered registration subsets.',
    sql: `SELECT r1.student_id, u.full_name, s.roll_number
FROM registrations r1
INNER JOIN registrations r2 ON r1.student_id = r2.student_id AND r2.exam_id = 2
INNER JOIN students s ON r1.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r1.exam_id = 1;`
  },
  {
    id: 'views_student_result',
    category: 'VIEWS',
    title: 'View: student_result_view (Honor Roll)',
    description: 'Queries the student_result_view to list high achievers scoring 75% or above across courses.',
    concept: 'A stored relational view provides an abstraction layer over 7 underlying normalized tables.',
    sql: `SELECT roll_number, student_name, course_code, obtained_marks, percentage, grade, rank_in_exam
FROM student_result_view
WHERE percentage >= 75.00
ORDER BY percentage DESC
LIMIT 15;`
  },
  {
    id: 'views_exam_perf',
    category: 'VIEWS',
    title: 'View: exam_performance_view (Statistical Summary)',
    description: 'Fetches aggregated examination performance metrics including pass rate, average, highest and lowest scores.',
    concept: 'Encapsulates complex multi-aggregation queries with IFNULL handling and pass percentage calculations.',
    sql: `SELECT exam_title, course_code, instructor_name, total_attempts, average_score, highest_score, pass_percentage
FROM exam_performance_view
ORDER BY pass_percentage DESC;`
  },
  {
    id: 'window_ranking',
    category: 'WINDOW FUNCTIONS',
    title: 'ROW_NUMBER(), RANK(), DENSE_RANK(): Ranking Comparison',
    description: 'Computes three distinct ranking perspectives over student scores in Exam #1 to illustrate tie handling.',
    concept: 'ROW_NUMBER assigns strict sequential integers; RANK leaves gaps on ties; DENSE_RANK leaves no gaps.',
    sql: `SELECT 
    s.roll_number,
    u.full_name,
    r.obtained_marks,
    ROW_NUMBER() OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS row_num,
    RANK() OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS standard_rank,
    DENSE_RANK() OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS dense_rank
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.exam_id = 1
ORDER BY r.obtained_marks DESC
LIMIT 15;`
  },
  {
    id: 'window_lag_lead',
    category: 'WINDOW FUNCTIONS',
    title: 'LAG() & LEAD(): Peer Score Deficit & Comparison',
    description: 'Compares each student score against the preceding (higher) and following (lower) peer scores in the same exam.',
    concept: 'Accesses data from adjacent rows within the partitioned window without requiring self-joins.',
    sql: `SELECT 
    s.roll_number,
    u.full_name,
    r.obtained_marks,
    LAG(r.obtained_marks, 1) OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS previous_higher_score,
    ROUND((LAG(r.obtained_marks, 1) OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) - r.obtained_marks), 2) AS deficit_from_higher_peer,
    LEAD(r.obtained_marks, 1) OVER (PARTITION BY r.exam_id ORDER BY r.obtained_marks DESC) AS next_lower_score
FROM results r
INNER JOIN students s ON r.student_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE r.exam_id = 1
ORDER BY r.obtained_marks DESC
LIMIT 15;`
  },
  {
    id: 'cte_semester_cohort',
    category: 'COMMON TABLE EXPRESSIONS',
    title: 'CTE: Semester Cohort Performance Classification',
    description: 'Uses a WITH query to aggregate semester pass rates and classify academic performance into cohorts.',
    concept: 'Common Table Expressions define modular, readable temporary result sets that can be referenced sequentially.',
    sql: `WITH SemesterStats AS (
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
FROM SemesterStats;`
  },
  {
    id: 'cte_score_improvement',
    category: 'COMMON TABLE EXPRESSIONS',
    title: 'CTE + LAG(): Longitudinal Student Score Improvement',
    description: 'Tracks students who improved their scores across consecutive examinations over time.',
    concept: 'Combines CTE modularity with LAG() window analytic functions to compute cross-exam growth trajectories.',
    sql: `WITH StudentChronologicalScores AS (
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
ORDER BY percentage_improvement DESC
LIMIT 15;`
  },
  {
    id: 'indexes_explain',
    category: 'INDEXING & OPTIMIZATION',
    title: 'EXPLAIN: Optimizer Execution Plan Analysis',
    description: 'Demonstrates index usage (idx_attempts_composite_search, idx_results_exam_rank) via MySQL EXPLAIN.',
    concept: 'Reveals table scan types, key selections, estimated rows examined, and filtering efficiency.',
    sql: `EXPLAIN
SELECT a.id, a.student_id, r.obtained_marks, r.rank_in_exam
FROM attempts a
INNER JOIN results r ON a.id = r.attempt_id
WHERE a.exam_id = 1 AND a.status = 'evaluated'
ORDER BY r.rank_in_exam ASC;`
  }
];

// Get List of Curated Queries
async function getCatalog(req, res) {
  return res.json({
    success: true,
    categories: ['JOINS', 'SUBQUERIES', 'SET OPERATIONS', 'VIEWS', 'WINDOW FUNCTIONS', 'COMMON TABLE EXPRESSIONS', 'INDEXING & OPTIMIZATION'],
    queries: SYLLABUS_CATALOG
  });
}

// Execute Live SQL Query safely
async function executeQuery(req, res) {
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'SQL query text is required.' });
  }

  const cleanSql = sql.trim();
  const lower = cleanSql.toLowerCase();

  // Safety checks - disallow database destruction or malicious statements
  const forbiddenKeywords = ['drop database', 'shutdown', 'grant all', 'revoke all', 'flush tables'];
  for (const kw of forbiddenKeywords) {
    if (lower.includes(kw)) {
      return res.status(403).json({
        success: false,
        error: `Execution prohibited: statement contains restricted keyword '${kw}'.`
      });
    }
  }

  const startTime = Date.now();
  try {
    const results = await query(cleanSql);
    const executionTimeMs = Date.now() - startTime;

    let columns = [];
    let rows = [];

    if (Array.isArray(results)) {
      rows = results;
      if (results.length > 0 && typeof results[0] === 'object') {
        columns = Object.keys(results[0]);
      }
    } else {
      // DDL or DML write operation result
      rows = [{
        affectedRows: results.affectedRows,
        insertId: results.insertId,
        message: results.message || 'Query executed successfully'
      }];
      columns = Object.keys(rows[0]);
    }

    // If query is SELECT or WITH and not already an EXPLAIN, obtain execution plan
    let explainPlan = null;
    if ((lower.startsWith('select') || lower.startsWith('with')) && !lower.startsWith('explain')) {
      try {
        const explainResult = await query(`EXPLAIN ${cleanSql}`);
        explainPlan = explainResult;
      } catch (expErr) {
        // non-blocking
      }
    }

    return res.json({
      success: true,
      executionTimeMs,
      rowCount: Array.isArray(results) ? results.length : results.affectedRows,
      columns,
      rows,
      explainPlan
    });
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    return res.status(400).json({
      success: false,
      executionTimeMs,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
  }
}

module.exports = {
  getCatalog,
  executeQuery
};

