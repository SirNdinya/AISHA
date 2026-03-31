import pool from '../config/database';
import { RealtimeService } from './RealtimeService';

export class InstitutionSyncService {
    /**
     * Autonomous Profile Sync
     * Reaches out to the specific institution's isolated data to pull student details.
     */
    static async syncStudentProfile(studentId: string) {
        try {
            // 1. Get Student & Institution Info
            const studentRes = await pool.query(`
                SELECT s.id, s.admission_number, s.institution_id, i.schema_name, s.user_id 
                FROM students s
                JOIN institutions i ON s.institution_id = i.id
                WHERE s.id = $1
            `, [studentId]);

            if (studentRes.rows.length === 0) throw new Error('Student or Institution not found');

            const student = studentRes.rows[0];
            const schemaName = student.schema_name;

            if (!schemaName) throw new Error('Institution schema not initialized');

            // 1.5 Standard Admission Number Validation
            const admissionRegex = /^[A-Z0-9/.-]{5,25}$/i;
            if (!admissionRegex.test(student.admission_number || '')) {
                console.log(`Invalid Admission Number Format: ${student.admission_number}`);
                await this.clearCachedInstitutionalData(studentId);
                return { status: 'INVALID_FORMAT' };
            }

            // 2. Fetch from isolated schema using admission number as key
            const tenantRes = await pool.query(`
                SELECT reg_number, full_name, course, year_of_study 
                FROM ${schemaName}.student_records 
                WHERE reg_number = $1
            `, [student.admission_number]);

            if (tenantRes.rows.length === 0) {
                // STRICT ENFORCEMENT: Clear profile if not found in institutional DB
                await this.clearCachedInstitutionalData(studentId);
                return { status: 'NOT_FOUND_IN_TENANT' };
            }

            const academicData = tenantRes.rows[0];
            const nameParts = academicData.full_name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            // 3. Update main profile instantly (Zero-Entry Fetching)
            // AI-driven profile generation for skills and interests removed per user request
            // Only syncing Name and Year which are institutional
            await pool.query(`
                UPDATE students 
                SET first_name = $1, 
                    last_name = $2, 
                    current_year = $3,
                    sync_status = 'SYNCED',
                    last_sync_at = NOW()
                WHERE id = $4
            `, [
                firstName,
                lastName,
                academicData.year_of_study,
                studentId
            ]);

            // 4. Sync Academic Units/Records
            await this.syncAcademicUnits(studentId, schemaName, academicData.reg_number, student.user_id);

            // 5. Notify frontend that profile identity has changed (Instant)
            RealtimeService.emitToUser(student.user_id, 'PROFILE_UPDATED', { admission_number: academicData.reg_number });

            // 6. Phase 1: Immediate Transcript Analysis (FAST)
            // This pre-calculates strengths and insights for later high-speed matching.
            setImmediate(async () => {
                try {
                    console.log(`[SYNC] Background analysis START for Student: ${studentId}`);
                    const { AIService } = require('./AIService');
                    // Fetch the records we just synced
                    const recordsRes = await pool.query('SELECT unit_name, grade, mark FROM student_academic_records WHERE student_id = $1', [studentId]);
                    console.log(`[SYNC] Found ${recordsRes.rows.length} records for analysis.`);
                    
                    if (recordsRes.rows.length > 0) {
                        console.log(`[AI SERVICE] Initiating rapid transcript analysis for ${studentId}...`);
                        const analysis = await AIService.analyzeTranscript(recordsRes.rows);
                        if (analysis) {
                            await pool.query('UPDATE students SET academic_analysis = $1 WHERE id = $2', [JSON.stringify(analysis), studentId]);
                            console.log(`[AI SERVICE] Transcript analysis completed and stored for student ${studentId}.`);
                            
                            // Notify frontend that analysis is complete
                            RealtimeService.emitToUser(student.user_id, 'ANALYSIS_COMPLETE', { analysis });
                        } else {
                            console.warn(`[AI SERVICE] Transcript analysis returned null for ${studentId}.`);
                        }
                    } else {
                        console.log(`[SYNC] No records found to analyze for ${studentId}.`);
                    }
                } catch (err: any) {
                    console.error("[SYNC] Transcript analysis background error:", err.message);
                }
            });

            return { status: 'SUCCESS', data: academicData };

        } catch (error: any) {
            console.error('Sync Error:', error.message);
            await pool.query('UPDATE students SET sync_status = $1 WHERE id = $2', ['FAILED', studentId]);
            throw error;
        }
    }

    private static async clearCachedInstitutionalData(studentId: string) {
        try {
            // 1. Clear Transcript & Units
            await pool.query('DELETE FROM student_academic_records WHERE student_id = $1', [studentId]);
            await pool.query('DELETE FROM student_units WHERE student_id = $1', [studentId]);

            // 2. Clear ONLY institutional identity data (Keep manual Career/Interests/Skills)
            await pool.query(`
                UPDATE students 
                SET first_name = NULL, 
                    last_name = NULL, 
                    current_year = NULL, 
                    sync_status = 'FAILED'
                WHERE id = $1
            `, [studentId]);

            console.log(`Cleared all institutional data for student ${studentId}`);
        } catch (error) {
            console.error('Error clearing institutional data:', error);
        }
    }

    private static async syncAcademicUnits(studentId: string, schemaName: string, regNumber: string, userId: string) {
        try {
            // Fetch grades and status from tenant schema
            const recordsRes = await pool.query(`
                SELECT au.unit_code, au.name as unit_name, sar.grade, sar.mark, sar.semester, sar.academic_year
                FROM ${schemaName}.student_academic_records sar
                JOIN ${schemaName}.academic_units au ON sar.unit_id = au.id
                JOIN ${schemaName}.student_records sr ON sar.student_id = sr.id
                WHERE sr.reg_number = $1
            `, [regNumber]);

            // Clear old cache
            await pool.query('DELETE FROM student_academic_records WHERE student_id = $1', [studentId]);
            await pool.query('DELETE FROM student_units WHERE student_id = $1', [studentId]);

            for (const record of recordsRes.rows) {
                const isCompleted = record.grade !== null;
                const status = isCompleted ? 'COMPLETED' : 'ONGOING';

                // 1. Populate academic records for completed units
                if (isCompleted) {
                    await pool.query(`
                        INSERT INTO student_academic_records 
                        (student_id, unit_code, unit_name, grade, mark, semester, academic_year)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [studentId, record.unit_code, record.unit_name, record.grade, record.mark, record.semester, record.academic_year]);
                }

                // 2. Populate student_units for ALL units (ongoing or completed)
                await pool.query(`
                    INSERT INTO student_units 
                    (student_id, unit_code, unit_name, grade, mark, status, semester, academic_year, credits)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [studentId, record.unit_code, record.unit_name, record.grade, record.mark, status, record.semester, record.academic_year, 3]);
            }

        } catch (error) {
            console.error('Academic Sync Error:', error);
        }
    }
}
