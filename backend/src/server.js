// backend/src/server.js
// EXAMORA: Smart Online Examination & Assessment Management System Server

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examRoutes = require('./routes/examRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dbmsLabRoutes = require('./routes/dbmsLabRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Check
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'online',
    system: 'EXAMORA Smart Online Examination System',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dbms-lab', dbmsLabRoutes);

// Catch-all 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`  EXAMORA Backend Server running on port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);

    const dbCheck = await testConnection();
    if (dbCheck.connected) {
      console.log(`  [MySQL Connected] Host: ${dbCheck.host} | DB: ${dbCheck.database} | Version: ${dbCheck.version}`);
    } else {
      console.warn(`  [MySQL Warning] Could not connect to MySQL: ${dbCheck.error}`);
      console.warn(`  Please ensure MySQL Server 8.0 is running and credentials in backend/.env are configured.`);
    }
    console.log(`=======================================================`);
  });
}

module.exports = app;

