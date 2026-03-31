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
    { reg: 'SOE3001', first: 'Ethan', last: 'Carter' },
    { reg: 'SOE3002', first: 'Sophia', last: 'Nelson' },
    { reg: 'SOE3003', first: 'Mason', last: 'Baker' },
    { reg: 'SOE3004', first: 'Isabella', last: 'Mitchell' },
    { reg: 'SOE3005', first: 'James', last: 'Perez' },
    { reg: 'SOE3006', first: 'Daniel', last: 'Roberts' },
    { reg: 'SOE3007', first: 'Ella', last: 'Turner' },
    { reg: 'SOE3008', first: 'Alexander', last: 'Phillips' },
    { reg: 'SOE3009', first: 'Grace', last: 'Campbell' },
    { reg: 'SOE3010', first: 'Lucas', last: 'Parker' },
];

const schoolsToCreate = [
    { name: 'School of Computing and Informatics', code: 'SCI' },
    { name: 'School of Education', code: 'SOE' },
    { name: 'School of Engineering', code: 'SENG' },
];

const departmentsToCreate = [
    { name: 'Computer Science', code: 'COM', school: 'SCI' },
    { name: 'Information Technology', code: 'SIT', school: 'SCI' },
    { name: 'Cyber Security', code: 'CYB', school: 'SCI' },
    { name: 'Artificial Intelligence', code: 'AI', school: 'SCI' },
    { name: 'Education', code: 'SOE', school: 'SOE' },
    { name: 'Electrical Engineering', code: 'EEE', school: 'SENG' },
];

const unitsByDept: Record<string, string[]> = {
    'COM': [
        'Introduction to Programming', 'Data Structures', 'Algorithms', 'OS Fundamentals',
        'Database Management', 'Object Oriented Programming', 'Software Engineering', 'Discrete Math',
        'Computer Architecture', 'Visual Programming', 'Web Development', 'Theory of Computation',
        'Human Computer Interaction', 'System Analysis', 'Distributed Systems', 'Compiler Construction',
        'Mobile App Dev', 'Graphics', 'Logic in CS', 'Network Design',
        'Software Testing', 'Ethics in Computing', 'Project Management', 'Final Year project I',
        'Cloud Computing', 'Parallel Processing', 'Big Data Analytics', 'Digital Signal Processing'
    ],
    'SIT': [
        'IT Fundamentals', 'Network Infrastructure', 'Information Systems', 'Web Tech I',
        'Database Admin', 'System Administration', 'Network Security', 'E-commerce',
        'IT project management', 'Service Management', 'User Experience Design', 'Multimedia Systems',
        'Digital Literacy', 'Business Information Systems', 'Strategic IT Management', 'Emerging Technologies',
        'Cloud Infrastructure', 'Cyber Law', 'Social Media Analytics', 'IT Infrastructure Library (ITIL)',
        'Data Communication', 'Web Tech II', 'Knowledge Management', 'Decision Support Systems',
        'ERP Systems', 'Information Security Audit', 'Internet of Things', 'Business Intelligence'
    ],
    'CYB': [
        'Intro to Cyber Security', 'Information Security', 'Network Security', 'Ethical Hacking',
        'Digital Forensics', 'Cryptography', 'Secure Software Dev', 'Risk Management',
        'Intrusion Detection', 'Malware Analysis', 'Cyber Incident Response', 'Cloud Security',
        'Mobile Security', 'Database Security', 'Operating System Security', 'Security Policies',
        'Identity & Access Management', 'Web Application Security', 'Physical Security', 'Disaster Recovery',
        'Cyber Warfare', 'Bio-metric Systems', 'Information Warfare', 'Cyber Espionage',
        'Security Operations Center (SOC)', 'Blockchain Security', 'AI in Cyber Security', 'IOT Security'
    ],
    'AI': [
        'Intro to AI', 'Machine Learning', 'Neural Networks', 'Natural Language Processing',
        'Computer Vision', 'Robotics', 'Data Science', 'Probabilistic Reasoning',
        'AI Ethics', 'Reinforcement Learning', 'Deep Learning', 'Logic for AI',
        'Big Data Systems', 'Optimization Algorithms', 'Statistical Learning', 'Evolutionary Computing',
        'Fuzzy Logic', 'Knowledge Representation', 'Pattern Recognition', 'Search Techniques',
        'Multi-agent Systems', 'AI in Healthcare', 'Embedded Systems for AI', 'Speech Processing',
        'Expert Systems', 'Data Warehousing', 'Bayesian Networks', 'Computational Intelligence'
    ],
    'SOE': [
        'Philosophy of Education', 'Educational Psychology', 'Sociology of Education', 'Curriculum Development',
        'Educational Media', 'General Methods of Teaching', 'Subject Methods I', 'Subject Methods II',
        'Education Administration', 'Educational Assessment', 'Guidance and Counseling', 'Special Needs Education',
        'Contemporary Issues in Education', 'Education Research', 'Entrepreneurship for Teachers', 'Microteaching',
        'Teaching Practice I', 'Teaching Practice II', 'Language Education', 'Science Education',
        'Mathematics Education', 'History and Policy of Education', 'Environmental Education', 'Distance Learning',
        'Instructional Design', 'Adult Education', 'Gender and Education', 'Global Education'
    ]
};

// Padding zeros helper
const padZeros = (num: number, length: number) => num.toString().padStart(length, '0');

async function createUser(email: string, role: string) {
    const passHash = await bcrypt.hash(defaultPassword, 10);
    const id = crypto.randomUUID();
    await pool.query(
        `INSERT INTO users (id, email, password_hash, role, is_verified) 
         VALUES ($1, $2, $3, $4, $5)`,
        [id, email, passHash, role, true]
    );
    return id;
}

async function main() {
    await pool.connect();
    console.log('Connected to PG. Starting population script for MMUST...');

    try {
        await pool.query('BEGIN');

        // 1. Create Main Admin
        const mainAdminId = await createUser('admin_mmust@mmust.ac.ke', 'INSTITUTION');

        // 2. Create MMUST
        const instId = crypto.randomUUID();
        await pool.query(
            `INSERT INTO institutions (id, name, code, user_id, contact_person)
             VALUES ($1, $2, $3, $4, $5)`,
            [instId, 'Masinde Muliro University of Science and Technology', 'MMUST', mainAdminId, 'Main Admin']
        );
        console.log('Created MMUST Institution.');

        // 3. Create Schools & Coordinators
        const schoolIdMap: Record<string, string> = {};
        for (const school of schoolsToCreate) {
            const adminEmail = `coordinator_${school.code.toLowerCase()}@mmust.ac.ke`;
            const adminId = await createUser(adminEmail, 'SCHOOL_COORDINATOR');

            const sId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO schools (id, institution_id, user_id, name, code, description)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [sId, instId, adminId, school.name, school.code, `School of ${school.name}`]
            );
            schoolIdMap[school.code] = sId;
            console.log(`Created School: ${school.name}`);
        }

        // 4. Create Departments & Admins
        const deptIdMap: Record<string, string> = {};
        for (const dept of departmentsToCreate) {
            const adminEmail = `admin_${dept.code.toLowerCase()}@mmust.ac.ke`;
            const adminId = await createUser(adminEmail, 'DEPARTMENT_ADMIN');

            const dId = crypto.randomUUID();
            const schoolId = schoolIdMap[dept.school];
            await pool.query(
                `INSERT INTO departments (id, institution_id, school_id, user_id, name, code, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [dId, instId, schoolId, adminId, dept.name, dept.code, `Department of ${dept.name}`]
            );
            deptIdMap[dept.code] = dId;
            console.log(`Created Department: ${dept.name} in ${dept.school}`);
        }

        // 5. Create Students
        const grades = ['A', 'B', 'B', 'C', 'A', 'B', 'B+'];
        let cyberCounter = 0;
        let aiCounter = 0;

        for (const s of studentsRaw) {
            let codePrefix = s.reg.substring(0, 3);
            if (codePrefix === 'SOE' && s.reg.length > 3 && !isNaN(parseInt(s.reg[3]))) {
                // handle SOE3001 case
            } else if (codePrefix !== 'COM' && codePrefix !== 'SIT' && codePrefix !== 'SOE') {
                codePrefix = 'COM'; // Default
            }

            let regNumPart = s.reg.replace(/[^0-9]/g, '');
            let rawNum = parseInt(regNumPart || '100');
            let formattedNumber = padZeros(rawNum, 5);

            // Distribution
            let deptCode = codePrefix;
            if (codePrefix === 'COM' || codePrefix === 'SIT') {
                if (cyberCounter < 5) {
                    deptCode = 'CYB';
                    cyberCounter++;
                } else if (aiCounter < 5) {
                    deptCode = 'AI';
                    aiCounter++;
                }
            }

            // New Reg Format: aaa/a/aa-aaaaa/aaaa
            // Assuming SIT/B/02-09873/2022
            const formattedReg = `${deptCode}/B/01-${formattedNumber}/2022`;

            const deptId = deptIdMap[deptCode];
            const dept = departmentsToCreate.find(d => d.code === deptCode);
            const schoolId = schoolIdMap[dept?.school || 'SCI'];

            const email = `${s.first.toLowerCase()}.${s.last.toLowerCase()}.${formattedNumber}@student.mmust.ac.ke`;
            const userId = await createUser(email, 'STUDENT');

            const studentId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO students (id, user_id, institution_id, school_id, department_id, admission_number, first_name, last_name, current_year, sync_status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [studentId, userId, instId, schoolId, deptId, formattedReg, s.first, s.last, 3, 'SYNCED']
            );

            // 6. Units Assignment (35 Units: 28 Completed, 7 Ongoing)
            const deptUnits = unitsByDept[deptCode] || unitsByDept['COM'];

            for (let i = 0; i < 35; i++) {
                const unitName = deptUnits[i % deptUnits.length];
                const unitCode = `${deptCode}-${padZeros(i + 1, 3)}`;
                let status = i < 28 ? 'COMPLETED' : 'ONGOING';
                let grade = i < 28 ? grades[i % grades.length] : null;
                let sem = (i % 14) < 7 ? 'Sem 1' : 'Sem 2';
                let year = Math.floor(i / 14) + 1;

                await pool.query(
                    `INSERT INTO student_units (id, student_id, unit_code, unit_name, grade, credits, semester, academic_year, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [crypto.randomUUID(), studentId, unitCode, unitName, grade, 3, sem, year, status]
                );

                if (status === 'COMPLETED') {
                    await pool.query(
                        `INSERT INTO student_academic_records (id, student_id, unit_code, unit_name, grade, semester, academic_year)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [crypto.randomUUID(), studentId, unitCode, unitName, grade, sem, year]
                    );
                }
            }
        }

        console.log(`Successfully inserted ${studentsRaw.length} students with schools, depts and units.`);

        await pool.query('COMMIT');
        console.log('Database population complete.');
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error('Error populating DB. Rolled back.', e);
    } finally {
        await pool.end();
    }
}

main();
