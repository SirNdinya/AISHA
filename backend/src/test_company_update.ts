import pool from './config/database';

async function testUpdate() {
    try {
        const userId = '5e9d3147-a6a2-40ef-aa65-8ec5776fd307'; // A known user ID from the logs
        const profilePictureUrl = '/uploads/profiles/test.png';
        
        console.log(`Testing update for user ${userId}...`);
        
        const query = `
            UPDATE companies 
            SET profile_picture_url = $1,
                logo_url = COALESCE(logo_url, $1)
            WHERE user_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [profilePictureUrl, userId]);
        
        if (result.rows.length === 0) {
            console.log('No company found for this user.');
        } else {
            console.log('Update successful:', result.rows[0]);
        }
        
    } catch (error) {
        console.error('Update failed with error:', error);
    } finally {
        await pool.end();
    }
}

testUpdate();
