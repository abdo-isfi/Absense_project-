import request from 'supertest';
import app from '../src/app.js';
import Teacher from '../src/models/Teacher.js';
import Group from '../src/models/Group.js';
import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  getAuthHeader,
} from './setup.js';

describe('Teacher API', () => {
  let token;

  beforeAll(async () => {
    await setupTestDB();
    const { token: authToken } = await createTestUser('admin');
    token = authToken;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    const { token: authToken } = await createTestUser('admin');
    token = authToken;
  });

  describe('GET /api/teachers', () => {
    it('should return all teachers', async () => {
      await Teacher.create([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          matricule: 'MAT001',
          password: 'password123',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          matricule: 'MAT002',
          password: 'password123',
        },
      ]);

      const res = await request(app).get('/api/teachers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/teachers', () => {
    it('should create a new teacher', async () => {
      const teacherData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        matricule: 'MAT001',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/teachers')
        .send(teacherData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('John');
      expect(res.body.data.mustChangePassword).toBe(true);
    });

    it('should reject teacher with duplicate email', async () => {
      await Teacher.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        matricule: 'MAT001',
        password: 'password123',
      });

      const res = await request(app)
        .post('/api/teachers')
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'john@example.com',
          matricule: 'MAT002',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject teacher with missing required fields', async () => {
      const res = await request(app)
        .post('/api/teachers')
        .send({
          first_name: 'John',
          email: 'john@example.com',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/teachers/:id', () => {
    it('should return teacher by ID', async () => {
      const teacher = await Teacher.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        matricule: 'MAT001',
        password: 'password123',
      });

      const res = await request(app).get(`/api/teachers/${teacher._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('John');
    });

    it('should return 404 for non-existent teacher', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/teachers/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/teachers/:id', () => {
    it('should update teacher', async () => {
      const teacher = await Teacher.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        matricule: 'MAT001',
        password: 'password123',
      });

      const res = await request(app)
        .put(`/api/teachers/${teacher._id}`)
        .send({
          first_name: 'Johnny',
          last_name: 'Updated',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Johnny');
    });

    it('should update teacher groups', async () => {
      const teacher = await Teacher.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        matricule: 'MAT001',
        password: 'password123',
      });

      const group = await Group.create({
        name: 'TDI101',
        filiere: 'TDI',
        annee: '2023',
      });

      const res = await request(app)
        .put(`/api/teachers/${teacher._id}`)
        .send({
          groups: ['TDI101'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.groups).toHaveLength(1);
    });
  });

  describe('DELETE /api/teachers/:id', () => {
    it('should delete teacher', async () => {
      const teacher = await Teacher.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        matricule: 'MAT001',
        password: 'password123',
      });

      const res = await request(app).delete(`/api/teachers/${teacher._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedTeacher = await Teacher.findById(teacher._id);
      expect(deletedTeacher).toBeNull();
    });
  });
});
