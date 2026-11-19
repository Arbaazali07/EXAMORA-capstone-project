// backend/src/routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Allow both teachers and admins to access teacher features
router.use(authenticateToken, authorizeRoles('teacher', 'admin'));

// Courses
router.get('/courses', teacherController.getMyCourses);

// Question Bank
router.get('/questions', teacherController.getQuestions);
router.post('/questions', teacherController.createQuestion);
router.delete('/questions/:questionId', teacherController.deleteQuestion);

// Examinations
router.get('/exams', teacherController.getMyExams);
router.post('/exams', teacherController.createExam);
router.put('/exams/:examId/questions', teacherController.updateExamQuestions);
router.post('/exams/:examId/publish-results', teacherController.publishExamResults);

// Submissions & Grading
router.get('/exams/:examId/submissions', teacherController.getExamSubmissions);
router.get('/submissions/:attemptId', teacherController.getAttemptDetailsForEvaluation);
router.post('/submissions/:attemptId/evaluate', teacherController.evaluateDescriptiveAnswer);

module.exports = router;

