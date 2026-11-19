// backend/src/controllers/teacherController.js
const { query, getConnection } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get Assigned Courses for Logged-in Teacher
async function getMyCourses(req, res) {
  try {
    const teacherId = req.user.teacher_id;
    const courses = await query(`
      SELECT c.*, d.dept_code, d.dept_name, tc.semester_id, sem.semester_name,
             (SELECT COUNT(*) FROM exams WHERE course_id = c.id AND teacher_id = ?) AS my_exams_count,
             (SELECT COUNT(*) FROM questions WHERE course_id = c.id) AS course_questions_count
      FROM teacher_courses tc
      JOIN courses c ON tc.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN semesters sem ON tc.semester_id = sem.id
      WHERE tc.teacher_id = ?
      ORDER BY c.course_code ASC
    `, [teacherId, teacherId]);

    return res.json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Question Bank CRUD
async function getQuestions(req, res) {
  try {
    const { course_id, difficulty, question_type, search } = req.query;
    let sql = `
      SELECT q.*, c.course_code, c.course_name, u.full_name AS author_name
      FROM questions q
      JOIN courses c ON q.course_id = c.id
      JOIN teachers t ON q.created_by_teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) {
      sql += ' AND q.course_id = ?';
      params.push(course_id);
    }
    if (difficulty) {
      sql += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    if (question_type) {
      sql += ' AND q.question_type = ?';
      params.push(question_type);
    }
    if (search) {
      sql += ' AND (q.question_text LIKE ? OR q.topic LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY q.created_at DESC';
    const questions = await query(sql, params);

    // Fetch options for all returned questions
    if (questions.length > 0) {
      const qIds = questions.map(q => q.id);
      const options = await query(
        `SELECT * FROM question_options WHERE question_id IN (${qIds.join(',')}) ORDER BY option_key ASC`
      );
      const optionsByQ = {};
      options.forEach(opt => {
        if (!optionsByQ[opt.question_id]) optionsByQ[opt.question_id] = [];
        optionsByQ[opt.question_id].push(opt);
      });

      questions.forEach(q => {
        q.options = optionsByQ[q.id] || [];
      });
    }

    return res.json({ success: true, count: questions.length, questions });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createQuestion(req, res) {
  const { course_id, question_text, question_type, marks, negative_marks, difficulty, topic, explanation, options } = req.body;

  if (!course_id || !question_text || !question_type || marks === undefined) {
    return res.status(400).json({ success: false, error: 'Course, question text, type, and marks are required.' });
  }

  const teacherId = req.user.teacher_id;
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [qResult] = await conn.query(
      `INSERT INTO questions (course_id, created_by_teacher_id, question_text, question_type, marks, negative_marks, difficulty, topic, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, teacherId, question_text, question_type, marks, negative_marks || 0.00, difficulty || 'medium', topic || 'General', explanation || null]
    );

    const questionId = qResult.insertId;

    // Insert options if objective question
    if (options && Array.isArray(options) && options.length > 0 && question_type !== 'descriptive') {
      for (const opt of options) {
        await conn.query(
          'INSERT INTO question_options (question_id, option_key, option_text, is_correct) VALUES (?, ?, ?, ?)',
          [questionId, opt.option_key || opt.key, opt.option_text || opt.text, opt.is_correct ? 1 : 0]
        );
      }
    }

    await conn.commit();

    await logAudit({
      userId: req.user.id,
      action: 'TEACHER_CREATED_QUESTION',
      entityType: 'questions',
      entityId: questionId,
      details: { course_id, question_type, marks },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Question created successfully', questionId });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

async function deleteQuestion(req, res) {
  const { questionId } = req.params;
  try {
    await query('DELETE FROM questions WHERE id = ?', [questionId]);
    return res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 3. Exam Management
async function getMyExams(req, res) {
  try {
    const teacherId = req.user.teacher_id;
    const exams = await query(`
      SELECT e.*, c.course_code, c.course_name, sem.semester_name,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) AS total_questions_assigned,
             (SELECT COUNT(*) FROM registrations WHERE exam_id = e.id) AS total_registrations,
             (SELECT COUNT(*) FROM attempts WHERE exam_id = e.id) AS total_attempts,
             (SELECT COUNT(*) FROM attempts WHERE exam_id = e.id AND status = 'submitted') AS pending_evaluations
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN semesters sem ON e.semester_id = sem.id
      WHERE e.teacher_id = ?
      ORDER BY e.start_time DESC
    `, [teacherId]);

    return res.json({ success: true, exams });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createExam(req, res) {
  const {
    title, description, course_id, semester_id, start_time, end_time,
    duration_minutes, total_marks, passing_marks, negative_marking_per_question,
    instructions, question_ids
  } = req.body;

  if (!title || !course_id || !semester_id || !start_time || !end_time || !duration_minutes) {
    return res.status(400).json({ success: false, error: 'Mandatory exam fields are missing.' });
  }

  const teacherId = req.user.teacher_id;
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [examResult] = await conn.query(
      `INSERT INTO exams 
       (title, description, course_id, semester_id, teacher_id, start_time, end_time, duration_minutes, total_marks, passing_marks, negative_marking_per_question, instructions, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        title, description || null, course_id, semester_id, teacherId,
        start_time, end_time, duration_minutes,
        total_marks || 100.00, passing_marks || 40.00, negative_marking_per_question || 0.00,
        instructions || null
      ]
    );

    const examId = examResult.insertId;

    // Attach questions if provided
    if (question_ids && Array.isArray(question_ids) && question_ids.length > 0) {
      for (let order = 0; order < question_ids.length; order++) {
        const qId = question_ids[order];
        await conn.query(
          'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES (?, ?, ?)',
          [examId, qId, order + 1]
        );
      }
    }

    await conn.commit();

    await logAudit({
      userId: req.user.id,
      action: 'TEACHER_CREATED_EXAM',
      entityType: 'exams',
      entityId: examId,
      details: { title, course_id, questionsCount: question_ids ? question_ids.length : 0 },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Exam created successfully', examId });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

async function updateExamQuestions(req, res) {
  const { examId } = req.params;
  const { question_ids } = req.body;

  if (!Array.isArray(question_ids)) {
    return res.status(400).json({ success: false, error: 'question_ids array required.' });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);

    for (let order = 0; order < question_ids.length; order++) {
      await conn.query(
        'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES (?, ?, ?)',
        [examId, question_ids[order], order + 1]
      );
    }

    await conn.commit();
    return res.json({ success: true, message: 'Questions updated for examination' });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

// 4. Submissions & Manual Descriptive Evaluation
async function getExamSubmissions(req, res) {
  const { examId } = req.params;
  try {
    const submissions = await query(`
      SELECT a.id AS attempt_id, a.start_time, a.submit_time, a.status AS attempt_status,
             a.total_score, a.percentage, a.is_passed,
             s.id AS student_id, s.roll_number, u.full_name AS student_name, u.email AS student_email,
             r.grade, r.rank_in_exam,
             (SELECT COUNT(*) FROM student_answers sa JOIN questions q ON sa.question_id = q.id WHERE sa.attempt_id = a.id AND q.question_type = 'descriptive' AND sa.is_evaluated = 0) AS pending_descriptive_count
      FROM attempts a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN results r ON a.id = r.attempt_id
      WHERE a.exam_id = ? AND a.status IN ('submitted', 'evaluated', 'auto_submitted')
      ORDER BY a.submit_time DESC
    `, [examId]);

    const [examInfo] = await query('SELECT id, title, total_marks, passing_marks, is_published_results FROM exams WHERE id = ?', [examId]);

    return res.json({ success: true, exam: examInfo, submissions });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getAttemptDetailsForEvaluation(req, res) {
  const { attemptId } = req.params;
  try {
    const [attempt] = await query(`
      SELECT a.*, e.title AS exam_title, e.total_marks AS exam_total_marks, e.passing_marks,
             s.roll_number, u.full_name AS student_name
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE a.id = ?
    `, [attemptId]);

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    // Fetch answers with full question context & options
    const answers = await query(`
      SELECT sa.*, q.question_text, q.question_type, q.marks AS max_question_marks, q.negative_marks, q.explanation
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      WHERE sa.attempt_id = ?
      ORDER BY q.id ASC
    `, [attemptId]);

    // Fetch options for each question
    for (const ans of answers) {
      ans.options = await query('SELECT * FROM question_options WHERE question_id = ? ORDER BY option_key ASC', [ans.question_id]);
    }

    return res.json({ success: true, attempt, answers });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function evaluateDescriptiveAnswer(req, res) {
  const { attemptId } = req.params;
  const { question_id, marks_obtained, teacher_feedback } = req.body;

  if (question_id === undefined || marks_obtained === undefined) {
    return res.status(400).json({ success: false, error: 'question_id and marks_obtained required.' });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Update individual answer
    await conn.query(
      `UPDATE student_answers 
       SET marks_obtained = ?, teacher_feedback = ?, is_evaluated = 1, updated_at = NOW()
       WHERE attempt_id = ? AND question_id = ?`,
      [marks_obtained, teacher_feedback || null, attemptId, question_id]
    );

    // Check if any descriptive questions remain unevaluated for this attempt
    const [pending] = await conn.query(
      `SELECT COUNT(*) AS remaining 
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.attempt_id = ? AND q.question_type = 'descriptive' AND sa.is_evaluated = 0`,
      [attemptId]
    );

    // Recalculate total score
    const [scoreRow] = await conn.query(
      'SELECT SUM(marks_obtained) AS new_total FROM student_answers WHERE attempt_id = ?',
      [attemptId]
    );
    const newTotal = Math.max(0, parseFloat(scoreRow[0].new_total || 0));

    // Get exam max marks and passing marks
    const [examRow] = await conn.query(
      'SELECT e.total_marks, e.passing_marks, a.exam_id, a.student_id FROM attempts a JOIN exams e ON a.exam_id = e.id WHERE a.id = ?',
      [attemptId]
    );
    const maxMarks = parseFloat(examRow[0].total_marks);
    const passingMarks = parseFloat(examRow[0].passing_marks);
    const percentage = Math.round((newTotal / maxMarks) * 10000) / 100;
    const isPassed = newTotal >= passingMarks ? 1 : 0;

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const newStatus = pending[0].remaining === 0 ? 'evaluated' : 'submitted';

    // Update attempt
    await conn.query(
      'UPDATE attempts SET total_score = ?, percentage = ?, is_passed = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [newTotal, percentage, isPassed, newStatus, attemptId]
    );

    // Update results table
    await conn.query(
      `UPDATE results 
       SET obtained_marks = ?, percentage = ?, is_passed = ?, grade = ?
       WHERE attempt_id = ?`,
      [newTotal, percentage, isPassed, grade, attemptId]
    );

    await conn.commit();

    return res.json({
      success: true,
      message: 'Descriptive answer evaluated successfully',
      attemptStatus: newStatus,
      newTotal,
      percentage,
      grade,
      isPassed
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

// 5. Publish Results for Examination
async function publishExamResults(req, res) {
  const { examId } = req.params;
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Calculate dense ranks across all attempts for this exam
    await conn.query(`
      UPDATE results r
      JOIN (
        SELECT attempt_id, DENSE_RANK() OVER (ORDER BY obtained_marks DESC) as calculated_rank
        FROM results
        WHERE exam_id = ?
      ) ranked ON r.attempt_id = ranked.attempt_id
      SET r.rank_in_exam = ranked.calculated_rank, r.published_at = NOW()
      WHERE r.exam_id = ?
    `, [examId, examId]);

    // Set exam status to published results
    await conn.query(
      'UPDATE exams SET is_published_results = 1, updated_at = NOW() WHERE id = ?',
      [examId]
    );

    await conn.commit();

    await logAudit({
      userId: req.user.id,
      action: 'TEACHER_PUBLISHED_EXAM_RESULTS',
      entityType: 'exams',
      entityId: examId,
      details: { published: true },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Examination results and ranks published successfully!' });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  getMyCourses,
  getQuestions,
  createQuestion,
  deleteQuestion,
  getMyExams,
  createExam,
  updateExamQuestions,
  getExamSubmissions,
  getAttemptDetailsForEvaluation,
  evaluateDescriptiveAnswer,
  publishExamResults
};

