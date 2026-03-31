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

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();

export default pool;
