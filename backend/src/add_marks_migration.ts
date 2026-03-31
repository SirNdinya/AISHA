import pool from './config/database';

async function migrateMarks() {
    try {
        console.log('Starting migration to add mark columns and distribute marks...');
        
        // 1. Add mark columns
        console.log('Adding "mark" column to tables...');
        try {
            await pool.query('ALTER TABLE inst_mmust.student_academic_records ADD COLUMN IF NOT EXISTS mark INTEGER');
        } catch (e: any) {
            console.warn('Could not alter inst_mmust.student_academic_records, it might not exist yet:', e.message);
        }
        
        try {
            await pool.query('ALTER TABLE public.student_academic_records ADD COLUMN IF NOT EXISTS mark INTEGER');
        } catch (e: any) {
            console.warn('Could not alter public.student_academic_records:', e.message);
        }

        try {
            await pool.query('ALTER TABLE public.student_units ADD COLUMN IF NOT EXISTS mark INTEGER');
        } catch (e: any) {
            console.warn('Could not alter public.student_units:', e.message);
        }

        // 2. Distribute marks based on grade
        console.log('Distributing marks matching grades...');

        // Query templates for mapping grades to random integers
        const updateQueries = [
            `UPDATE inst_mmust.student_academic_records SET mark = floor(random() * (100 - 70 + 1) + 70) WHERE (grade = 'A' OR grade LIKE 'A%') AND mark IS NULL`,
            `UPDATE inst_mmust.student_academic_records SET mark = floor(random() * (69 - 60 + 1) + 60) WHERE (grade = 'B' OR grade LIKE 'B%') AND mark IS NULL`,
            `UPDATE inst_mmust.student_academic_records SET mark = floor(random() * (59 - 50 + 1) + 50) WHERE (grade = 'C' OR grade LIKE 'C%') AND mark IS NULL`,
            `UPDATE inst_mmust.student_academic_records SET mark = floor(random() * (49 - 40 + 1) + 40) WHERE (grade = 'D' OR grade LIKE 'D%') AND mark IS NULL`,
            `UPDATE inst_mmust.student_academic_records SET mark = floor(random() * (39 - 0 + 1) + 0) WHERE (grade = 'E' OR grade = 'F' OR grade LIKE 'E%' OR grade LIKE 'F%') AND mark IS NULL`,
            `UPDATE inst_mmust.student_academic_records SET mark = 50 WHERE mark IS NULL`, // Final catch-all

            `UPDATE public.student_academic_records SET mark = floor(random() * (100 - 70 + 1) + 70) WHERE (grade = 'A' OR grade LIKE 'A%') AND mark IS NULL`,
            `UPDATE public.student_academic_records SET mark = floor(random() * (69 - 60 + 1) + 60) WHERE (grade = 'B' OR grade LIKE 'B%') AND mark IS NULL`,
            `UPDATE public.student_academic_records SET mark = floor(random() * (59 - 50 + 1) + 50) WHERE (grade = 'C' OR grade LIKE 'C%') AND mark IS NULL`,
            `UPDATE public.student_academic_records SET mark = floor(random() * (49 - 40 + 1) + 40) WHERE (grade = 'D' OR grade LIKE 'D%') AND mark IS NULL`,
            `UPDATE public.student_academic_records SET mark = floor(random() * (39 - 0 + 1) + 0) WHERE (grade = 'E' OR grade = 'F' OR grade LIKE 'E%' OR grade LIKE 'F%') AND mark IS NULL`,
            `UPDATE public.student_academic_records SET mark = 50 WHERE mark IS NULL`, // Final catch-all

            `UPDATE public.student_units SET mark = floor(random() * (100 - 70 + 1) + 70) WHERE (grade = 'A' OR grade LIKE 'A%') AND mark IS NULL`,
            `UPDATE public.student_units SET mark = floor(random() * (69 - 60 + 1) + 60) WHERE (grade = 'B' OR grade LIKE 'B%') AND mark IS NULL`,
            `UPDATE public.student_units SET mark = floor(random() * (59 - 50 + 1) + 50) WHERE (grade = 'C' OR grade LIKE 'C%') AND mark IS NULL`,
            `UPDATE public.student_units SET mark = floor(random() * (49 - 40 + 1) + 40) WHERE (grade = 'D' OR grade LIKE 'D%') AND mark IS NULL`,
            `UPDATE public.student_units SET mark = floor(random() * (39 - 0 + 1) + 0) WHERE (grade = 'E' OR grade = 'F' OR grade LIKE 'E%' OR grade LIKE 'F%') AND mark IS NULL`,
            `UPDATE public.student_units SET mark = 50 WHERE mark IS NULL`, // Final catch-all
        ];

        for (const query of updateQueries) {
            try {
                await pool.query(query);
            } catch (e: any) {
                // Ignore if table doesn't exist etc.
                console.warn('Query failed, moving on:', e.message);
            }
        }

        console.log('Marks migration completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration Failed:', e);
        process.exit(1);
    }
}

migrateMarks();
