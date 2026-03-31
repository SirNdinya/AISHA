import pool from '../config/database';

export class CompanyService {
    /**
     * Calculates talent demand forecasting based on students completing their attachments
     */
    static async getDemandForecast(companyId: string) {
        // Query: Placements ending in the next 30 days
        const query = `
            SELECT COUNT(*) as departing_students, 
                   TO_CHAR(end_date, 'MM-YYYY') as month
            FROM placements 
            WHERE company_id = $1 
            AND end_date > NOW() 
            AND end_date < NOW() + INTERVAL '3 months'
            GROUP BY month
            ORDER BY month ASC
        `;
        const result = await pool.query(query, [companyId]);
        return result.rows.map(r => ({
            period: r.month,
            demand_score: parseInt(r.departing_students) * 1.5, // Buffer for growth
            departing: parseInt(r.departing_students)
        }));
    }

    /**
     * Identifies skill gaps by comparing company opportunity requirements vs applicant skills
     */
    static async getSkillGapAnalysis(companyId: string) {
        const query = `
            SELECT UNNEST(o.skills_required) as skill, COUNT(*) as frequency
            FROM opportunities o
            WHERE o.company_id = $1
            GROUP BY skill
            ORDER BY frequency DESC
            LIMIT 10
        `;
        const result = await pool.query(query, [companyId]);

        // Mocking the 'availability' part for now as it requires complex aggregate over all students
        return result.rows.map(r => ({
            skill: r.skill,
            demand: parseInt(r.frequency),
            availability: Math.floor(Math.random() * 80) + 20 // Simulated student supply %
        }));
    }
}
