import AbsenceRecord from '../models/AbsenceRecord.js';
import TraineeAbsence from '../models/TraineeAbsence.js';
import Trainee from '../models/Trainee.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import moment from 'moment';

// @desc    Mark absence for a group
// @route   POST /api/absences
// @access  Private (SG/Teacher)
export const markAbsence = asyncHandler(async (req, res) => {
  const { 
    groupId, 
    date, 
    startTime, 
    endTime, 
    subject, 
    absences // Array of { traineeId, status }
  } = req.body;

  // Create Absence Record
  const absenceRecord = await AbsenceRecord.create({
    groupId,
    date,
    startTime,
    endTime,
    subject,
    teacherId: req.user._id, // Assuming teacher marks it, or SG
    recordedBy: req.user._id,
  });

  // Create Trainee Absence entries
  const traineeAbsences = [];
  for (const abs of absences) {
    if (abs.status !== 'present') {
      const traineeAbsence = await TraineeAbsence.create({
        traineeId: abs.traineeId,
        absenceRecordId: absenceRecord._id,
        status: abs.status,
      });
      traineeAbsences.push(traineeAbsence);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Absences recorded successfully',
    data: {
      record: absenceRecord,
      details: traineeAbsences,
    },
  });
});

// @desc    Get absence stats for dashboard
// @route   GET /api/absences/stats
// @access  Private (SG/Admin)
export const getAbsenceStats = asyncHandler(async (req, res) => {
  const today = moment().startOf('day');
  
  // Total Absences Today
  const todayAbsences = await TraineeAbsence.countDocuments({
    createdAt: {
      $gte: today.toDate(),
      $lt: moment(today).endOf('day').toDate(),
    },
    status: 'absent',
  });

  // Total Late Today
  const todayLate = await TraineeAbsence.countDocuments({
    createdAt: {
      $gte: today.toDate(),
      $lt: moment(today).endOf('day').toDate(),
    },
    status: 'late',
  });

  // Total Trainees (for context)
  const totalTrainees = await Trainee.countDocuments();

  // Calculate Absence Rate (Rough approximation)
  // This would ideally be (Total Absence Hours / Total Scheduled Hours) * 100
  // For now, we can return raw counts
  
  res.json({
    success: true,
    data: {
      todayAbsences,
      todayLate,
      totalTrainees,
    },
  });
});

// @desc    Get absences by group and date
// @route   GET /api/absences/group/:groupId
// @access  Private
export const getGroupAbsences = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { date } = req.query;

  const query = { groupId };
  if (date) {
    query.date = date; // Exact match on date string YYYY-MM-DD
  }

  const records = await AbsenceRecord.find(query)
    .populate('teacherId', 'name firstName lastName')
    .sort({ date: -1, startTime: -1 });

  res.json({
    success: true,
    data: records,
  });
});

// @desc    Get absences by group name (for group routes)
// @route   GET /api/groups/:group/absences
// @access  Private
export const getGroupAbsencesByName = asyncHandler(async (req, res) => {
  const { group } = req.params; // param is :group in group.routes.js
  const { date } = req.query;

  const query = { groupId: group }; // groupId in model stores the name/code
  if (date) {
    query.date = date;
  }

  const records = await AbsenceRecord.find(query)
    .populate('teacherId', 'name firstName lastName')
    .sort({ date: -1, startTime: -1 });

  res.json({
    success: true,
    data: records,
  });
});

// @desc    Get weekly report for a group
// @route   GET /api/groups/:group/weekly-report
// @access  Private
export const getWeeklyReport = asyncHandler(async (req, res) => {
  const { group } = req.params;
  const { startDate, endDate } = req.query;

  const query = { groupId: group };
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  const records = await AbsenceRecord.find(query)
    .sort({ date: 1, startTime: 1 });

  res.json({
    success: true,
    data: records,
  });
});
