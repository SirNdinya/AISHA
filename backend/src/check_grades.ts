import pool from './config/database';

async function checkGrades() {
    try {
        console.log('--- inst_mmust.student_academic_records ---');
        try {
            const res1 = await pool.query('SELECT grade, mark FROM inst_mmust.student_academic_records WHERE mark IS NOT NULL LIMIT 5');
            console.table(res1.rows);
        } catch(e) {}
        
        console.log('--- public.student_academic_records ---');
        try {
            const res2 = await pool.query('SELECT grade, mark FROM public.student_academic_records WHERE mark IS NOT NULL LIMIT 5');
            console.table(res2.rows);
        } catch(e) {}

        console.log('--- public.student_units ---');
        try {
            const res3 = await pool.query('SELECT grade, mark FROM public.student_units WHERE mark IS NOT NULL LIMIT 5');
            console.table(res3.rows);
        } catch(e) {}

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkGrades();
