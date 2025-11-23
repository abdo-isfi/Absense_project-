import request from 'supertest';
import app from '../src/app.js';
import AbsenceRecord from '../src/models/AbsenceRecord.js';
import TraineeAbsence from '../src/models/TraineeAbsence.js';
import Group from '../src/models/Group.js';
import Trainee from '../src/models/Trainee.js';
import Teacher from '../src/models/Teacher.js';
import {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  getAuthHeader,
} from './setup.js';

describe('Absence API', () => {
  let token, group, trainee, teacher;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    const { token: authToken } = await createTestUser('admin');
    token = authToken;

    // Create test data
    group = await Group.create({
      name: 'TDI101',
      filiere: 'TDI',
      annee: '2023',
    });

    trainee = await Trainee.create({
      cef: 'CEF001',
      name: 'Doe',
      firstName: 'John',
      groupe: 'TDI101',
      groupId: group._id,
    });

    teacher = await Teacher.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'teacher@example.com',
      matricule: 'MAT001',
      password: 'password123',
    });
  });

  describe('POST /api/absences', () => {
    it('should create absence record with trainees', async () => {
      const absenceData = {
        date: '2025-11-19',
        group_id: group._id.toString(),
        teacher_id: teacher._id.toString(),
        start_time: '08:00',
        end_time: '10:00',
        students: [
          {
            trainee_id: trainee._id.toString(),
            status: 'absent',
          },
        ],
      };

      const res = await request(app)
        .post('/api/absences')
        .send(absenceData);

      expect(res.status).toBe(201);
      expect(res.body.groupId).toBeDefined();
      expect(res.body.traineeAbsences).toHaveLength(1);
    });

    it('should reject absence with invalid time format', async () => {
      const absenceData = {
        date: '2025-11-19',
        group_id: group._id.toString(),
        start_time: '25:00', // Invalid
        end_time: '10:00',
        students: [
          {
            trainee_id: trainee._id.toString(),
            status: 'absent',
          },
        ],
      };

      const res = await request(app)
        .post('/api/absences')
        .send(absenceData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/absences', () => {
    it('should return all absence records', async () => {
      await AbsenceRecord.create({
        date: new Date('2025-11-19'),
        groupId: group._id,
        teacherId: teacher._id,
        startTime: '08:00',
        endTime: '10:00',
      });

      const res = await request(app).get('/api/absences');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should filter absences by group', async () => {
      await AbsenceRecord.create({
        date: new Date('2025-11-19'),
        groupId: group._id,
        startTime: '08:00',
        endTime: '10:00',
      });

      const res = await request(app)
        .get('/api/absences')
        .query({ group_id: group._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/absences/validate', () => {
    it('should validate trainee absences', async () => {
      const absenceRecord = await AbsenceRecord.create({
        date: new Date('2025-11-19'),
        groupId: group._id,
        startTime: '08:00',
        endTime: '10:00',
      });

      const traineeAbsence = await TraineeAbsence.create({
        traineeId: trainee._id,
        absenceRecordId: absenceRecord._id,
        status: 'absent',
      });

      const res = await request(app)
        .post('/api/absences/validate')
        .send({
          trainee_absence_ids: [traineeAbsence._id.toString()],
          is_validated: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.validated_count).toBe(1);
    });
  });

  describe('POST /api/absences/justify', () => {
    it('should justify trainee absences', async () => {
      const absenceRecord = await AbsenceRecord.create({
        date: new Date('2025-11-19'),
        groupId: group._id,
        startTime: '08:00',
        endTime: '10:00',
      });

      const traineeAbsence = await TraineeAbsence.create({
        traineeId: trainee._id,
        absenceRecordId: absenceRecord._id,
        status: 'absent',
        absenceHours: 2,
      });

      const res = await request(app)
        .post('/api/absences/justify')
        .send({
          trainee_absence_ids: [traineeAbsence._id.toString()],
          is_justified: 'justified',
          justification_comment: 'Medical certificate',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.justified_count).toBe(1);

      // Verify absence hours set to 0
      const updated = await TraineeAbsence.findById(traineeAbsence._id);
      expect(updated.absenceHours).toBe(0);
    });
  });

  describe('GET /api/groups/:group/weekly-report', () => {
    it('should generate weekly report', async () => {
      const res = await request(app)
        .get('/api/groups/TDI101/weekly-report')
        .query({
          start_date: '2025-11-18',
          end_date: '2025-11-22',
        });

      expect(res.status).toBe(200);
      expect(res.body.group).toBeDefined();
      expect(res.body.days).toBeDefined();
      expect(res.body.trainees).toBeDefined();
    });

    it('should require start_date and end_date', async () => {
      const res = await request(app)
        .get('/api/groups/TDI101/weekly-report');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
