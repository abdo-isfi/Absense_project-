import express from 'express';
import {
  getAbsences,
  createAbsence,
  getAbsence,
  updateAbsence,
  deleteAbsence,
  getGroupAbsencesByName,
  validateAbsences,
  justifyAbsences,
  markBilletEntree,
  updateTraineeAbsence,
  updateSingleColumn,
  getAllTraineeAbsencesWithTrainee,
  validateDisplayedAbsences,
  getWeeklyReport,
} from '../controllers/absenceController.js';

const router = express.Router();

// Special routes first
router.post('/validate', validateAbsences);
router.post('/validate-displayed', validateDisplayedAbsences);
router.post('/justify', justifyAbsences);
router.get('/trainee-absences-with-trainee', getAllTraineeAbsencesWithTrainee);

// Resource routes
router.route('/')
  .get(getAbsences)
  .post(createAbsence);

router.route('/:id')
  .get(getAbsence)
  .put(updateAbsence)
  .delete(deleteAbsence);

router.patch('/:id/billet-entree', markBilletEntree);

// Trainee absence routes
router.patch('/trainee-absences/:id', updateTraineeAbsence);
router.patch('/trainee-absences/:id/update-column', updateSingleColumn);

export default router;

// Note: Group-specific routes are in group.routes.js
// - GET /groups/:group/absences -> getGroupAbsencesByName
// - GET /groups/:group/weekly-report -> getWeeklyReport
