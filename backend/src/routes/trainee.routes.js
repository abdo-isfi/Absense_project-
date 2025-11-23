import express from 'express';
import {
  getTrainees,
  getTraineesWithStats,
  createTrainee,
  getTrainee,
  updateTrainee,
  deleteTrainee,
  deleteAllTrainees,
  getTraineeAbsences,
  getTraineeStatistics,
  bulkImport,
  importTrainees,
} from '../controllers/traineeController.js';
import upload from '../config/multer.js';
import { validate } from '../middleware/validate.js';
import { 
  createTraineeValidation, 
  updateTraineeValidation,
  cefValidation 
} from '../utils/validationSchemas.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/with-stats', getTraineesWithStats);
router.delete('/delete-all', deleteAllTrainees);
router.post('/bulk-import', bulkImport);
router.post('/import', uploadLimiter, upload.single('file'), importTrainees);

router.route('/')
  .get(getTrainees)
  .post(createTraineeValidation, validate, createTrainee);

router.route('/:cef')
  .get(cefValidation, validate, getTrainee)
  .put(cefValidation, updateTraineeValidation, validate, updateTrainee)
  .delete(cefValidation, validate, deleteTrainee);

router.get('/:cef/absences', cefValidation, validate, getTraineeAbsences);
router.get('/:cef/statistics', cefValidation, validate, getTraineeStatistics);

export default router;
