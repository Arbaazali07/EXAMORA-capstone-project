// backend/src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/overview', analyticsController.getOverviewAnalytics);
router.get('/exam/:examId', analyticsController.getExamAnalytics);

module.exports = router;

