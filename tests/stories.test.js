const request = require('supertest');
const app = require('../app');
const { connectTestDB, generateTestToken, clearTestCollections } = require('../utils/testSetup');

describe('Story Routes', () => {
  let authToken;

  beforeAll(async () => {
    await connectTestDB();
    // Create test user and get token
    const user = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'storyuser',
        email: 'story@test.com',
        password: 'Test123!'
      });
    authToken = user.body.token;
  });

  afterEach(async () => await clearTestCollections());

  describe('POST /api/stories', () => {
    it('should create a new story', async () => {
      const res = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .field('expiresAt', new Date(Date.now() + 24*60*60*1000).toISOString())
        .attach('media', 'tests/fixtures/test-story.jpg');

      expect(res.status).toBe(201);
      expect(res.body.story).toHaveProperty('mediaUrl');
    });
  });

  describe('GET /api/stories', () => {
    it('should get active stories', async () => {
      const res = await request(app)
        .get('/api/stories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });
});
