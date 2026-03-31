import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'saps_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'saps_db',
    password: process.env.DB_PASSWORD || 'saps_password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

const defaultPassword = 'password123';

const studentsRaw = [
    { reg: 'COM/0001', first: 'Liam', last: 'Scott' },
    { reg: 'COM/0002', first: 'Amelia', last: 'Green' },
    { reg: 'COM/0003', first: 'Benjamin', last: 'Adams' },
    { reg: 'COM/0015', first: 'Matthew', last: 'Evans' },
    { reg: 'COM/0016', first: 'Hannah', last: 'Edwards' },
    { reg: 'COM/0017', first: 'Samuel', last: 'Collins' },
    { reg: 'COM/0018', first: 'Ava', last: 'Stewart' },
    { reg: 'COM/0019', first: 'Joseph', last: 'Sanchez' },
    { reg: 'COM/0020', first: 'Evelyn', last: 'Morris' },
    { reg: 'COM/0409', first: 'Paul', last: 'Perez' },
    { reg: 'COM/0611', first: 'Alexander', last: 'Black' },
    { reg: 'COM/0707', first: 'Avenger', last: 'Nov' },
    { reg: 'COM/3403', first: 'Rigobert', last: 'Adams' },
    { reg: 'COM/3415', first: 'Matthew', last: 'Luke' },
    { reg: 'COM/3417', first: 'Samuel', last: 'Jackson' },
    { reg: 'COM/4520', first: 'Evelyn', last: 'Bellah' },
    { reg: 'COM/5404', first: 'Chloe', last: 'Hilda' },
    { reg: 'COM/6612', first: 'Zoe', last: 'Bellah' },
    { reg: 'COM/7605', first: 'William', last: 'Gomez' },
    { reg: 'COM/7814', first: 'Sonia', last: 'Parker' },
    { reg: 'COM/8018', first: 'Ava', last: 'Stewart' },
    { reg: 'COM/8719', first: 'Joseph', last: 'Claymond' },
    { reg: 'COM/9006', first: 'Ella', last: 'Melan' },
    { reg: 'SIT/1246', first: 'Anderson', last: 'Thomas' },
    { reg: 'SIT/1247', first: 'Taylor', last: 'Moore' },
    { reg: 'SIT/1248', first: 'Jackson', last: 'Martin' },
    { reg: 'SIT/1249', first: 'Lee', last: 'Perez' },
    { reg: 'SIT/1256', first: 'Thompson', last: 'White' },
    { reg: 'SIT/1257', first: 'Harris', last: 'Sanchez' },
    { reg: 'SIT/1258', first: 'Clark', last: 'Ramirez' },
    { reg: 'SIT/1259', first: 'Lewis', last: 'Robinson' },
    { reg: 'SIT/1267', first: 'Walker', last: 'Young' },
    { reg: 'SIT/1268', first: 'Allen', last: 'King' },
    { reg: 'SIT/1269', first: 'Wright', last: 'Scott' },
    { reg: 'SIT/1278', first: 'Torres', last: 'Nguyen' },
    { reg: 'SIT/1279', first: 'Hill', last: 'Flores' },
    { reg: 'SIT/1280', first: 'Juliette', last: 'Wilcox' },
    { reg: 'SIT/1281', first: 'Jerry', last: 'Nava' },
    { reg: 'SIT/1282', first: 'Scout', last: 'Brewer' },
    { reg: 'SOE/0009', first: 'Carter', last: 'Cooper' },
    { reg: 'SOE/0010', first: 'Elizabeth', last: 'Richardson' },
    { reg: 'SOE/0011', first: 'Gabriel', last: 'Cox' },
    { reg: 'SOE/1282', first: 'Braylee', last: 'Frazier' },
    { reg: 'SOE/1283', first: 'Callum', last: 'Medrano' },
    { reg: 'SOE/8970', first: 'Elsa', last: 'Richardson' },
];

const unitsByDept: Record<string, string[]> = {
    'COM': [
        'Introduction to Programming', 'Data Structures', 'Algorithms', 'Operating Systems',
        'Database Systems', 'Object Oriented Programming', 'Software Engineering', 'Discrete Math',
        'Computer Architecture', 'Visual Programming', 'Web Technologies', 'Theory of Computation',
        'Human Computer Interaction', 'System Analysis', 'Distributed Systems', 'Compiler Construction',
        'Mobile Programming', 'Computer Graphics', 'Logic in CS', 'Network Design',
        'Software Quality Assurance', 'Ethics in Computing', 'Project Management', 'Final Year project I',
        'Cloud Computing', 'Parallel Processing', 'Big Data Analytics', 'Digital Signal Processing'
    ],
    'SIT': [
        'IT Fundamentals', 'Network Infrastructure', 'Information Systems', 'Web Tech I',
        'Database Admin', 'System Administration', 'Network Security', 'E-commerce',
        'IT project management', 'Service Management', 'User Experience Design', 'Multimedia Systems',
        'Digital Literacy', 'Business Information Systems', 'Strategic IT Management', 'Emerging Technologies',
        'Cloud Infrastructure', 'Cyber Law', 'Social Media Analytics', 'ITIL Foundations',
        'Data Communication', 'Web Tech II', 'Knowledge Management', 'Decision Support Systems',
        'ERP Systems', 'Information Security Audit', 'Internet of Things', 'Business Intelligence'
    ],
    'SOE': [
        'Philosophy of Education', 'Educational Psychology', 'Sociology of Education', 'Curriculum Development',
        'Educational Media', 'General Methods of Teaching', 'Subject Methods I', 'Subject Methods II',
        'Education Administration', 'Educational Assessment', 'Guidance and Counseling', 'Special Needs Education',
        'Contemporary Issues in Education', 'Education Research', 'Entrepreneurship', 'Microteaching',
        'Teaching Practice I', 'Teaching Practice II', 'Language Education', 'Science Education',
        'Mathematics Education', 'History of Education', 'Environmental Education', 'Distance Learning',
        'Instructional Design', 'Adult Education', 'Gender and Education', 'Global Education'
    ]
};

async function main() {
    console.log('Starting comprehensive institutional data population for inst_mmust...');
    try {
        await pool.query('BEGIN');

        // 1. Get MMUST ID
        const instRes = await pool.query("SELECT id FROM institutions WHERE code = 'MMUST'");
        if (instRes.rows.length === 0) throw new Error('MMUST not found');
        const instId = instRes.rows[0].id;

        // 2. Populate inst_mmust.academic_units
        const unitIdMap: Record<string, string> = {};
        for (const deptCode in unitsByDept) {
            const units = unitsByDept[deptCode];
            for (let i = 0; i < units.length; i++) {
                const code = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;
                const res = await pool.query(
                    'INSERT INTO inst_mmust.academic_units (unit_code, name, department_code) VALUES ($1, $2, $3) ON CONFLICT (unit_code) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                    [code, units[i], deptCode]
                );
                unitIdMap[code] = res.rows[0].id;
            }
        }
        console.log('Populated academic units in inst_mmust.');

        // 3. Populate inst_mmust.student_records and student_academic_records
        const grades = ['A', 'B', 'B+', 'A-', 'B', 'C+', 'A'];
        for (const s of studentsRaw) {
            let deptCode = s.reg.substring(0, 3);
            if (deptCode !== 'COM' && deptCode !== 'SIT' && deptCode !== 'SOE') deptCode = 'COM';

            const course = deptCode === 'COM' ? 'Computer Science' : deptCode === 'SIT' ? 'Information Technology' : 'Education';
            const numPart = s.reg.replace(/[^0-9]/g, '').padStart(5, '0');
            const formattedReg = `${deptCode}/B/01-${numPart}/2022`;

            const sRes = await pool.query(
                'INSERT INTO inst_mmust.student_records (reg_number, full_name, course, year_of_study) VALUES ($1, $2, $3, $4) ON CONFLICT (reg_number) DO UPDATE SET full_name = EXCLUDED.full_name RETURNING id',
                [formattedReg, `${s.first} ${s.last}`, course, 3]
            );
            const studentId = sRes.rows[0].id;

            // 28 COMPLETED + 7 ONGOING
            const deptUnits = unitsByDept[deptCode] || unitsByDept['COM'];

            // Note: If we don't have enough units defined, we loop back or cap it.
            // Let's ensure we have at least 35 units per student if possible, or use what we have.
            const totalToSync = Math.min(35, deptUnits.length);

            for (let i = 0; i < totalToSync; i++) {
                const unitCode = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;
                const uId = unitIdMap[unitCode];
                if (!uId) continue;

                const isOngoing = i >= 28;
                await pool.query(
                    `INSERT INTO inst_mmust.student_academic_records (student_id, unit_id, grade, semester, academic_year)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        studentId,
                        uId,
                        isOngoing ? null : grades[i % grades.length],
                        (i % 14) < 7 ? 'Sem 1' : 'Sem 2',
                        Math.floor(i / 14) + 1
                    ]
                );
            }
        }
        console.log(`Populated ${studentsRaw.length} student records with bidirectional mapping in inst_mmust.`);

        await pool.query('COMMIT');
        console.log('Comprehensive population complete.');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Population Failed:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
