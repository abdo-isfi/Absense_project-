import request from 'supertest';
import app from '../src/app.js';
import Group from '../src/models/Group.js';
import Trainee from '../src/models/Trainee.js';
import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  getAuthHeader,
} from './setup.js';

describe('Group API', () => {
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

  describe('GET /api/groups', () => {
    it('should return all groups', async () => {
      await Group.create([
        { name: 'TDI101', filiere: 'TDI', annee: '2023' },
        { name: 'TDI102', filiere: 'TDI', annee: '2023' },
      ]);

      const res = await request(app).get('/api/groups');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty array when no groups exist', async () => {
      const res = await request(app).get('/api/groups');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const groupData = {
        name: 'TDI101',
        filiere: 'TDI',
        annee: '2023',
      };

      const res = await request(app)
        .post('/api/groups')
        .send(groupData);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('TDI101');
      expect(res.body.filiere).toBe('TDI');
    });

    it('should reject duplicate group name', async () => {
      await Group.create({ name: 'TDI101', filiere: 'TDI', annee: '2023' });

      const res = await request(app)
        .post('/api/groups')
        .send({ name: 'TDI101', filiere: 'TDI', annee: '2024' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject group without name', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({ filiere: 'TDI' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should return group by ID', async () => {
      const group = await Group.create({
        name: 'TDI101',
        filiere: 'TDI',
        annee: '2023',
      });

      const res = await request(app).get(`/api/groups/${group._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('TDI101');
    });

    it('should return 404 for non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/groups/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update group', async () => {
      const group = await Group.create({
        name: 'TDI101',
        filiere: 'TDI',
        annee: '2023',
      });

      const res = await request(app)
        .put(`/api/groups/${group._id}`)
        .send({ annee: '2024' });

      expect(res.status).toBe(200);
      expect(res.body.annee).toBe('2024');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete group', async () => {
      const group = await Group.create({
        name: 'TDI101',
        filiere: 'TDI',
        annee: '2023',
      });

      const res = await request(app).delete(`/api/groups/${group._id}`);

      expect(res.status).toBe(204);

      const deletedGroup = await Group.findById(group._id);
      expect(deletedGroup).toBeNull();
    });
  });

  describe('GET /api/groups/:group/trainees', () => {
    it('should return trainees in a group', async () => {
      const group = await Group.create({
        name: 'TDI101',
        filiere: 'TDI',
        annee: '2023',
      });

      await Trainee.create([
        { cef: 'CEF001', name: 'Doe', firstName: 'John', groupe: 'TDI101' },
        { cef: 'CEF002', name: 'Smith', firstName: 'Jane', groupe: 'TDI101' },
        { cef: 'CEF003', name: 'Brown', firstName: 'Bob', groupe: 'TDI102' },
      ]);

      const res = await request(app).get('/api/groups/TDI101/trainees');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].groupe).toBe('TDI101');
    });

    it('should return 404 for non-existent group', async () => {
      const res = await request(app).get('/api/groups/NONEXISTENT/trainees');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
