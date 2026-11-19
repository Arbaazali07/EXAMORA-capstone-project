// backend/src/routes/examRoutes.js
const express = require('express');
const router = express.Router();
const examEngineController = require('../controllers/examEngineController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken, authorizeRoles('student', 'admin'));

router.post('/:examId/start', examEngineController.startExamAttempt);
router.get('/:attemptId/state', examEngineController.getExamState);
router.post('/:attemptId/save-answer', examEngineController.saveQuestionAnswer);
router.post('/:attemptId/submit', examEngineController.submitExamAttempt);

module.exports = router;

