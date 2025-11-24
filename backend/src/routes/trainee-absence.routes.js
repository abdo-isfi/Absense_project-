import express from 'express';
import { updateTraineeAbsence } from '../controllers/absenceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.patch('/:id', updateTraineeAbsence);

export default router;
