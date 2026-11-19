// backend/src/controllers/adminController.js
const bcrypt = require('bcryptjs');
const { query, getConnection } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. System Statistics & Overview
async function getSystemStats(req, res) {
  try {
    const [counts] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM teachers) AS total_teachers,
        (SELECT COUNT(*) FROM courses) AS total_courses,
        (SELECT COUNT(*) FROM exams) AS total_exams,
        (SELECT COUNT(*) FROM attempts WHERE status IN ('submitted', 'evaluated', 'auto_submitted')) AS total_submissions,
        (SELECT COUNT(*) FROM questions) AS total_questions,
        (SELECT ROUND(AVG(percentage), 2) FROM results) AS overall_avg_percentage,
        (SELECT ROUND((SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) FROM results) AS overall_pass_rate
    `);

    // Department-wise distribution
    const deptDistribution = await query(`
      SELECT d.dept_code, d.dept_name, 
             COUNT(DISTINCT s.id) AS student_count,
             COUNT(DISTINCT t.id) AS teacher_count,
             COUNT(DISTINCT c.id) AS course_count
      FROM departments d
      LEFT JOIN students s ON d.id = s.department_id
      LEFT JOIN teachers t ON d.id = t.department_id
      LEFT JOIN courses c ON d.id = c.department_id
      GROUP BY d.id, d.dept_code, d.dept_name
    `);

    // Recent 5 examinations
    const recentExams = await query(`
      SELECT e.id, e.title, c.course_code, u.full_name AS instructor_name, e.start_time, e.status,
             (SELECT COUNT(*) FROM attempts WHERE exam_id = e.id) AS attempt_count
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN teachers t ON e.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: counts,
      deptDistribution,
      recentExams
    });
  } catch (error) {
    console.error('Admin getSystemStats error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 2. Student Management
async function getStudents(req, res) {
  try {
    const { department_id, semester_id, search } = req.query;
    let sql = `
      SELECT s.id, s.user_id, s.roll_number, s.admission_year, s.phone,
             u.username, u.email, u.full_name, u.is_active, u.created_at,
             d.id AS department_id, d.dept_code, d.dept_name,
             sem.id AS semester_id, sem.semester_name,
             (SELECT COUNT(*) FROM attempts WHERE student_id = s.id) AS total_attempts,
             (SELECT ROUND(AVG(percentage), 2) FROM results WHERE student_id = s.id) AS avg_percentage
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.department_id = d.id
      JOIN semesters sem ON s.semester_id = sem.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      sql += ' AND s.department_id = ?';
      params.push(department_id);
    }
    if (semester_id) {
      sql += ' AND s.semester_id = ?';
      params.push(semester_id);
    }
    if (search) {
      sql += ' AND (u.full_name LIKE ? OR s.roll_number LIKE ? OR u.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY s.roll_number ASC';
    const students = await query(sql, params);
    return res.json({ success: true, count: students.length, students });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createStudent(req, res) {
  const { username, email, password, full_name, roll_number, department_id, semester_id, admission_year, phone } = req.body;
  if (!username || !email || !password || !full_name || !roll_number || !department_id || !semester_id) {
    return res.status(400).json({ success: false, error: 'Required fields missing.' });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, error: 'Username or email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [uRes] = await conn.query(
      'INSERT INTO users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, 'student', full_name]
    );

    const [sRes] = await conn.query(
      'INSERT INTO students (user_id, roll_number, department_id, semester_id, admission_year, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [uRes.insertId, roll_number, department_id, semester_id, admission_year || new Date().getFullYear(), phone || null]
    );

    await conn.commit();

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_CREATED_STUDENT',
      entityType: 'students',
      entityId: sRes.insertId,
      details: { roll_number, username },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Student created successfully', studentId: sRes.insertId });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

// 3. Teacher Management
async function getTeachers(req, res) {
  try {
    const { department_id, search } = req.query;
    let sql = `
      SELECT t.id, t.user_id, t.employee_id, t.designation, t.qualification, t.phone,
             u.username, u.email, u.full_name, u.is_active,
             d.id AS department_id, d.dept_code, d.dept_name,
             (SELECT COUNT(*) FROM exams WHERE teacher_id = t.id) AS total_exams_created,
             (SELECT COUNT(*) FROM questions WHERE created_by_teacher_id = t.id) AS total_questions_authored
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      JOIN departments d ON t.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      sql += ' AND t.department_id = ?';
      params.push(department_id);
    }
    if (search) {
      sql += ' AND (u.full_name LIKE ? OR t.employee_id LIKE ? OR u.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY u.full_name ASC';
    const teachers = await query(sql, params);
    return res.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createTeacher(req, res) {
  const { username, email, password, full_name, employee_id, department_id, designation, qualification, phone } = req.body;
  if (!username || !email || !password || !full_name || !employee_id || !department_id) {
    return res.status(400).json({ success: false, error: 'Required fields missing.' });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, error: 'Username or email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [uRes] = await conn.query(
      'INSERT INTO users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, 'teacher', full_name]
    );

    const [tRes] = await conn.query(
      'INSERT INTO teachers (user_id, employee_id, department_id, designation, qualification, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [uRes.insertId, employee_id, department_id, designation || 'Assistant Professor', qualification || 'M.Tech / Ph.D', phone || null]
    );

    await conn.commit();

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_CREATED_TEACHER',
      entityType: 'teachers',
      entityId: tRes.insertId,
      details: { employee_id, username },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Teacher created successfully', teacherId: tRes.insertId });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    conn.release();
  }
}

// 4. Departments, Courses, Semesters Management
async function getDepartments(req, res) {
  try {
    const depts = await query('SELECT * FROM departments ORDER BY dept_code ASC');
    return res.json({ success: true, departments: depts });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createDepartment(req, res) {
  const { dept_code, dept_name, description } = req.body;
  try {
    const result = await query(
      'INSERT INTO departments (dept_code, dept_name, description) VALUES (?, ?, ?)',
      [dept_code.toUpperCase(), dept_name, description || null]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Department created' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getCourses(req, res) {
  try {
    const courses = await query(`
      SELECT c.*, d.dept_code, d.dept_name,
             (SELECT COUNT(*) FROM exams WHERE course_id = c.id) AS exam_count,
             (SELECT COUNT(*) FROM questions WHERE course_id = c.id) AS question_count
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      ORDER BY c.course_code ASC
    `);
    return res.json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function createCourse(req, res) {
  const { course_code, course_name, department_id, credits, description } = req.body;
  try {
    const result = await query(
      'INSERT INTO courses (course_code, course_name, department_id, credits, description) VALUES (?, ?, ?, ?, ?)',
      [course_code.toUpperCase(), course_name, department_id, credits || 3, description || null]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Course created' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getSemesters(req, res) {
  try {
    const semesters = await query('SELECT * FROM semesters ORDER BY semester_code ASC');
    return res.json({ success: true, semesters });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 5. Examinations Overview & Status Control
async function getAllExams(req, res) {
  try {
    const exams = await query(`
      SELECT e.*, c.course_code, c.course_name, d.dept_name, sem.semester_name,
             u.full_name AS instructor_name,
             (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.id) AS question_count,
             (SELECT COUNT(*) FROM registrations WHERE exam_id = e.id) AS registered_count,
             (SELECT COUNT(*) FROM attempts WHERE exam_id = e.id) AS attempt_count
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN semesters sem ON e.semester_id = sem.id
      JOIN teachers t ON e.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      ORDER BY e.start_time DESC
    `);
    return res.json({ success: true, exams });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updateExamStatus(req, res) {
  const { examId } = req.params;
  const { status, is_published_results } = req.body;

  try {
    await query(
      'UPDATE exams SET status = COALESCE(?, status), is_published_results = COALESCE(?, is_published_results), updated_at = NOW() WHERE id = ?',
      [status, is_published_results !== undefined ? (is_published_results ? 1 : 0) : null, examId]
    );

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_UPDATED_EXAM_STATUS',
      entityType: 'exams',
      entityId: examId,
      details: { status, is_published_results },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Examination updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// 6. Audit Logs
async function getAuditLogs(req, res) {
  try {
    const logs = await query(`
      SELECT a.*, u.username, u.full_name, u.role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getSystemStats,
  getStudents,
  createStudent,
  getTeachers,
  createTeacher,
  getDepartments,
  createDepartment,
  getCourses,
  createCourse,
  getSemesters,
  getAllExams,
  updateExamStatus,
  getAuditLogs
};

