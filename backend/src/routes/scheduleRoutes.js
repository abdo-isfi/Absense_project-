import express from 'express';
import {
  createSchedule,
  getAllSchedules,
  getScheduleByTeacher,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  checkScheduleConflicts,
  getScheduleStats,
} from '../controllers/scheduleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin-only routes
router.post('/', authorize('admin'), createSchedule);
router.get('/', authorize('admin', 'sg'), getAllSchedules);
router.get('/stats', authorize('admin'), getScheduleStats);
router.get('/teacher/:teacherId', authorize('admin', 'sg', 'teacher'), getScheduleByTeacher);
router.get('/:id', authorize('admin', 'sg', 'teacher'), getScheduleById);
router.put('/:id', authorize('admin'), updateSchedule);
router.delete('/:id', authorize('admin'), deleteSchedule);
router.post('/check-conflicts', authorize('admin'), checkScheduleConflicts);

export default router;
