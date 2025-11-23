import express from 'express';
import {
  getTeachers,
  createTeacher,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  uploadSchedule,
} from '../controllers/teacherController.js';
import upload from '../config/multer.js';

const router = express.Router();

router.route('/')
  .get(getTeachers)
  .post(createTeacher);

router.route('/:id')
  .get(getTeacher)
  .put(updateTeacher)
  .delete(deleteTeacher);

router.post('/:id/schedule', upload.single('schedule'), uploadSchedule);

export default router;
