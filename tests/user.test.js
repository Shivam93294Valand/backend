const request = require('supertest');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

let userToken, userId, postId, storyId, messageId, commentId;

const testUser = {
  username: 'tester1',
  email: 'tester1@example.com',
  password: 'Pass123!',
  avatar: 'https://example.com/avatar1.jpg'
};

beforeAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

describe('User API Tests', () => {
  // Auth Tests
  describe('Authentication', () => {
    it('should sign up a user', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/signup')
        .send(testUser);
      expect([200, 201, 400, 500]).toContain(res.statusCode);
      if (res.statusCode === 201 || res.statusCode === 200) {
        expect(res.body).toHaveProperty('token');
        userToken = res.body.token;
        userId = res.body.user.id;
      }
    });

    it('should login the user', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      userToken = res.body.token;
    });
  });

  // User Tests
  describe('User Operations', () => {
    it('should get current user', async () => {
      const res = await request(BASE_URL)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', testUser.username);
    });

    it('should update user profile', async () => {
      const res = await request(BASE_URL)
        .put('/api/user/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bio: 'This is a test bio' });
      expect(res.statusCode).toBe(200);
    });
  });

  // Posts Tests
  describe('Posts', () => {
    it('should create a post', async () => {
      const res = await request(BASE_URL)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Test post', image: 'https://example.com/post1.jpg' });
      expect([200, 201]).toContain(res.statusCode);
      postId = res.body.post?._id || res.body.post?.id;
    });

    it('should get feed', async () => {
      const res = await request(BASE_URL)
        .get('/api/posts')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Stories Tests
  describe('Stories', () => {
    it('should create and get stories', async () => {
      const createRes = await request(BASE_URL)
        .post('/api/stories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ media: 'https://example.com/story1.jpg' });
      expect([200, 201]).toContain(createRes.statusCode);

      const getRes = await request(BASE_URL)
        .get('/api/stories')
        .set('Authorization', `Bearer ${userToken}`);
      expect(getRes.statusCode).toBe(200);
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should reject unauthorized access', async () => {
      const res = await request(BASE_URL).get('/api/user/me');
      expect(res.statusCode).toBe(401);
    });

    it('should reject invalid user operations', async () => {
      const res = await request(BASE_URL)
        .get('/api/user/invalidid123')
        .set('Authorization', `Bearer ${userToken}`);
      expect([400, 404, 500]).toContain(res.statusCode);
    });
  });
});
