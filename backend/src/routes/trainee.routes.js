import express from 'express';
import {
  createTrainee,
  getAllTrainees,
  getTraineeById,
  updateTrainee,
  deleteTrainee,
  importTrainees,
  getTraineesWithStats,
  deleteAllTrainees,
} from '../controllers/traineeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('sg', 'admin'), createTrainee)
  .get(getAllTrainees);

router.post('/import', authorize('sg', 'admin'), importTrainees);
router.get('/with-stats', authorize('sg', 'admin'), getTraineesWithStats);
router.delete('/delete-all', authorize('sg', 'admin'), deleteAllTrainees);

router
  .route('/:id')
  .get(getTraineeById)
  .put(authorize('sg', 'admin'), updateTrainee)
  .delete(authorize('sg', 'admin'), deleteTrainee);

export default router;
