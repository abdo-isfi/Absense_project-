import express from 'express';
import {
  markAbsence,
  getAbsenceStats,
  getGroupAbsences,
} from '../controllers/absenceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('sg', 'teacher', 'admin'), markAbsence);
router.get('/stats', authorize('sg', 'admin'), getAbsenceStats);
router.get('/group/:groupId', getGroupAbsences);

export default router;
