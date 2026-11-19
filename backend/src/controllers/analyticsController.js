// backend/src/controllers/analyticsController.js
const { query } = require('../config/db');

// 1. Overall System Analytics (Executive Level)
async function getOverviewAnalytics(req, res) {
  try {
    // Aggregated metrics from views and tables
    const [overall] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM teachers) AS total_teachers,
        (SELECT COUNT(*) FROM exams) AS total_exams,
        (SELECT COUNT(*) FROM attempts WHERE status IN ('submitted', 'evaluated', 'auto_submitted')) AS total_attempts,
        (SELECT ROUND(AVG(percentage), 2) FROM results) AS avg_score_percentage,
        (SELECT ROUND((SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) FROM results) AS overall_pass_rate,
        (SELECT COUNT(*) FROM questions) AS total_questions
    `);

    // Grade Distribution Histogram
    const gradeDistribution = await query(`
      SELECT grade, COUNT(*) AS count
      FROM results
      GROUP BY grade
      ORDER BY FIELD(grade, 'A+', 'A', 'B+', 'B', 'C', 'D', 'F')
    `);

    // Department Performance
    const departmentPerformance = await query(`
      SELECT 
        d.dept_code,
        d.dept_name,
        COUNT(DISTINCT s.id) AS enrolled_students,
        COUNT(r.id) AS total_exam_submissions,
        ROUND(IFNULL(AVG(r.percentage), 0), 2) AS avg_percentage,
        ROUND(IFNULL((SUM(CASE WHEN r.is_passed = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(r.id), 0), 0), 2) AS pass_percentage
      FROM departments d
      LEFT JOIN students s ON d.id = s.department_id
      LEFT JOIN results r ON s.id = r.student_id
      GROUP BY d.id, d.dept_code, d.dept_name
      ORDER BY avg_percentage DESC
    `);

    // Semester Performance
    const semesterPerformance = await query(`
      SELECT 
        sem.semester_code,
        sem.semester_name,
        COUNT(DISTINCT e.id) AS exams_conducted,
        COUNT(r.id) AS submissions_count,
        ROUND(IFNULL(AVG(r.percentage), 0), 2) AS avg_percentage,
        ROUND(IFNULL((SUM(CASE WHEN r.is_passed = 1 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(r.id), 0), 0), 2) AS pass_percentage
      FROM semesters sem
      LEFT JOIN exams e ON sem.id = e.semester_id
      LEFT JOIN results r ON e.id = r.exam_id
      GROUP BY sem.id, sem.semester_code, sem.semester_name
      ORDER BY sem.semester_code ASC
    `);

    // Course Wise Performance (selecting directly from view course_wise_performance_view)
    const coursePerformance = await query(`
      SELECT course_code, course_name, dept_code, total_exams_conducted,
             total_attempts, course_avg_percentage, overall_pass_rate
      FROM course_wise_performance_view
      ORDER BY course_avg_percentage DESC
    `);

    return res.json({
      success: true,
      overall,
      gradeDistribution,
      departmentPerformance,
      semesterPerformance,
      coursePerformance
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Examination Detailed Analytics
async function getExamAnalytics(req, res) {
  const { examId } = req.params;

  try {
    const [performance] = await query(
      'SELECT * FROM exam_performance_view WHERE exam_id = ?',
      [examId]
    );

    if (!performance) {
      return res.status(404).json({ success: false, error: 'Exam not found or no attempts recorded' });
    }

    // Score Range Distribution (Buckets)
    const scoreBuckets = await query(`
      SELECT 
        CASE 
          WHEN percentage >= 90 THEN '90-100%'
          WHEN percentage >= 80 THEN '80-89%'
          WHEN percentage >= 70 THEN '70-79%'
          WHEN percentage >= 60 THEN '60-69%'
          WHEN percentage >= 50 THEN '50-59%'
          WHEN percentage >= 40 THEN '40-49%'
          ELSE 'Below 40% (Fail)'
        END AS score_range,
        COUNT(*) AS student_count
      FROM results
      WHERE exam_id = ?
      GROUP BY score_range
      ORDER BY MIN(percentage) DESC
    `, [examId]);

    // Leaderboard / Top Scorers
    const leaderboard = await query(`
      SELECT r.rank_in_exam, s.roll_number, u.full_name, r.obtained_marks, r.total_marks, r.percentage, r.grade
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE r.exam_id = ?
      ORDER BY r.rank_in_exam ASC
      LIMIT 10
    `, [examId]);

    // Difficulty-wise breakdown of questions in this exam
    const difficultyBreakdown = await query(`
      SELECT q.difficulty, COUNT(q.id) AS question_count,
             SUM(q.marks) AS total_marks
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      GROUP BY q.difficulty
    `, [examId]);

    return res.json({
      success: true,
      performance,
      scoreBuckets,
      leaderboard,
      difficultyBreakdown
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getOverviewAnalytics,
  getExamAnalytics
};

