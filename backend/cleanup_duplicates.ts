import pool from './src/config/database';

async function run() {
    try {
        const res = await pool.query(`
            SELECT student_id
            FROM placements
            WHERE status = 'ACTIVE'
            GROUP BY student_id
            HAVING COUNT(*) > 1
        `);
        
        for (const row of res.rows) {
            const studentId = row.student_id;
            const placementsRes = await pool.query(`
                SELECT p.id, a.opportunity_id 
                FROM placements p
                LEFT JOIN applications a ON p.application_id = a.id
                WHERE p.student_id = $1 AND p.status = 'ACTIVE'
                ORDER BY p.id DESC
            `, [studentId]);
            
            // Keep the first (latest)
            const toReplace = placementsRes.rows.slice(1);
            for (const p of toReplace) {
                 console.log(`Replacing duplicate placement ${p.id} for student ${studentId}`);
                 await pool.query("UPDATE placements SET status = 'REPLACED' WHERE id = $1", [p.id]);
                 await pool.query("UPDATE opportunities SET vacancies = vacancies + 1 WHERE id = $1 AND vacancies >= 0", [p.opportunity_id]);
            }
        }
        console.log("Cleanup done.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
