// backend/src/routes/dbmsLabRoutes.js
const express = require('express');
const router = express.Router();
const dbmsLabController = require('../controllers/dbmsLabController');
const { authenticateToken } = require('../middleware/auth');

// Laboratory is available for all authenticated users (students, teachers, admins, faculty examiners)
router.use(authenticateToken);

router.get('/catalog', dbmsLabController.getCatalog);
router.post('/execute', dbmsLabController.executeQuery);

module.exports = router;

