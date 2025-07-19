const request = require('supertest');
const app = require('../app');
const { connectTestDB, generateTestToken, clearTestCollections } = require('../utils/testSetup');

describe('Post Routes', () => {
  let authToken;
  
  beforeAll(async () => {
    await connectTestDB();
    // Create test user and get token
    const user = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'postuser',
        email: 'post@test.com',
        password: 'Test123!'
      });
    authToken = user.body.token;
  });

  afterEach(async () => await clearTestCollections());

  describe('POST /api/posts', () => {
    it('should create a new post with image', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .field('content', 'Test post content')
        .attach('image', 'tests/fixtures/test-post.jpg');

      expect(res.status).toBe(201);
      expect(res.body.post).toHaveProperty('imageUrl');
    });
  });

  describe('GET /api/posts', () => {
    it('should get user feed', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });
});
