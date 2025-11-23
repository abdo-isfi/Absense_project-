import express from 'express';
import {
  getAllTeachers,
  createTeacher,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  uploadSchedule,
} from '../controllers/teacherController.js';
import { protect } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllTeachers)
  .post(createTeacher);

router.route('/:id')
  .get(getTeacher)
  .put(updateTeacher)
  .delete(deleteTeacher);

router.post('/:id/schedule', upload.single('schedule'), uploadSchedule);

export default router;
