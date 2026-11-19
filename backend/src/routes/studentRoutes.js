// backend/src/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken, authorizeRoles('student', 'admin'));

router.get('/dashboard', studentController.getStudentDashboard);
router.get('/exams/available', studentController.getAvailableExams);
router.post('/exams/:examId/register', studentController.registerForExam);
router.get('/results', studentController.getMyResults);
router.get('/results/:resultId', studentController.getResultDetail);
router.get('/analytics', studentController.getStudentAnalytics);

module.exports = router;

