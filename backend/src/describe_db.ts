import pool from './config/database';

async function describeDB() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log("Tables:", res.rows.map(r => r.table_name).join(', '));

        for (const row of res.rows) {
            const table = row.table_name;
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1;
            `, [table]);
            console.log(`\nTable ${table}:`);
            cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

describeDB();
