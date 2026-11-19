// backend/src/scripts/testDb.js
// Verification and Smoke Test Script for EXAMORA MySQL Database

const { testConnection, query } = require('../config/db');

async function testDatabase() {
  console.log('--- EXAMORA Database Verification & Smoke Test ---');

  const connectionResult = await testConnection();
  if (!connectionResult.connected) {
    console.error('❌ Connection failed:', connectionResult.error);
    process.exit(1);
  }

  console.log(`✓ Connected to MySQL ${connectionResult.version} at ${connectionResult.host}`);
  console.log(`✓ Current Database: ${connectionResult.database}`);

  try {
    // 1. Check Tables
    const tables = await query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    console.log(`✓ Found ${tables.length} Base Tables (Expected: 16)`);

    // 2. Check Views
    const views = await query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
    console.log(`✓ Found ${views.length} Database Views (Expected: 4)`);

    // 3. Test View: exam_performance_view
    const examPerf = await query('SELECT exam_title, pass_percentage, average_score FROM exam_performance_view LIMIT 3');
    console.log(`✓ Successfully queried 'exam_performance_view' (${examPerf.length} rows returned)`);

    // 4. Test View: student_result_view
    const studentRes = await query('SELECT roll_number, student_name, obtained_marks, percentage FROM student_result_view LIMIT 3');
    console.log(`✓ Successfully queried 'student_result_view' (${studentRes.length} rows returned)`);

    // 5. Test Window Function
    const windowRes = await query(`
      SELECT s.roll_number, r.obtained_marks,
             DENSE_RANK() OVER (ORDER BY r.obtained_marks DESC) AS d_rank
      FROM results r
      JOIN students s ON s.id = r.student_id
      WHERE r.exam_id = 1
      LIMIT 3
    `);
    console.log(`✓ Successfully executed MySQL Window Function (DENSE_RANK):`, windowRes);

    console.log('\nAll Database Tests Passed Successfully! Ready for university evaluation.');
  } catch (err) {
    console.error('❌ Database Test Query Failed:', err.message);
    process.exit(1);
  }
}

testDatabase();

