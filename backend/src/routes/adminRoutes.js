// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Protect all admin routes with admin role authorization
router.use(authenticateToken, authorizeRoles('admin'));

// System stats
router.get('/stats', adminController.getSystemStats);

// Students
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);

// Teachers
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);

// Academic master data
router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.createDepartment);
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.get('/semesters', adminController.getSemesters);

// Exams management
router.get('/exams', adminController.getAllExams);
router.put('/exams/:examId/status', adminController.updateExamStatus);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;

