// services/auth/__tests__/auth.test.js
const request = require('supertest');
const app = require('../server'); // Assuming your Express app is exported from server.js

describe('Auth Service', () => {
  test('POST /register should create a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User created successfully');
  });

  test('POST /login should authenticate a user', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});