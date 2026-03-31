import request from 'supertest';
import app from '../app';

describe('Health Check Endpoints', () => {
    it('should return 200 OK for the root endpoint', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toBe('SAPS API Gateway is running');
    });

    it('should return 404 for non-existent routes', async () => {
        const response = await request(app).get('/api/v1/non-existent');
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
    });
});
