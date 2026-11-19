// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getConnection } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'examora_capstone_jwt_super_secret_key_2026_university_dbms';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register a new Student
async function register(req, res) {
  const { username, email, password, full_name, roll_number, department_id, semester_id, phone } = req.body;

  if (!username || !email || !password || !full_name || !roll_number || !department_id || !semester_id) {
    return res.status(400).json({
      success: false,
      error: 'All fields (username, email, password, full_name, roll_number, department_id, semester_id) are required.'
    });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Check if username or email already exists
    const [existingUsers] = await conn.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existingUsers.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        error: 'Username or email already in use.'
      });
    }

    // Check if roll number already exists
    const [existingRoll] = await conn.query(
      'SELECT id FROM students WHERE roll_number = ?',
      [roll_number]
    );
    if (existingRoll.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        error: 'Roll number already registered.'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await conn.query(
      'INSERT INTO users (username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, 'student', full_name]
    );
    const userId = userResult.insertId;

    // Insert student profile
    const currentYear = new Date().getFullYear();
    const [studentResult] = await conn.query(
      'INSERT INTO students (user_id, roll_number, department_id, semester_id, admission_year, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, roll_number, department_id, semester_id, currentYear, phone || null]
    );

    await conn.commit();

    await logAudit({
      userId,
      action: 'USER_REGISTERED',
      entityType: 'users',
      entityId: userId,
      details: { role: 'student', roll_number },
      ipAddress: req.ip
    });

    // Generate token
    const token = jwt.sign({ id: userId, username, role: 'student' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      message: 'Student registration successful',
      token,
      user: {
        id: userId,
        username,
        email,
        role: 'student',
        full_name,
        student_id: studentResult.insertId,
        roll_number,
        department_id,
        semester_id
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Registration Transaction Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed due to a server error: ' + error.message
    });
  } finally {
    conn.release();
  }
}

// User Login (Admin, Teacher, Student)
async function login(req, res) {
  const { identifier, password } = req.body; // identifier can be username or email

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide username/email and password.'
    });
  }

  try {
    const users = await query(
      'SELECT id, username, email, password_hash, role, full_name, avatar_url, is_active FROM users WHERE username = ? OR email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Your account is currently disabled. Please contact administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Incorrect password.'
      });
    }

    // Attach role-specific metadata
    let profileData = {};
    if (user.role === 'student') {
      const s = await query(
        `SELECT s.id AS student_id, s.roll_number, s.admission_year, s.department_id, s.semester_id,
                d.dept_code, d.dept_name, sem.semester_name 
         FROM students s
         JOIN departments d ON s.department_id = d.id
         JOIN semesters sem ON s.semester_id = sem.id
         WHERE s.user_id = ?`,
        [user.id]
      );
      if (s.length > 0) profileData = s[0];
    } else if (user.role === 'teacher') {
      const t = await query(
        `SELECT t.id AS teacher_id, t.employee_id, t.designation, t.qualification, t.department_id,
                d.dept_code, d.dept_name
         FROM teachers t
         JOIN departments d ON t.department_id = d.id
         WHERE t.user_id = ?`,
        [user.id]
      );
      if (t.length > 0) profileData = t[0];
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'users',
      entityId: user.id,
      details: { role: user.role },
      ipAddress: req.ip
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        ...profileData
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed: ' + error.message
    });
  }
}

// Get Current User Profile
async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  register,
  login,
  getMe
};

