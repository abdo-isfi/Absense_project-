import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Teacher from '../src/models/Teacher.js';
import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  createTestTeacher,
  getAuthHeader,
} from './setup.js';

describe('Authentication API', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should login admin user with valid credentials', async () => {
      // Create admin user
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@example.com');
      expect(res.body.user.role).toBe('admin');
    });

    it('should login teacher with valid credentials', async () => {
      await Teacher.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'teacher@example.com',
        matricule: 'MAT001',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('teacher');
      expect(res.body.user.first_name).toBe('John');
    });

    it('should reject login with invalid credentials', async () => {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('incorrect');
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notanemail',
          password: 'password123',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const { token } = await createTestUser('admin');

      const res = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test-admin@example.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set({ Authorization: 'Bearer invalidtoken' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid data', async () => {
      const { token } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send({
          current_password: 'password123',
          new_password: 'newpassword123',
          new_password_confirmation: 'newpassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('changed successfully');
    });

    it('should reject with incorrect current password', async () => {
      const { token } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send({
          current_password: 'wrongpassword',
          new_password: 'newpassword123',
          new_password_confirmation: 'newpassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject when passwords do not match', async () => {
      const { token } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send({
          current_password: 'password123',
          new_password: 'newpassword123',
          new_password_confirmation: 'differentpassword',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', async () => {
      const { token } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send({
          current_password: 'password123',
          new_password: 'short',
          new_password_confirmation: 'short',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const { token } = await createTestUser('admin');

      const res = await request(app)
        .post('/api/auth/logout')
        .set(getAuthHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
