import pool from './config/database';
import crypto from 'crypto';

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
    'COM': ['Introduction to Programming', 'Data Structures', 'Algorithms', 'Database Management'],
    'SIT': ['IT Fundamentals', 'Network Infrastructure', 'Web Tech I', 'Database Admin'],
    'SOE': ['Philosophy of Education', 'Educational Psychology', 'Curriculum Development'],
};

async function populateInstitutionalData() {
    try {
        console.log('Populating inst_mmust data...');

        // 1. Academic Units
        const unitIdMap: Record<string, string> = {};
        for (const deptCode in unitsByDept) {
            for (let i = 0; i < unitsByDept[deptCode].length; i++) {
                const name = unitsByDept[deptCode][i];
                const code = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;
                const res = await pool.query(
                    'INSERT INTO inst_mmust.academic_units (unit_code, name, department_code) VALUES ($1, $2, $3) RETURNING id',
                    [code, name, deptCode]
                );
                unitIdMap[code] = res.rows[0].id;
            }
        }

        // 2. Student Records and Grades
        const grades = ['A', 'B', 'B', 'C', 'A', 'B'];
        for (const s of studentsRaw) {
            const deptCode = s.reg.split('/')[0];
            const course = deptCode === 'COM' ? 'Computer Science' : deptCode === 'SIT' ? 'Information Technology' : 'Education';

            const res = await pool.query(
                'INSERT INTO inst_mmust.student_records (reg_number, full_name, course, year_of_study) VALUES ($1, $2, $3, $4) RETURNING id',
                [s.reg, `${s.first} ${s.last}`, course, 3]
            );
            const studentId = res.rows[0].id;

            // Simple grade population
            const deptUnits = unitsByDept[deptCode] || unitsByDept['COM'];
            for (let i = 0; i < deptUnits.length; i++) {
                const unitCode = `${deptCode}-${(i + 1).toString().padStart(3, '0')}`;
                const unitId = unitIdMap[unitCode];
                if (unitId) {
                    await pool.query(
                        'INSERT INTO inst_mmust.student_academic_records (student_id, unit_id, grade, semester, academic_year) VALUES ($1, $2, $3, $4, $5)',
                        [studentId, unitId, grades[i % grades.length], 'Sem 1', 3]
                    );
                }
            }
        }

        console.log('Institutional data population complete.');
        process.exit(0);
    } catch (e) {
        console.error('Population Error:', e);
        process.exit(1);
    }
}

populateInstitutionalData();
