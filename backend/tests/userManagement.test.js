const request = require('supertest');
const app = require('../src/server');

describe('User Management API', () => {

    let token;
    const testUser = {
        name: 'John Doe',
        email: `johndoe_${Date.now()}@example.com`,
        password: 'password123'
    };

    // Test case 1: Successful Registration
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send(testUser);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body).toHaveProperty('name', testUser.name);
        expect(res.body).toHaveProperty('email', testUser.email);
        expect(res.body).toHaveProperty('token'); // Assuming standard JWT return
    });

    // Test case 2: Fail if user already exists
    it('should fail if email is already registered', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send(testUser);

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toEqual('User already exists');
    });

    // Test case 3: Login successfully
    it('should login user and return a token', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');

        // Save token for protected routes
        token = res.body.token;
    });

    // Test case 4: Login fail with wrong password
    it('should fail login with wrong credentials', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toEqual('Invalid email or password');
    });

    // Test case 5: Get Profile (Protected)
    it('should fetch the logged-in user profile', async () => {
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toEqual(testUser.email);
    });

    // Test case 6: Block unauthorized profile fetch
    it('should prevent fetching profile without token', async () => {
        const res = await request(app)
            .get('/api/users/me');

        expect(res.statusCode).toEqual(401); // Or 403 depending on auth middleware
    });

    // Test case 7: Update Profile
    it('should update the user profile', async () => {
        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'John Doe Updated'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('John Doe Updated');
    });

    // Test case 8: Delete Profile
    it('should delete the user profile', async () => {
        const res = await request(app)
            .delete('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
    });

});
