import request from 'supertest';
import app from '../src/app.js';
import Trainee from '../src/models/Trainee.js';
import Group from '../src/models/Group.js';
import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  getAuthHeader,
} from './setup.js';

describe('Trainee API', () => {
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
    // Recreate user for token
    const { token: authToken } = await createTestUser('admin');
    token = authToken;
  });

  describe('GET /api/trainees', () => {
    it('should return all trainees', async () => {
      await Trainee.create([
        { cef: 'CEF001', name: 'Doe', firstName: 'John', groupe: 'TDI101' },
        { cef: 'CEF002', name: 'Smith', firstName: 'Jane', groupe: 'TDI101' },
      ]);

      const res = await request(app).get('/api/trainees');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should filter trainees by group', async () => {
      await Trainee.create([
        { cef: 'CEF001', name: 'Doe', firstName: 'John', groupe: 'TDI101' },
        { cef: 'CEF002', name: 'Smith', firstName: 'Jane', groupe: 'TDI102' },
      ]);

      const res = await request(app).get('/api/trainees?group=TDI101');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].groupe).toBe('TDI101');
    });
  });

  describe('POST /api/trainees', () => {
    it('should create a new trainee with valid data', async () => {
      const traineeData = {
        cef: 'CEF001',
        name: 'Doe',
        first_name: 'John',
        groupe: 'TDI101',
      };

      const res = await request(app)
        .post('/api/trainees')
        .send(traineeData);

      expect(res.status).toBe(201);
      expect(res.body.cef).toBe('CEF001');
      expect(res.body.name).toBe('Doe');
    });

    it('should reject trainee with missing required fields', async () => {
      const res = await request(app)
        .post('/api/trainees')
        .send({
          cef: 'CEF001',
          name: 'Doe',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate CEF', async () => {
      await Trainee.create({
        cef: 'CEF001',
        name: 'Doe',
        firstName: 'John',
        groupe: 'TDI101',
      });

      const res = await request(app)
        .post('/api/trainees')
        .send({
          cef: 'CEF001',
          name: 'Smith',
          first_name: 'Jane',
          groupe: 'TDI102',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/trainees/:cef', () => {
    it('should return trainee by CEF', async () => {
      await Trainee.create({
        cef: 'CEF001',
        name: 'Doe',
        firstName: 'John',
        groupe: 'TDI101',
      });

      const res = await request(app).get('/api/trainees/CEF001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cef).toBe('CEF001');
    });

    it('should return 404 for non-existent trainee', async () => {
      const res = await request(app).get('/api/trainees/NONEXISTENT');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/trainees/:cef', () => {
    it('should update trainee', async () => {
      await Trainee.create({
        cef: 'CEF001',
        name: 'Doe',
        firstName: 'John',
        groupe: 'TDI101',
      });

      const res = await request(app)
        .put('/api/trainees/CEF001')
        .send({
          name: 'Updated',
          first_name: 'Johnny',
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated');
      expect(res.body.firstName).toBe('Johnny');
    });

    it('should return 404 when updating non-existent trainee', async () => {
      const res = await request(app)
        .put('/api/trainees/NONEXISTENT')
        .send({
          name: 'Updated',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/trainees/:cef', () => {
    it('should delete trainee', async () => {
      await Trainee.create({
        cef: 'CEF001',
        name: 'Doe',
        firstName: 'John',
        groupe: 'TDI101',
      });

      const res = await request(app).delete('/api/trainees/CEF001');

      expect(res.status).toBe(204);

      const trainee = await Trainee.findOne({ cef: 'CEF001' });
      expect(trainee).toBeNull();
    });

    it('should return 404 when deleting non-existent trainee', async () => {
      const res = await request(app).delete('/api/trainees/NONEXISTENT');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/trainees/:cef/statistics', () => {
    it('should return trainee statistics', async () => {
      await Trainee.create({
        cef: 'CEF001',
        name: 'Doe',
        firstName: 'John',
        groupe: 'TDI101',
      });

      const res = await request(app).get('/api/trainees/CEF001/statistics');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_absence_hours');
      expect(res.body).toHaveProperty('disciplinary_note');
      expect(res.body).toHaveProperty('late_count');
      expect(res.body).toHaveProperty('absent_count');
    });
  });

  describe('POST /api/trainees/bulk-import', () => {
    it('should import multiple trainees', async () => {
      const trainees = [
        { cef: 'CEF001', name: 'Doe', first_name: 'John', groupe: 'TDI101' },
        { cef: 'CEF002', name: 'Smith', first_name: 'Jane', groupe: 'TDI101' },
      ];

      const res = await request(app)
        .post('/api/trainees/bulk-import')
        .send({ trainees });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.imported).toBe(2);
    });

    it('should handle errors in bulk import', async () => {
      const trainees = [
        { cef: 'CEF001', name: 'Doe', first_name: 'John', groupe: 'TDI101' },
        { cef: 'CEF001', name: 'Duplicate', first_name: 'Dup', groupe: 'TDI101' }, // Duplicate
      ];

      const res = await request(app)
        .post('/api/trainees/bulk-import')
        .send({ trainees });

      expect(res.status).toBe(200);
      expect(res.body.imported).toBe(1);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });
});
