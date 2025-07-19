const request = require('supertest');

const BASE_URL = 'http://localhost:5000';

let adminToken, adminId, userId, contentId;

const adminUser = {
  username: 'admin1',
  email: 'admin1@example.com',
  password: 'Admin123!',
  avatar: 'https://example.com/avatar2.jpg',
  isAdmin: true
};

beforeAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

describe('Admin API Tests', () => {
  // Admin Auth Tests
  describe('Admin Authentication', () => {
    it('should sign up admin user', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/signup')
        .send(adminUser);
      expect([200, 201, 400]).toContain(res.statusCode);
      if (res.statusCode === 201 || res.statusCode === 200) {
        expect(res.body).toHaveProperty('token');
        adminToken = res.body.token;
        adminId = res.body.user.id;
      }
    });

    it('should login admin user', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: adminUser.password });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      adminToken = res.body.token;
    });
  });

  // Admin Operations Tests
  describe('Admin Operations', () => {
    it('should get all users', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get all reports', async () => {
      const res = await request(BASE_URL)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should ban a user', async () => {
      // First create a user to ban
      const userRes = await request(BASE_URL)
        .post('/api/auth/signup')
        .send({
          username: 'tobebanned',
          email: 'banned@example.com',
          password: 'Pass123!'
        });
      
      userId = userRes.body.user.id;

      const res = await request(BASE_URL)
        .post(`/api/admin/ban/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('should remove content', async () => {
      // First create content to remove
      const contentRes = await request(BASE_URL)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Content to remove' });
      
      contentId = contentRes.body.post?._id || contentRes.body.post?.id;

      const res = await request(BASE_URL)
        .delete(`/api/admin/content/${contentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });
  });

  // Admin Error Handling Tests
  describe('Admin Error Handling', () => {
    it('should reject non-admin access to admin routes', async () => {
      const normalUserRes = await request(BASE_URL)
        .post('/api/auth/signup')
        .send({
          username: 'normal',
          email: 'normal@example.com',
          password: 'Pass123!'
        });
      
      const normalUserToken = normalUserRes.body.token;

      const res = await request(BASE_URL)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${normalUserToken}`);
      expect([401, 403]).toContain(res.statusCode);
    });
  });
});
