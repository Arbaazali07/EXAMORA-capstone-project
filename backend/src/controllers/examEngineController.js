// backend/src/controllers/examEngineController.js
// High-Reliability Server-Validated Examination Engine with ACID Transaction Submission

const { query, getConnection } = require('../config/db');
const { evaluateQuestionAnswer } = require('../utils/evaluator');
const { logAudit } = require('../utils/auditLogger');

// 1. Start Examination Attempt
async function startExamAttempt(req, res) {
  const { examId } = req.params;
  const studentId = req.user.student_id;

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Fetch exam details with lock
    const [exams] = await conn.query(
      'SELECT * FROM exams WHERE id = ? FOR UPDATE',
      [examId]
    );

    if (exams.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Examination not found.' });
    }

    const exam = exams[0];
    const now = new Date();

    // Check status
    if (exam.status !== 'published' && exam.status !== 'ongoing') {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        error: `Examination is not accessible. Current status is '${exam.status}'.`
      });
    }

    // Check time window (with 5 minute pre-start tolerance if needed, or strict start time)
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now > endTime) {
      await conn.rollback();
      return res.status(403).json({
        success: false,
        error: 'Examination window has expired. Submissions are no longer accepted.'
      });
    }

    // Check existing attempt
    const [existingAttempts] = await conn.query(
      'SELECT id, status, start_time FROM attempts WHERE exam_id = ? AND student_id = ?',
      [examId, studentId]
    );

    if (existingAttempts.length > 0) {
      const att = existingAttempts[0];
      if (att.status !== 'in_progress') {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          error: `You have already completed or submitted this examination (Status: ${att.status}). Multiple attempts are prohibited.`,
          attemptId: att.id
        });
      }

      // Existing active attempt - return it
      await conn.commit();
      return res.json({
        success: true,
        message: 'Resuming active examination session',
        attemptId: att.id
      });
    }

    // Create new attempt
    const [attemptResult] = await conn.query(
      `INSERT INTO attempts (exam_id, student_id, start_time, status, ip_address)
       VALUES (?, ?, NOW(), 'in_progress', ?)`,
      [examId, studentId, req.ip || '127.0.0.1']
    );

    const attemptId = attemptResult.insertId;

    // Pre-populate empty student_answers rows for all exam questions for fast palette updates
    const [examQRows] = await conn.query(
      'SELECT question_id FROM exam_questions WHERE exam_id = ? ORDER BY question_order ASC',
      [examId]
    );

    for (const eq of examQRows) {
      await conn.query(
        'INSERT INTO student_answers (attempt_id, question_id) VALUES (?, ?)',
        [attemptId, eq.question_id]
      );
    }

    await conn.commit();

    await logAudit({
      userId: req.user.id,
      action: 'STUDENT_STARTED_EXAM',
      entityType: 'attempts',
      entityId: attemptId,
      details: { exam_id: examId, title: exam.title },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Examination attempt started successfully',
      attemptId
    });
  } catch (error) {
    await conn.rollback();
    console.error('Start Exam Attempt Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

// 2. Fetch Active Examination State (Questions, Answers, and Remaining Timer)
async function getExamState(req, res) {
  const { attemptId } = req.params;
  const studentId = req.user.student_id;

  try {
    // Verify attempt ownership and active status
    const [attempts] = await query(`
      SELECT a.*, e.title AS exam_title, e.instructions, e.duration_minutes, e.total_marks,
             e.passing_marks, e.negative_marking_per_question, e.start_time AS exam_start_time,
             e.end_time AS exam_end_time, c.course_code, c.course_name
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE a.id = ? AND a.student_id = ?
    `, [attemptId, studentId]);

    if (attempts.length === 0) {
      return res.status(404).json({ success: false, error: 'Examination attempt session not found.' });
    }

    const attempt = attempts[0];

    // Calculate server-authoritative remaining time
    const startMs = new Date(attempt.start_time).getTime();
    const durationMs = attempt.duration_minutes * 60 * 1000;
    const nowMs = Date.now();
    const examEndMs = new Date(attempt.exam_end_time).getTime();

    // Time remaining based on duration:
    const remainingByDuration = Math.max(0, Math.floor((startMs + durationMs - nowMs) / 1000));
    // Time remaining based on exam hard deadline:
    const remainingByExamEnd = Math.max(0, Math.floor((examEndMs - nowMs) / 1000));

    const remainingSeconds = Math.min(remainingByDuration, remainingByExamEnd);

    // Fetch questions mapped to this exam
    const questions = await query(`
      SELECT q.id, q.question_text, q.question_type, q.marks, q.negative_marks, q.difficulty, q.topic,
             eq.question_order, eq.custom_marks, eq.custom_negative_marks
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.question_order ASC
    `, [attempt.exam_id]);

    // Fetch options for each question - NOTE: is_correct is intentionally excluded for security!
    if (questions.length > 0) {
      const qIds = questions.map(q => q.id);
      const options = await query(
        `SELECT id, question_id, option_key, option_text 
         FROM question_options 
         WHERE question_id IN (${qIds.join(',')}) 
         ORDER BY option_key ASC`
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

    // Fetch student's currently saved answers
    const answers = await query(
      'SELECT question_id, selected_options, descriptive_answer, is_marked_for_review FROM student_answers WHERE attempt_id = ?',
      [attemptId]
    );

    const answersMap = {};
    answers.forEach(ans => {
      answersMap[ans.question_id] = {
        selectedOptions: ans.selected_options || [],
        descriptiveAnswer: ans.descriptive_answer || '',
        isMarkedForReview: Boolean(ans.is_marked_for_review)
      };
    });

    return res.json({
      success: true,
      attempt: {
        id: attempt.id,
        examId: attempt.exam_id,
        examTitle: attempt.exam_title,
        courseCode: attempt.course_code,
        courseName: attempt.course_name,
        instructions: attempt.instructions,
        durationMinutes: attempt.duration_minutes,
        totalMarks: attempt.total_marks,
        negativeMarking: attempt.negative_marking_per_question,
        status: attempt.status,
        startTime: attempt.start_time,
        serverTime: new Date().toISOString(),
        remainingSeconds
      },
      questions,
      savedAnswers: answersMap
    });
  } catch (error) {
    console.error('getExamState Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 3. Save Question Answer (Autosave / Manual Save & Next)
async function saveQuestionAnswer(req, res) {
  const { attemptId } = req.params;
  const { questionId, selectedOptions, descriptiveAnswer, isMarkedForReview } = req.body;
  const studentId = req.user.student_id;

  try {
    // Verify active attempt
    const [att] = await query(
      'SELECT id, status, start_time, exam_id FROM attempts WHERE id = ? AND student_id = ?',
      [attemptId, studentId]
    );

    if (!att || att.status !== 'in_progress') {
      return res.status(403).json({
        success: false,
        error: 'Cannot save answers. Attempt session is not active.'
      });
    }

    // Check timer validity
    const [exam] = await query('SELECT duration_minutes, end_time FROM exams WHERE id = ?', [att.exam_id]);
    const startMs = new Date(att.start_time).getTime();
    const durationMs = (exam.duration_minutes + 2) * 60 * 1000; // 2 min grace tolerance
    const nowMs = Date.now();

    if (nowMs > startMs + durationMs) {
      return res.status(403).json({
        success: false,
        error: 'Time expired. Answers can no longer be recorded.'
      });
    }

    const optionsJson = selectedOptions ? JSON.stringify(selectedOptions) : null;
    const marked = isMarkedForReview ? 1 : 0;

    await query(
      `INSERT INTO student_answers (attempt_id, question_id, selected_options, descriptive_answer, is_marked_for_review)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         selected_options = VALUES(selected_options),
         descriptive_answer = VALUES(descriptive_answer),
         is_marked_for_review = VALUES(is_marked_for_review),
         updated_at = NOW()`,
      [attemptId, questionId, optionsJson, descriptiveAnswer || null, marked]
    );

    return res.json({ success: true, message: 'Answer saved' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 4. Submit Examination Attempt (Atomic MySQL Transaction)
async function submitExamAttempt(req, res) {
  const { attemptId } = req.params;
  const { isAutoSubmit = false } = req.body;
  const studentId = req.user.student_id;

  const conn = await getConnection();
  try {
    // BEGIN TRANSACTION
    await conn.beginTransaction();

    // 1. Lock and validate attempt
    const [attempts] = await conn.query(
      'SELECT a.*, e.total_marks, e.passing_marks, e.negative_marking_per_question FROM attempts a JOIN exams e ON a.exam_id = e.id WHERE a.id = ? AND a.student_id = ? FOR UPDATE',
      [attemptId, studentId]
    );

    if (attempts.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Attempt not found.' });
    }

    const attempt = attempts[0];

    if (attempt.status !== 'in_progress') {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        error: `Attempt has already been finalized with status '${attempt.status}'.`
      });
    }

    // 2. Fetch all questions in this exam with correct answers for grading
    const [questions] = await conn.query(`
      SELECT q.id, q.question_type, q.marks, q.negative_marks,
             eq.custom_marks, eq.custom_negative_marks
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
    `, [attempt.exam_id]);

    const qIds = questions.map(q => q.id);
    let options = [];
    if (qIds.length > 0) {
      const [optRows] = await conn.query(
        `SELECT question_id, option_key, is_correct FROM question_options WHERE question_id IN (${qIds.join(',')})`
      );
      options = optRows;
    }

    const optionsByQ = {};
    options.forEach(opt => {
      if (!optionsByQ[opt.question_id]) optionsByQ[opt.question_id] = [];
      optionsByQ[opt.question_id].push(opt);
    });

    // 3. Fetch all student answers
    const [studentAnswers] = await conn.query(
      'SELECT question_id, selected_options, descriptive_answer FROM student_answers WHERE attempt_id = ?',
      [attemptId]
    );

    const answersByQ = {};
    studentAnswers.forEach(ans => {
      answersByQ[ans.question_id] = ans;
    });

    // 4. Calculate Objective Marks
    let totalScore = 0.00;
    let attemptedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let hasDescriptiveQuestions = false;

    for (const q of questions) {
      const ans = answersByQ[q.id];
      const qOptions = optionsByQ[q.id] || [];
      const correctOpts = qOptions.filter(o => o.is_correct === 1);

      let parsedSelection = null;
      if (ans && ans.selected_options) {
        try {
          parsedSelection = typeof ans.selected_options === 'string' ? JSON.parse(ans.selected_options) : ans.selected_options;
        } catch {
          parsedSelection = ans.selected_options;
        }
      }

      if (q.question_type === 'descriptive') {
        hasDescriptiveQuestions = true;
        const textAns = ans ? (ans.descriptive_answer || '').trim() : '';
        if (textAns.length > 0) attemptedCount++;
        // Leaves marks_obtained at 0 until teacher manually evaluates
      } else {
        // Objective evaluation
        const evalResult = evaluateQuestionAnswer(q, correctOpts, parsedSelection, attempt.negative_marking_per_question);

        if (evalResult.attempted) {
          attemptedCount++;
          if (evalResult.isCorrect) {
            correctCount++;
          } else {
            incorrectCount++;
          }
          totalScore += evalResult.marksObtained;
        }

        // Update individual question score in student_answers
        await conn.query(
          `UPDATE student_answers 
           SET marks_obtained = ?, is_evaluated = 1, updated_at = NOW()
           WHERE attempt_id = ? AND question_id = ?`,
          [evalResult.marksObtained, attemptId, q.id]
        );
      }
    }

    // Clamp total score >= 0
    totalScore = Math.max(0, totalScore);
    const maxMarks = parseFloat(attempt.total_marks);
    const passingMarks = parseFloat(attempt.passing_marks);
    const percentage = Math.round((totalScore / maxMarks) * 10000) / 100;
    const isPassed = totalScore >= passingMarks ? 1 : 0;
    const unattemptedCount = Math.max(0, questions.length - attemptedCount);

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const finalStatus = isAutoSubmit ? 'auto_submitted' : (hasDescriptiveQuestions ? 'submitted' : 'evaluated');

    // 5. Update Attempt Status
    await conn.query(
      `UPDATE attempts 
       SET submit_time = NOW(), status = ?, total_score = ?, percentage = ?, is_passed = ?, updated_at = NOW()
       WHERE id = ?`,
      [finalStatus, totalScore, percentage, isPassed, attemptId]
    );

    // 6. Insert / Update Results row
    await conn.query(
      `INSERT INTO results (
         attempt_id, exam_id, student_id, total_questions, attempted_questions,
         correct_answers, incorrect_answers, unattempted_questions, total_marks,
         obtained_marks, percentage, is_passed, grade
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_questions = VALUES(total_questions),
         attempted_questions = VALUES(attempted_questions),
         correct_answers = VALUES(correct_answers),
         incorrect_answers = VALUES(incorrect_answers),
         unattempted_questions = VALUES(unattempted_questions),
         total_marks = VALUES(total_marks),
         obtained_marks = VALUES(obtained_marks),
         percentage = VALUES(percentage),
         is_passed = VALUES(is_passed),
         grade = VALUES(grade)`,
      [
        attemptId, attempt.exam_id, studentId, questions.length, attemptedCount,
        correctCount, incorrectCount, unattemptedCount, maxMarks,
        totalScore, percentage, isPassed, grade
      ]
    );

    // COMMIT TRANSACTION
    await conn.commit();

    await logAudit({
      userId: req.user.id,
      action: isAutoSubmit ? 'STUDENT_AUTO_SUBMITTED_EXAM' : 'STUDENT_SUBMITTED_EXAM',
      entityType: 'attempts',
      entityId: attemptId,
      details: { totalScore, percentage, isPassed, attemptedCount, autoSubmit: isAutoSubmit },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: isAutoSubmit ? 'Examination time expired. Answers automatically submitted.' : 'Examination submitted successfully!',
      result: {
        attemptId,
        status: finalStatus,
        totalQuestions: questions.length,
        attemptedCount,
        correctCount,
        incorrectCount,
        unattemptedCount,
        totalMarks: maxMarks,
        obtainedMarks: totalScore,
        percentage,
        isPassed,
        grade,
        hasDescriptiveQuestions
      }
    });
  } catch (error) {
    // ROLLBACK TRANSACTION ON FAILURE
    await conn.rollback();
    console.error('Exam Submission Transaction Rollback:', error);
    return res.status(500).json({
      success: false,
      error: 'Submission transaction failed: ' + error.message
    });
  } finally {
    conn.release();
  }
}

module.exports = {
  startExamAttempt,
  getExamState,
  saveQuestionAnswer,
  submitExamAttempt
};

