require('dotenv').config();
const { AutomationService } = require('./src/services/AutomationService');

async function runDirectMatch() {
    try {
        console.log("Starting Direct Auto-Match Test...");
        
        // We need a student_id and user_id. 
        // student_id: b610665f-4d6d-495c-9c96-02e07973d9e4 (Emily from db query early on)
        // user_id: 3e0d8692-a1b9-4d64-a745-6cf287313386 
        
        // Let's query one from the DB directly to be safe
        const pool = require('./src/config/database').default;
        const res = await pool.query("SELECT id, user_id FROM students LIMIT 1");
        
        if (res.rows.length === 0) {
            console.log("No students found.");
            return;
        }
        
        const { id, user_id } = res.rows[0];
        console.log(`Running match for Student ID: ${id}, User ID: ${user_id}`);
        
        const result = await AutomationService.runAutoMatch(id, user_id);
        console.log("Match Result:", result);
        
        console.log("Checking for notifications...");
        const notifRes = await pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [user_id]);
        console.log("Latest Notification:", notifRes.rows[0]);
        
        process.exit(0);
    } catch (e) {
        console.error("Error running direct match:", e);
        process.exit(1);
    }
}

runDirectMatch();
