import pool from '../config/database';

export class AutomationService {
    /**
     * Finds and applies to matching opportunities for a student
     */
    /**
     * Finds and applies to matching opportunities for a student
     */
    static async runAutoMatch(studentId: string, userId: string) {
        // Get Student Details
        const studentRes = await pool.query('SELECT id, first_name, auto_apply_enabled FROM students WHERE id = $1', [studentId]);
        if (studentRes.rows.length === 0) return { matches_found: 0, message: 'Student not found' };

        const student = studentRes.rows[0];

        const { AIService } = require('./AIService');
        const { NotificationService } = require('./NotificationService');

        console.log(`[AI SERVICE] Triggering Match Protocol for student ${studentId}...`);
        
        const matches = await AIService.getMatchIntelligence(studentId);
        
        if (!matches || matches.length === 0) {
            return { matches_found: 0, message: 'No opportunities currently match your strict profile.' };
        }

        await pool.query('UPDATE students SET ai_match_cache = $1, last_sync_at = NOW() WHERE id = $2', [JSON.stringify(matches), studentId]);

        let bestMatch: any = null;
        for (const job of matches) {
            const score = job.score || job.match_score || 0;
            if (!bestMatch || score > (bestMatch.score || bestMatch.match_score || 0)) {
                bestMatch = job;
            }
        }

        if (bestMatch) {
            const totalScore = bestMatch.score || bestMatch.match_score || 0;
            const reasoning = bestMatch.reasoning || "Strong neural alignment with your trajectory.";
            const oppId = bestMatch.opportunity_id || bestMatch.id;

            // 24-HOUR REMATCH PROTOCOL
            // Check if student is within the window to change matches
            const lockCheckQuery = `
                SELECT a.id, COALESCE(p.created_at, a.applied_at) as match_time
                FROM applications a
                LEFT JOIN placements p ON a.id = p.application_id
                WHERE a.student_id = $1
                  AND (a.status IN ('ACCEPTED', 'OFFERED') OR p.status = 'ACTIVE')
                ORDER BY match_time DESC
                LIMIT 1
            `;
            const lockCheckRes = await pool.query(lockCheckQuery, [studentId]);
            let canRematch = student.auto_apply_enabled;
            
            if (lockCheckRes.rows.length > 0) {
                const matchTime = new Date(lockCheckRes.rows[0].match_time).getTime();
                const diff = (matchTime + (24 * 60 * 60 * 1000)) - Date.now();
                if (diff > 0) {
                    canRematch = true; // Still within window, allow AISHA to pivot
                }
            } else {
                canRematch = true; // No active match, definitely can auto-apply if score high
            }

            if (canRematch) {
                const checkRes = await pool.query('SELECT id FROM applications WHERE student_id = $1 AND opportunity_id = $2 AND status = \'ACCEPTED\'', [student.id, oppId]);
                
                if (checkRes.rows.length === 0) {
                    console.log(`[AI SERVICE] Rematching student ${studentId} to higher confidence node: ${oppId}`);
                    
                    // Atomic Purge - Delete all existing history to guarantee clean state and fresh placement
                    await pool.query('DELETE FROM applications WHERE student_id = $1', [student.id]);

                    const insertQuery = `
                        INSERT INTO applications (student_id, opportunity_id, match_score, match_reason, status)
                        VALUES ($1, $2, $3, $4, 'ACCEPTED')
                        RETURNING id
                    `;
                    const appRes = await pool.query(insertQuery, [student.id, oppId, totalScore, reasoning]);
                    const newAppId = appRes.rows[0].id;
                    
                    const oppQuery = await pool.query('SELECT company_id, vacancies FROM opportunities WHERE id = $1', [oppId]);
                    const opp = oppQuery.rows[0];
                    const compId = opp.company_id;
                    const vacancies = opp.vacancies || 0;

                    // Check current active placements for this opportunity
                    const countRes = await pool.query(`
                        SELECT COUNT(*) FROM placements p
                        JOIN applications a ON p.application_id = a.id
                        WHERE a.opportunity_id = $1 AND p.status = 'ACTIVE'
                    `, [oppId]);
                    const currentPlacements = parseInt(countRes.rows[0].count);

                    if (currentPlacements >= vacancies) {
                        console.log(`[AI SERVICE] Skipping auto-placement for student ${studentId} to ${oppId}: No vacancies remaining.`);
                        return { matches_found: 0, message: "Match found, but the opportunity has reached full capacity." };
                    }

                    await pool.query(`
                        INSERT INTO placements (application_id, student_id, company_id, start_date, end_date, status)
                        VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '3 months', 'ACTIVE')
                    `, [newAppId, student.id, compId]);

                    await NotificationService.createNotification(
                        userId,
                        'Neural Match Adjusted',
                        `Your preferences triggered a pivot. You have been rematched to ${bestMatch.title || bestMatch.job_title} (${totalScore}% alignment).`,
                        'SUCCESS'
                    );

                    return { matches_found: 1, message: `Successfully rematched student to ${bestMatch.title || bestMatch.job_title}.` };
                } else {
                    // Exact same active priority match remained highest rated - do nothing silently
                }
            }
        }

        return { matches_found: 0, message: "Match analysis complete. No high-confidence pivot required." };
    }

    /**
     * Periodically reviews pending applications and auto-accepts top matches
     */
    static async runAutonomousReview(opportunityId: string) {
        try {
            const axios = require('axios');
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';

            const oppRes = await pool.query('SELECT vacancies, auto_accept, title FROM opportunities WHERE id = $1', [opportunityId]);
            if (oppRes.rows.length === 0 || !oppRes.rows[0].auto_accept) return;
            const opp = oppRes.rows[0];

            const acceptedCountRes = await pool.query("SELECT COUNT(*) FROM applications WHERE opportunity_id = $1 AND status = 'ACCEPTED'", [opportunityId]);
            const remainingSlots = (opp.vacancies || 0) - parseInt(acceptedCountRes.rows[0].count);
            if (remainingSlots <= 0) return;

            // Fetch PENDING candidates to review
            const pendingRes = await pool.query(`
                SELECT a.id, a.student_id, s.user_id as student_user_id, s.first_name
                FROM applications a
                JOIN students s ON a.student_id = s.id
                WHERE a.opportunity_id = $1 AND a.status = 'PENDING'
                LIMIT $2
            `, [opportunityId, remainingSlots]);

            for (const app of pendingRes.rows) {
                // AI DEEP REVIEW
                console.log(`[AI SERVICE] Triggering deep review for application ${app.id}...`);
                const aiResult = await axios.post(`${aiServiceUrl}/api/autonomy/review/${app.id}`);
                const { match_score, verification } = aiResult.data;

                // High-Confidence Auto-Accept
                if (match_score >= 80 && verification.recommendation === 'accept') {
                    await pool.query("UPDATE applications SET status = 'OFFERED', updated_at = NOW() WHERE id = $1", [app.id]);

                    const { NotificationService } = require('./NotificationService');
                    const { RealtimeService } = require('./RealtimeService');

                    // 1. Notify Student of Offer
                    await NotificationService.createNotification(
                        app.student_user_id,
                        'Autonomous Professional Offer!',
                        `After deep AI verification of your academic records, you have received an offer for ${opp.title}. Your matching score was ${Math.round(match_score)}%.`,
                        'SUCCESS'
                    );

                    // 2. Notify Company of Auto-generated Offer
                    const companyUserRes = await pool.query(`
                        SELECT c.user_id FROM companies c
                        JOIN opportunities o ON o.company_id = c.id
                        WHERE o.id = $1
                    `, [opportunityId]);

                    if (companyUserRes.rows.length > 0) {
                        await NotificationService.createNotification(
                            companyUserRes.rows[0].user_id,
                            'Autonomous Offer Issued',
                            `AISHA has automatically issued a professional offer to ${app.first_name} for the ${opp.title} position based on a ${Math.round(match_score)}% neural match and verified academic excellence.`,
                            'INFO'
                        );
                    }

                    // 3. Notify Institution
                    const studentData = await pool.query('SELECT institution_id FROM students WHERE id = $1', [app.student_id]);
                    if (studentData.rows[0]?.institution_id) {
                        RealtimeService.emitToInstitution(studentData.rows[0].institution_id, 'autonomous_placement_offer', {
                            student_id: app.student_id,
                            opportunity_id: opportunityId,
                            status: 'OFFERED'
                        });
                    }
                } else {
                    console.log(`Autonomous Review: App ${app.id} did not meet AI threshold. (Score: ${match_score})`);
                }
            }
        } catch (error) {
            console.error('Autonomous Review Error:', error);
        }
    }

    /**
     * Checks for OFFERED applications that have passed their offer_expires_at date
     * and sets them to EXPIRED.
     */
    static async expireOldOffers() {
        try {
            const { NotificationService } = require('./NotificationService');

            // Find expired offers
            const expiredRes = await pool.query(`
                SELECT a.id, a.opportunity_id, a.student_id, s.user_id as student_user_id, o.title, c.user_id as company_user_id
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN opportunities o ON a.opportunity_id = o.id
                JOIN companies c ON o.company_id = c.id
                WHERE a.status = 'OFFERED' AND a.offer_expires_at < NOW()
            `);

            for (const app of expiredRes.rows) {
                // Set to DECLINED (or EXPIRED if you prefer, DECLINED fits the enum)
                await pool.query("UPDATE applications SET status = 'DECLINED', updated_at = NOW() WHERE id = $1", [app.id]);

                await NotificationService.createNotification(
                    app.student_user_id,
                    'Offer Expired',
                    `Your offer for ${app.title} has expired as the 48-hour window has passed without acceptance.`,
                    'WARNING'
                );

                await NotificationService.createNotification(
                    app.company_user_id,
                    'Offer Expired',
                    `The offer extended for ${app.title} has expired as the student did not respond in time.`,
                    'INFO'
                );
            }
        } catch (error) {
            console.error('Error expiring old offers:', error);
        }
    }
}
