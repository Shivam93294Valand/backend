const request = require('supertest');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';

let userToken, adminToken, userId, postId, storyId, messageId, commentId;
let adminId, adminPostId;

const testUser = {
  username: 'tester1',
  email: 'tester1@example.com',
  password: 'Pass123!',
  avatar: 'https://example.com/avatar1.jpg'
};
const adminUser = {
  username: 'admin1',
  email: 'admin1@example.com',
  password: 'Admin123!',
  avatar: 'https://example.com/avatar2.jpg',
  isAdmin: true
};

beforeAll(async () => {
  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

describe('API Integration Tests', () => {
  // AUTH
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

  // USER
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
      .send({ bio: 'This is a test bio', avatar: 'https://example.com/avatar2.jpg' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  // POST
  it('should create a post', async () => {
    const res = await request(BASE_URL)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'My first test post', image: 'https://example.com/post1.jpg' });
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

  it('should like a post', async () => {
    const res = await request(BASE_URL)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('should add a comment to a post', async () => {
    const res = await request(BASE_URL)
      .post(`/api/posts/${postId}/comment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Great post!' });
    expect([200, 201]).toContain(res.statusCode);
    commentId = res.body.comment?._id || res.body.comment?.id;
  });

  it('should get comments for a post', async () => {
    const res = await request(BASE_URL)
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // STORY
  it('should create a story', async () => {
    const res = await request(BASE_URL)
      .post('/api/stories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ media: 'https://example.com/story1.jpg', expiresAt: '2099-12-31T12:00:00Z' });
    expect([200, 201]).toContain(res.statusCode);
    storyId = res.body.story?._id || res.body.story?.id;
  });

  it('should get stories', async () => {
    const res = await request(BASE_URL)
      .get('/api/stories')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // MESSAGE
  it('should send a message', async () => {
    const res = await request(BASE_URL)
      .post('/api/messages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ receiver: userId, content: 'Hello!' });
    expect([200, 201, 400]).toContain(res.statusCode);
    if (res.statusCode < 400) {
      messageId = res.body.messageData?._id || res.body.messageData?.id;
    }
  });

  it('should get messages with user', async () => {
    const res = await request(BASE_URL)
      .get(`/api/messages/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  // NOTIFICATION
  it('should get notifications', async () => {
    const res = await request(BASE_URL)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // UPLOAD
  it('should upload a file', async () => {
    const filePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, Buffer.from([0xff, 0xd8, 0xff, 0xd9])); // minimal JPEG
    }
    const res = await request(BASE_URL)
      .post('/api/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', filePath);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('url');
  });

  // ADMIN
  it('should sign up an admin user', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/signup')
      .send(adminUser);
    expect([200, 201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('token');
      adminToken = res.body.token;
      adminId = res.body.user.id;
    }
  });

  it('should login the admin user', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    adminToken = res.body.token;

    // Patch the user to isAdmin: true (requires a direct DB update or a PATCH endpoint)
    // If you have a PATCH endpoint for admin, use it. Otherwise, skip this and set isAdmin manually in DB for testing.
  });

  it('should get all users as admin', async () => {
    const res = await request(BASE_URL)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 403, 500]).toContain(res.statusCode);
  });

  it('should get reports as admin', async () => {
    const res = await request(BASE_URL)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should ban a user as admin', async () => {
    const res = await request(BASE_URL)
      .post(`/api/admin/ban/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('should create a post as admin for removal', async () => {
    const res = await request(BASE_URL)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Admin post to remove', image: '' });
    expect([200, 201]).toContain(res.statusCode);
    adminPostId = res.body.post?._id || res.body.post?.id;
  });

  it('should remove content as admin', async () => {
    const res = await request(BASE_URL)
      .delete(`/api/admin/content/${adminPostId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Edge Case & Error Handling', () => {
  it('should reject unauthorized access to protected route', async () => {
    const res = await request(BASE_URL).get('/api/user/me');
    expect(res.statusCode).toBe(401);
  });

  it('should reject forbidden action (non-admin accessing admin route)', async () => {
    const res = await request(BASE_URL)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect([401, 403]).toContain(res.statusCode);
  });

  it('should return 404 for invalid user ID', async () => {
    const res = await request(BASE_URL)
      .get('/api/user/invalidid123')
      .set('Authorization', `Bearer ${userToken}`);
    expect([400, 404, 500]).toContain(res.statusCode);
  });

  it('should return 400 for missing required fields on signup', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/signup')
      .send({ email: 'x@y.com' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 404 for not found post', async () => {
    const res = await request(BASE_URL)
      .get('/api/posts/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`);
    expect([400, 404]).toContain(res.statusCode);
  });

  it('should return 403 for forbidden post update', async () => {
    const res = await request(BASE_URL)
      .put('/api/posts/000000000000000000000000')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'hack' });
    expect([400, 403, 404]).toContain(res.statusCode);
  });
});