const { Client } = require('pg');
const axios = require('axios');

async function testMatchFlow() {
  const client = new Client({
    user: 'saps_user',
    host: 'localhost',
    database: 'saps_db',
    password: 'saps_password',
    port: 5432,
  });

  try {
    await client.connect();

    // 1. Find user
    const userRes = await client.query("SELECT id FROM users WHERE email = 'ndinyabrian2582@gmail.com'");
    if (userRes.rows.length === 0) {
      console.log('User ndinyabrian2582@gmail.com not found');
      return;
    }
    const userId = userRes.rows[0].id;

    // 2. Find a regnumber with SIT or COM
    const regRes = await client.query("SELECT id, admission_number FROM students WHERE admission_number LIKE 'SIT/%' OR admission_number LIKE 'COM/%' LIMIT 1");
    if (regRes.rows.length === 0) {
      console.log('No SIT or COM admission numbers found');
      return;
    }
    const targetStudentId = regRes.rows[0].id;
    const regNumber = regRes.rows[0].admission_number;
    console.log(`Chose reg number: ${regNumber}`);

    // Update the student to belong to this user and set location NOT Nakuru
    await client.query(
      "UPDATE students SET user_id = $1, preferred_locations = $2 WHERE id = $3",
      [userId, ['Nairobi'], targetStudentId]
    );
    console.log('Updated user profile and location (Nairobi)');

    // 3. Test Response Rate for MATCHING
    const t0 = performance.now();
    try {
      console.log('Triggering backend AutoMatch process...');
      // By directly requiring the compiled AutomationService if it's TS, wait, it's easier to hit the AI API or we can just run the node logic 
      // Since it's compiled, let's hit the AI backend directly which is what takes time
      const response = await axios.get(`http://localhost:8001/api/matching/recommendations/${targetStudentId}`);
      
      const t1 = performance.now();
      const timeTaken = ((t1 - t0) / 1000).toFixed(2);
      
      console.log(`Matches found: ${response.data.matches.length}`);
      console.log(`Top match:`, response.data.matches[0]);
      console.log(`E2E Match Process took: ${timeTaken} seconds`);

    } catch(e) {
      console.error('Match failed:', e.message);
    }
  } finally {
    await client.end();
  }
}

testMatchFlow();
