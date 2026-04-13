import pool from './src/config/database';
async function run() {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'opportunities'");
    console.log("Opportunities cols:", res.rows.map(r=>r.column_name));
    process.exit(0);
}
run();
