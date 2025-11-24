import AbsenceRecord from '../models/AbsenceRecord.js';
import TraineeAbsence from '../models/TraineeAbsence.js';
import Trainee from '../models/Trainee.js';
import Group from '../models/Group.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';
import moment from 'moment';

// @desc    Mark absence for a group
// @route   POST /api/absences
// @access  Private (SG/Teacher)
export const markAbsence = asyncHandler(async (req, res) => {
  const { 
    groupId,
    groupe, // Accept group name as well
    date, 
    startTime, 
    endTime, 
    subject, 
    absences // Array of { traineeId, status }
  } = req.body;

  // If groupe (name) is provided instead of groupId, look it up
  let finalGroupId = groupId;
  if (!finalGroupId && groupe) {
    const group = await Group.findOne({ name: groupe });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: `Group "${groupe}" not found`
      });
    }
    finalGroupId = group._id;
  }

  if (!finalGroupId) {
    return res.status(400).json({
      success: false,
      message: 'Group ID or group name is required'
    });
  }

  // Check for existing absence record for this group and date
  const existingRecord = await AbsenceRecord.findOne({
    groupId: finalGroupId,
    date: date
  });

  if (existingRecord) {
    // Delete associated trainee absences
    await TraineeAbsence.deleteMany({ absenceRecordId: existingRecord._id });
    // Delete the record itself
    await AbsenceRecord.deleteOne({ _id: existingRecord._id });
  }

  // Create Absence Record
  const absenceRecord = await AbsenceRecord.create({
    groupId: finalGroupId,
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
// @desc    Get absences by group and date
// @route   GET /api/absences/group/:groupId
// @access  Private
export const getGroupAbsences = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { date } = req.query;

  // Check if groupId is a valid ObjectId, if not try to find group by name
  let finalGroupId = groupId;
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    const groupDoc = await Group.findOne({ name: groupId });
    if (!groupDoc) {
      return res.status(404).json({
        success: false,
        message: `Group "${groupId}" not found`
      });
    }
    finalGroupId = groupDoc._id;
  }

  const query = { groupId: finalGroupId };
  if (date) {
    query.date = date; // Exact match on date string YYYY-MM-DD
  }

  const records = await AbsenceRecord.find(query)
    .populate('teacherId', 'name firstName lastName')
    .sort({ date: -1, startTime: -1 });

  // For each record, get the trainee absences
  const recordsWithDetails = await Promise.all(
    records.map(async (record) => {
      const traineeAbsences = await TraineeAbsence.find({
        absenceRecordId: record._id
      }).populate('traineeId', 'cef CEF name NOM firstName PRENOM');

      return {
        ...record.toObject(),
        group: record.groupId,
        teacher: record.teacherId,
        trainee_absences: traineeAbsences.map(ta => ({
          ...ta.toObject(),
          trainee: ta.traineeId,
          id: ta._id,
          is_validated: ta.isValidated,
          is_justified: ta.isJustified,
          has_billet_entree: ta.hasBilletEntree,
          absence_hours: ta.absenceHours,
          justification_comment: ta.justificationComment,
        }))
      };
    })
  );

  res.json({
    success: true,
    data: recordsWithDetails,
  });
});

// @desc    Get absences by group name (for group routes)
// @route   GET /api/groups/:group/absences
// @access  Private
export const getGroupAbsencesByName = asyncHandler(async (req, res) => {
  const { group } = req.params; // param is :group in group.routes.js
  const { date } = req.query;

  // Find the group by name
  const groupDoc = await Group.findOne({ name: group });
  if (!groupDoc) {
    return res.status(404).json({
      success: false,
      message: `Group "${group}" not found`
    });
  }

  // Build query using the group's ObjectId
  const query = { groupId: groupDoc._id };
  if (date) {
    query.date = new Date(date);
  }

  // Find absence records
  const records = await AbsenceRecord.find(query)
    .populate('teacherId', 'name firstName lastName')
    .sort({ date: -1, startTime: -1 });

  // For each record, get the trainee absences
  const recordsWithDetails = await Promise.all(
    records.map(async (record) => {
      const traineeAbsences = await TraineeAbsence.find({
        absenceRecordId: record._id
      }).populate('traineeId', 'cef name firstName');

      return {
        ...record.toObject(),
        absences: traineeAbsences
      };
    })
  );

  res.json({
    success: true,
    data: recordsWithDetails,
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

// @desc    Get all absences with trainee details
// @route   GET /api/absences
// @access  Private
export const getAllAbsences = asyncHandler(async (req, res) => {
  // Find all absence records
  const records = await AbsenceRecord.find()
    .populate('groupId', 'name code')
    .populate('teacherId', 'name firstName lastName')
    .sort({ date: -1, startTime: -1 });

  // For each record, get the trainee absences
  const recordsWithDetails = await Promise.all(
    records.map(async (record) => {
      const traineeAbsences = await TraineeAbsence.find({
        absenceRecordId: record._id
      }).populate('traineeId', 'cef CEF name NOM firstName PRENOM');

      return {
        ...record.toObject(),
        group: record.groupId,
        teacher: record.teacherId,
        trainee_absences: traineeAbsences.map(ta => ({
          ...ta.toObject(),
          trainee: ta.traineeId,
          id: ta._id,
          is_validated: ta.isValidated,
          is_justified: ta.isJustified,
          has_billet_entree: ta.hasBilletEntree,
          absence_hours: ta.absenceHours,
          justification_comment: ta.justificationComment,
        }))
      };
    })
  );

  res.json({
    success: true,
    data: recordsWithDetails,
  });
});

// @desc    Update trainee absence
// @route   PATCH /api/trainee-absences/:id
// @access  Private
export const updateTraineeAbsence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const traineeAbsence = await TraineeAbsence.findById(id);
  
  if (!traineeAbsence) {
    return res.status(404).json({
      success: false,
      message: 'Trainee absence not found'
    });
  }

  // Map frontend field names to backend field names
  if (updates.is_justified !== undefined) {
    traineeAbsence.isJustified = updates.is_justified;
  }
  if (updates.is_validated !== undefined) {
    traineeAbsence.isValidated = updates.is_validated;
  }
  if (updates.has_billet_entree !== undefined) {
    traineeAbsence.hasBilletEntree = updates.has_billet_entree;
  }
  if (updates.justification_comment !== undefined) {
    traineeAbsence.justificationComment = updates.justification_comment;
  }
  if (updates.status !== undefined) {
    traineeAbsence.status = updates.status;
  }
  if (updates.absence_hours !== undefined) {
    traineeAbsence.absenceHours = updates.absence_hours;
  }

  await traineeAbsence.save();

  res.json({
    success: true,
    data: traineeAbsence,
  });
});

// @desc    Validate absences in bulk
// @route   POST /api/absences/validate-bulk
// @access  Private (SG/Admin)
export const validateBulkAbsences = asyncHandler(async (req, res) => {
  const { group, date, absenceIds } = req.body;

  if (!absenceIds || absenceIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No absence IDs provided'
    });
  }

  // Update all trainee absences
  const result = await TraineeAbsence.updateMany(
    { _id: { $in: absenceIds } },
    { 
      $set: { 
        isValidated: true,
        validatedBy: req.user._id,
        validatedAt: new Date()
      } 
    }
  );

  res.json({
    success: true,
    message: `${result.modifiedCount} absences validated successfully`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});

