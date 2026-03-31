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

const comUnits = [
    'Introduction to Programming', 'Data Structures', 'Algorithms', 'Operating Systems',
    'Database Systems', 'Object Oriented Programming', 'Software Engineering', 'Discrete Math',
    'Computer Architecture', 'Visual Programming', 'Web Technologies', 'Theory of Computation',
    'Human Computer Interaction', 'System Analysis', 'Distributed Systems', 'Compiler Construction',
    'Mobile Programming', 'Computer Graphics', 'Logic in CS', 'Network Design',
    'Software Quality Assurance', 'Ethics in Computing', 'Project Management', 'Final Year project I',
    'Cloud Computing', 'Parallel Processing', 'Big Data Analytics', 'Digital Signal Processing',
    'Artificial Intelligence', 'Machine Learning', 'Cyber Security', 'Network Protocols',
    'Software Architecture', 'Embedded Systems', 'Real-time Systems'
]; // 35 units

const sitUnits = [
    'IT Fundamentals', 'Network Infrastructure', 'Information Systems', 'Web Tech I',
    'Database Admin', 'System Administration', 'Network Security', 'E-commerce',
    'IT project management', 'Service Management', 'User Experience Design', 'Multimedia Systems',
    'Digital Literacy', 'Business Information Systems', 'Strategic IT Management', 'Emerging Technologies',
    'Cloud Infrastructure', 'Cyber Law', 'Social Media Analytics', 'ITIL Foundations',
    'Data Communication', 'Web Tech II', 'Knowledge Management', 'Decision Support Systems',
    'ERP Systems', 'Information Security Audit', 'Internet of Things', 'Business Intelligence',
    'Mobile Computing', 'Telecommunications', 'Network Design', 'Database Design',
    'Information Literacy', 'Professional Issues in IT', 'IT Service Delivery'
]; // 35 units

const soeUnits = [
    'Philosophy of Education', 'Educational Psychology', 'Sociology of Education', 'Curriculum Development',
    'Educational Media', 'General Methods of Teaching', 'Subject Methods I', 'Subject Methods II',
    'Education Administration', 'Educational Assessment', 'Guidance and Counseling', 'Special Needs Education',
    'Contemporary Issues in Education', 'Education Research', 'Entrepreneurship', 'Microteaching',
    'Teaching Practice I', 'Teaching Practice II', 'Language Education', 'Science Education',
    'Mathematics Education', 'History of Education', 'Environmental Education', 'Distance Learning',
    'Instructional Design', 'Adult Education', 'Gender and Education', 'Global Education',
    'Inclusive Education', 'Educational Policy', 'ICT in Education', 'Psychology of Learning',
    'Teaching of Literature', 'Teaching of History', 'Teaching of Geography'
]; // 35 units

const unitsByDept: Record<string, string[]> = {
    'COM': comUnits,
    'SIT': sitUnits,
    'SOE': soeUnits
};

async function main() {
    console.log('Re-populating MMUST isolated data with 35 units per department...');
    try {
        await pool.query('BEGIN');

        // Clear existing records to ensure fresh state
        await pool.query('DELETE FROM inst_mmust.student_academic_records');
        await pool.query('DELETE FROM inst_mmust.student_records');
        await pool.query('DELETE FROM inst_mmust.academic_units');

        // 1. Populate academic units
        const unitIdMap: Record<string, string> = {};
        for (const deptCode in unitsByDept) {
            const units = unitsByDept[deptCode];
            for (let i = 0; i < units.length; i++) {
                const code = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;
                const res = await pool.query(
                    'INSERT INTO inst_mmust.academic_units (unit_code, name, department_code) VALUES ($1, $2, $3) RETURNING id',
                    [code, units[i], deptCode]
                );
                unitIdMap[code] = res.rows[0].id;
            }
        }

        // 2. Populate students and 35 units per student
        const grades = ['A', 'B', 'B+', 'A-', 'B', 'C+', 'A'];
        for (const s of studentsRaw) {
            let deptCode = s.reg.substring(0, 3);
            if (!unitsByDept[deptCode]) deptCode = 'COM';

            const course = deptCode === 'COM' ? 'Computer Science' : deptCode === 'SIT' ? 'Information Technology' : 'Education';
            const numPart = s.reg.replace(/[^0-9]/g, '').padStart(5, '0');
            const formattedReg = `${deptCode}/B/01-${numPart}/2022`;

            const sRes = await pool.query(
                'INSERT INTO inst_mmust.student_records (reg_number, full_name, course, year_of_study) VALUES ($1, $2, $3, $4) RETURNING id',
                [formattedReg, `${s.first} ${s.last}`, course, 3]
            );
            const studentId = sRes.rows[0].id;

            const deptUnitsList = unitsByDept[deptCode];
            for (let i = 0; i < 35; i++) {
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

        await pool.query('COMMIT');
        console.log('Re-population complete with bidirectional student-unit records.');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Population Failed:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
