const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestCollections } = require('../utils/testSetup');

describe('Auth Routes', () => {
  beforeAll(async () => await connectTestDB());
  afterEach(async () => await clearTestCollections());

  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .field('username', 'testuser')
        .field('email', 'test@example.com')
        .field('password', 'Test123!')
        .attach('avatar', 'tests/fixtures/test-avatar.jpg');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
