// backend/src/controllers/studentController.js
const { query } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Student Dashboard Overview
async function getStudentDashboard(req, res) {
  try {
    const studentId = req.user.student_id;

    // Overview Stats
    const [stats] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM registrations WHERE student_id = ? AND status = 'approved') AS registered_exams_count,
        (SELECT COUNT(*) FROM attempts WHERE student_id = ? AND status IN ('submitted', 'evaluated', 'auto_submitted')) AS completed_exams_count,
        (SELECT ROUND(IFNULL(AVG(percentage), 0), 2) FROM results WHERE student_id = ?) AS overall_avg_percentage,
        (SELECT COUNT(*) FROM results WHERE student_id = ? AND is_passed = 1) AS exams_passed_count
    `, [studentId, studentId, studentId, studentId]);

    // Active & Upcoming exams
    const upcomingExams = await query(`
      SELECT e.id, e.title, e.duration_minutes, e.total_marks, e.passing_marks, e.start_time, e.end_time, e.status,
             c.course_code, c.course_name, u.full_name AS instructor_name,
             r.status AS registration_status,
             a.id AS existing_attempt_id, a.status AS attempt_status
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN teachers t ON e.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN registrations r ON e.id = r.exam_id AND r.student_id = ?
      LEFT JOIN attempts a ON e.id = a.exam_id AND a.student_id = ?
      WHERE e.status IN ('published', 'ongoing', 'scheduled')
      ORDER BY e.start_time ASC
      LIMIT 6
    `, [studentId, studentId]);

    // Recent 5 published results
    const recentResults = await query(`
      SELECT r.*, e.title AS exam_title, c.course_code, c.course_name
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE r.student_id = ? AND e.is_published_results = 1
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [studentId]);

    return res.json({
      success: true,
      stats,
      upcomingExams,
      recentResults
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Available Examinations & Registration
async function getAvailableExams(req, res) {
  try {
    const studentId = req.user.student_id;
    const deptId = req.user.department_id;
    const semId = req.user.semester_id;

    const exams = await query(`
      SELECT e.*, c.course_code, c.course_name, d.dept_name, sem.semester_name,
             u.full_name AS instructor_name,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) AS total_questions,
             reg.status AS registration_status,
             att.id AS attempt_id, att.status AS attempt_status, att.start_time AS attempt_start_time
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN semesters sem ON e.semester_id = sem.id
      JOIN teachers t ON e.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN registrations reg ON e.id = reg.exam_id AND reg.student_id = ?
      LEFT JOIN attempts att ON e.id = att.exam_id AND att.student_id = ?
      WHERE e.status IN ('published', 'scheduled', 'ongoing')
      ORDER BY e.start_time ASC
    `, [studentId, studentId]);

    return res.json({ success: true, exams });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function registerForExam(req, res) {
  const { examId } = req.params;
  const studentId = req.user.student_id;

  try {
    // Verify exam exists and is open
    const [exam] = await query('SELECT id, status, title FROM exams WHERE id = ?', [examId]);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Examination not found' });
    }

    if (exam.status === 'closed' || exam.status === 'archived') {
      return res.status(400).json({ success: false, error: 'Examination is closed for registrations.' });
    }

    await query(
      `INSERT INTO registrations (exam_id, student_id, status)
       VALUES (?, ?, 'approved')
       ON DUPLICATE KEY UPDATE status = 'approved'`,
      [examId, studentId]
    );

    await logAudit({
      userId: req.user.id,
      action: 'STUDENT_REGISTERED_EXAM',
      entityType: 'exams',
      entityId: examId,
      details: { title: exam.title },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: `Successfully registered for "${exam.title}"` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 3. Student Published Results & Scorecards
async function getMyResults(req, res) {
  try {
    const studentId = req.user.student_id;

    const results = await query(`
      SELECT r.*, e.title AS exam_title, e.duration_minutes, e.is_published_results,
             c.course_code, c.course_name, d.dept_name,
             a.start_time AS attempt_start_time, a.submit_time AS attempt_submit_time,
             TIMESTAMPDIFF(MINUTE, a.start_time, a.submit_time) AS duration_spent_minutes
      FROM results r
      JOIN attempts a ON r.attempt_id = a.id
      JOIN exams e ON r.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      WHERE r.student_id = ? AND e.is_published_results = 1
      ORDER BY r.created_at DESC
    `, [studentId]);

    return res.json({ success: true, count: results.length, results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getResultDetail(req, res) {
  const { resultId } = req.params;
  const studentId = req.user.student_id;

  try {
    const [result] = await query(`
      SELECT r.*, e.title AS exam_title, e.instructions, e.negative_marking_per_question, e.is_published_results,
             c.course_code, c.course_name, d.dept_name,
             a.start_time AS attempt_start_time, a.submit_time AS attempt_submit_time,
             TIMESTAMPDIFF(MINUTE, a.start_time, a.submit_time) AS duration_spent_minutes
      FROM results r
      JOIN attempts a ON r.attempt_id = a.id
      JOIN exams e ON r.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      WHERE r.id = ? AND r.student_id = ?
    `, [resultId, studentId]);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Result scorecard not found or access denied.' });
    }

    // Only expose full answers & answer key if results are published by the teacher
    let questionReviews = [];
    if (result.is_published_results) {
      questionReviews = await query(`
        SELECT sa.question_id, sa.selected_options, sa.descriptive_answer, sa.marks_obtained,
               sa.teacher_feedback, sa.is_evaluated,
               q.question_text, q.question_type, q.marks AS max_marks, q.negative_marks, q.topic, q.explanation
        FROM student_answers sa
        JOIN questions q ON sa.question_id = q.id
        WHERE sa.attempt_id = ?
        ORDER BY q.id ASC
      `, [result.attempt_id]);

      // Attach options and correct flag since results are released
      for (const item of questionReviews) {
        item.options = await query(
          'SELECT option_key, option_text, is_correct FROM question_options WHERE question_id = ? ORDER BY option_key ASC',
          [item.question_id]
        );
      }
    }

    return res.json({ success: true, result, questions: questionReviews });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 4. Student Analytics
async function getStudentAnalytics(req, res) {
  try {
    const studentId = req.user.student_id;

    // Chronological exam scores for line chart
    const scoreHistory = await query(`
      SELECT r.id AS result_id, e.title AS exam_title, c.course_code, r.percentage, r.obtained_marks, r.total_marks,
             r.grade, r.rank_in_exam, a.submit_time
      FROM results r
      JOIN attempts a ON r.attempt_id = a.id
      JOIN exams e ON r.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE r.student_id = ? AND e.is_published_results = 1
      ORDER BY a.submit_time ASC
    `, [studentId]);

    // Subject/course wise averages
    const subjectWise = await query(`
      SELECT c.course_code, c.course_name,
             ROUND(AVG(r.percentage), 2) AS my_avg_percentage,
             COUNT(r.id) AS exams_taken
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE r.student_id = ? AND e.is_published_results = 1
      GROUP BY c.id, c.course_code, c.course_name
    `, [studentId]);

    return res.json({ success: true, scoreHistory, subjectWise });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getStudentDashboard,
  getAvailableExams,
  registerForExam,
  getMyResults,
  getResultDetail,
  getStudentAnalytics
};

