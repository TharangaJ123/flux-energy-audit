const request = require('supertest');
const app = require('../src/server'); // We exported the Express app

describe('User Management API', () => {
    // Test case 1: Successful Registration
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123'
            });

        // Check response status
        expect(res.statusCode).toEqual(201);

        // Check response body structure
        // Depends on the controller's response structure, here's a generic example
        expect(res.body).toHaveProperty('_id');
        expect(res.body).toHaveProperty('name', 'Test User');
        expect(res.body).toHaveProperty('email', 'testuser@example.com');
    });

    // Test case 2: Fail if required fields are missing
    it('should not register user if missing fields', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                name: 'Test User'
                // Missing email and password
            });

        // Expect a 400 Bad Request
        expect(res.statusCode).toEqual(400);
    });
});
