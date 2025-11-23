import express from 'express';
import {
  getGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  getGroupTrainees,
} from '../controllers/groupController.js';
import {
  getGroupAbsencesByName,
  getWeeklyReport,
} from '../controllers/absenceController.js';

const router = express.Router();

router.route('/')
  .get(getGroups)
  .post(createGroup);

router.get('/:group/absences', getGroupAbsencesByName);
router.get('/:group/weekly-report', getWeeklyReport);
router.get('/:group/trainees', getGroupTrainees);

router.route('/:id')
  .get(getGroup)
  .put(updateGroup)
  .delete(deleteGroup);

export default router;
