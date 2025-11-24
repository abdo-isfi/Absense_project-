import express from 'express';
import {
  markAbsence,
  getAbsenceStats,
  getGroupAbsences,
  getAllAbsences,
  updateTraineeAbsence,
  validateBulkAbsences,
} from '../controllers/absenceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllAbsences);
router.post('/', authorize('sg', 'teacher', 'admin'), markAbsence);
router.get('/stats', authorize('sg', 'admin'), getAbsenceStats);
router.get('/group/:groupId', getGroupAbsences);
router.post('/validate-bulk', authorize('sg', 'admin'), validateBulkAbsences);

export default router;

// Note: The updateTraineeAbsence route should be in a separate trainee-absences router
// or we need to create a separate route file for trainee absences
