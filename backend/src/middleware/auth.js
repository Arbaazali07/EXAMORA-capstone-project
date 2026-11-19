// backend/src/middleware/auth.js
// JWT Authentication and Role-Based Access Control (RBAC) Middleware

const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'examora_capstone_jwt_super_secret_key_2026_university_dbms';

// Middleware to authenticate JWT token
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired session token'
        });
      }

      // Check if user is still active in database
      const users = await query(
        'SELECT id, username, email, role, full_name, is_active FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User account not found'
        });
      }

      const user = users[0];
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'User account has been deactivated'
        });
      }

      // If user is a student, attach student profile details
      if (user.role === 'student') {
        const studentRows = await query(
          'SELECT id AS student_id, roll_number, department_id, semester_id FROM students WHERE user_id = ?',
          [user.id]
        );
        if (studentRows.length > 0) {
          user.student_id = studentRows[0].student_id;
          user.roll_number = studentRows[0].roll_number;
          user.department_id = studentRows[0].department_id;
          user.semester_id = studentRows[0].semester_id;
        }
      }

      // If user is a teacher, attach teacher profile details
      if (user.role === 'teacher') {
        const teacherRows = await query(
          'SELECT id AS teacher_id, employee_id, department_id, designation FROM teachers WHERE user_id = ?',
          [user.id]
        );
        if (teacherRows.length > 0) {
          user.teacher_id = teacherRows[0].teacher_id;
          user.employee_id = teacherRows[0].employee_id;
          user.department_id = teacherRows[0].department_id;
          user.designation = teacherRows[0].designation;
        }
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failure'
    });
  }
}

// Middleware to authorize specific user roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in first.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};

