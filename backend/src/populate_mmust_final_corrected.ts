import { Pool } from 'pg';
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
    { regPrefix: 'COM/B/01', first: 'Liam', last: 'Scott' },
    { regPrefix: 'COM/B/01', first: 'Amelia', last: 'Green' },
    { regPrefix: 'COM/B/01', first: 'Benjamin', last: 'Adams' },
    { regPrefix: 'COM/B/01', first: 'Matthew', last: 'Evans' },
    { regPrefix: 'COM/B/01', first: 'Hannah', last: 'Edwards' },
    { regPrefix: 'COM/B/01', first: 'Samuel', last: 'Collins' },
    { regPrefix: 'COM/B/01', first: 'Ava', last: 'Stewart' },
    { regPrefix: 'COM/B/01', first: 'Joseph', last: 'Sanchez' },
    { regPrefix: 'COM/B/01', first: 'Evelyn', last: 'Morris' },
    { regPrefix: 'COM/B/01', first: 'Paul', last: 'Perez' },
    { regPrefix: 'COM/B/01', first: 'Alexander', last: 'Black' },
    { regPrefix: 'COM/B/01', first: 'Avenger', last: 'Nov' },
    { regPrefix: 'COM/B/01', first: 'Rigobert', last: 'Adams' },
    { regPrefix: 'COM/B/01', first: 'Matthew', last: 'Luke' },
    { regPrefix: 'COM/B/01', first: 'Samuel', last: 'Jackson' },
    { regPrefix: 'COM/B/01', first: 'Evelyn', last: 'Bellah' },
    { regPrefix: 'COM/B/01', first: 'Chloe', last: 'Hilda' },
    { regPrefix: 'COM/B/01', first: 'Zoe', last: 'Bellah' },
    { regPrefix: 'COM/B/01', first: 'William', last: 'Gomez' },
    { regPrefix: 'COM/B/01', first: 'Sonia', last: 'Parker' },
    { regPrefix: 'COM/B/01', first: 'Ava', last: 'Stewart' },
    { regPrefix: 'COM/B/01', first: 'Joseph', last: 'Claymond' },
    { regPrefix: 'COM/B/01', first: 'Ella', last: 'Melan' },
    { regPrefix: 'SIT/B/02', first: 'Anderson', last: 'Thomas' },
    { regPrefix: 'SIT/B/02', first: 'Taylor', last: 'Moore' },
    { regPrefix: 'SIT/B/02', first: 'Jackson', last: 'Martin' },
    { regPrefix: 'SIT/B/02', first: 'Lee', last: 'Perez' },
    { regPrefix: 'SIT/B/03', first: 'Thompson', last: 'White' },
    { regPrefix: 'SIT/B/03', first: 'Harris', last: 'Sanchez' },
    { regPrefix: 'SIT/B/03', first: 'Clark', last: 'Ramirez' },
    { regPrefix: 'SIT/B/03', first: 'Lewis', last: 'Robinson' },
    { regPrefix: 'SIT/B/04', first: 'Walker', last: 'Young' },
    { regPrefix: 'SIT/B/04', first: 'Allen', last: 'King' },
    { regPrefix: 'SIT/B/04', first: 'Wright', last: 'Scott' },
    { regPrefix: 'SIT/B/04', first: 'Torres', last: 'Nguyen' },
    { regPrefix: 'SIT/B/05', first: 'Hill', last: 'Flores' },
    { regPrefix: 'SIT/B/05', first: 'Juliette', last: 'Wilcox' },
    { regPrefix: 'SIT/B/05', first: 'Jerry', last: 'Nava' },
    { regPrefix: 'SIT/B/05', first: 'Scout', last: 'Brewer' },
    { regPrefix: 'SOE/B/01', first: 'Carter', last: 'Cooper' },
    { regPrefix: 'SOE/B/01', first: 'Elizabeth', last: 'Richardson' },
    { regPrefix: 'SOE/B/01', first: 'Gabriel', last: 'Cox' },
    { regPrefix: 'SOE/B/01', first: 'Braylee', last: 'Frazier' },
    { regPrefix: 'SOE/B/02', first: 'Callum', last: 'Medrano' },
    { regPrefix: 'SOE/B/02', first: 'Elsa', last: 'Richardson' },
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
];

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
];

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
];

const unitsByDept: Record<string, string[]> = {
    'COM': comUnits,
    'SIT': sitUnits,
    'SOE': soeUnits
};

async function main() {
    console.log('Re-populating MMUST with strict formatting: aaa/a/aa-aaaaa/aaaa and A,B,C,D,E,Incomplete grading...');
    try {
        await pool.query('BEGIN');

        await pool.query('DELETE FROM inst_mmust.student_academic_records');
        await pool.query('DELETE FROM inst_mmust.student_records');
        await pool.query('DELETE FROM inst_mmust.academic_units');

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

        const gradeScale = ['A', 'B', 'C', 'D', 'E', 'Incomplete'];
        let studentCounter = 1;

        for (const s of studentsRaw) {
            const deptCode = s.regPrefix.substring(0, 3);
            const course = deptCode === 'COM' ? 'Computer Science' : deptCode === 'SIT' ? 'Information Technology' : 'Education';

            // Format: aaa/a/aa-aaaaa/aaaa (e.g., SIT/B/02-09873/2022)
            const idPart = (studentCounter++).toString().padStart(5, '0');
            const formattedReg = `${s.regPrefix}-${idPart}/2022`;

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
                        isOngoing ? null : gradeScale[i % gradeScale.length],
                        (i % 14) < 7 ? 'Sem 1' : 'Sem 2',
                        Math.floor(i / 14) + 1
                    ]
                );
            }
        }

        await pool.query('COMMIT');
        console.log('Re-population complete with corrected formatting and grading.');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Population Failed:', e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
