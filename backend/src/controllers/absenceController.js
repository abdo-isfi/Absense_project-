import AbsenceRecord from '../models/AbsenceRecord.js';
import TraineeAbsence from '../models/TraineeAbsence.js';
import Group from '../models/Group.js';
import Trainee from '../models/Trainee.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import moment from 'moment';

// @desc    Get all absence records
// @route   GET /api/absences
// @access  Public
export const getAbsences = asyncHandler(async (req, res) => {
  const { group_id, date, start_date, end_date } = req.query;
  
  const query = {};
  
  if (group_id) query.groupId = group_id;
  if (date) query.date = new Date(date);
  if (start_date && end_date) {
    query.date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date),
    };
  }
  
  const records = await AbsenceRecord.find(query)
    .populate('groupId')
    .populate('teacherId')
    .populate({
      path: 'traineeAbsences',
      populate: { path: 'traineeId' }
    })
    .sort({ date: -1 });
  
  res.json(records);
});

// Virtual populate for traineeAbsences
AbsenceRecord.schema.virtual('traineeAbsences', {
  ref: 'TraineeAbsence',
  localField: '_id',
  foreignField: 'absenceRecordId',
});

AbsenceRecord.schema.set('toJSON', { virtuals: true });
AbsenceRecord.schema.set('toObject', { virtuals: true });

// @desc    Create absence record
// @route   POST /api/absences
// @access  Public
export const createAbsence = asyncHandler(async (req, res) => {
  const { date, group_id, teacher_id, start_time, end_time, students } = req.body;

  // Create absence record
  const absenceRecord = await AbsenceRecord.create({
    date: new Date(date),
    groupId: group_id,
    teacherId: teacher_id || null,
    startTime: start_time,
    endTime: end_time,
    isValidated: false,
  });

  // Create trainee absences
  const traineeAbsences = [];
  
  for (const student of students) {
    const traineeAbsence = await TraineeAbsence.create({
      traineeId: student.trainee_id,
      absenceRecordId: absenceRecord._id,
      status: student.status,
      isValidated: false,
      isJustified: false,
      hasBilletEntree: false,
    });
    
    traineeAbsences.push(traineeAbsence);
  }

  // Populate and return
  await absenceRecord.populate(['groupId', 'teacherId']);
  
  res.status(201).json({
    ...absenceRecord.toObject(),
    traineeAbsences,
  });
});

// @desc    Get single absence record
// @route   GET /api/absences/:id
// @access  Public
export const getAbsence = asyncHandler(async (req, res) => {
  const absenceRecord = await AbsenceRecord.findById(req.params.id)
    .populate('groupId')
    .populate('teacherId')
    .populate({
      path: 'traineeAbsences',
      populate: { path: 'traineeId' }
    });

  if (!absenceRecord) {
    return res.status(404).json({
      success: false,
      message: 'Absence record not found',
    });
  }

  res.json(absenceRecord);
});

// @desc    Update absence record
// @route   PUT /api/absences/:id
// @access  Public
export const updateAbsence = asyncHandler(async (req, res) => {
  const absenceRecord = await AbsenceRecord.findById(req.params.id);

  if (!absenceRecord) {
    return res.status(404).json({
      success: false,
      message: 'Absence record not found',
    });
  }

  const { date, group_id, teacher_id, start_time, end_time, students, is_validated } = req.body;

  if (date) absenceRecord.date = new Date(date);
  if (group_id) absenceRecord.groupId = group_id;
  if (teacher_id !== undefined) absenceRecord.teacherId = teacher_id;
  if (start_time) absenceRecord.startTime = start_time;
  if (end_time) absenceRecord.endTime = end_time;
  if (is_validated !== undefined) absenceRecord.isValidated = is_validated;

  await absenceRecord.save();

  // Update students if provided
  if (students && Array.isArray(students)) {
    // Delete existing trainee absences
    await TraineeAbsence.deleteMany({ absenceRecordId: absenceRecord._id });
    
    // Create new ones
    for (const student of students) {
      await TraineeAbsence.create({
        traineeId: student.trainee_id,
        absenceRecordId: absenceRecord._id,
        status: student.status,
        isValidated: false,
        isJustified: false,
        hasBilletEntree: false,
      });
    }
  } else if (start_time || end_time) {
    // Recalculate absence hours for existing trainee absences
    const traineeAbsences = await TraineeAbsence.find({ absenceRecordId: absenceRecord._id });
    for (const ta of traineeAbsences) {
      ta.absenceHours = await ta.calculateAbsenceHours();
      await ta.save();
    }
  }

  await absenceRecord.populate(['groupId', 'teacherId']);

  res.json(absenceRecord);
});

// @desc    Delete absence record
// @route   DELETE /api/absences/:id
// @access  Public
export const deleteAbsence = asyncHandler(async (req, res) => {
  const absenceRecord = await AbsenceRecord.findById(req.params.id);

  if (!absenceRecord) {
    return res.status(404).json({
      success: false,
      message: 'Absence record not found',
    });
  }

  // Delete related trainee absences
  await TraineeAbsence.deleteMany({ absenceRecordId: absenceRecord._id });
  
  await absenceRecord.deleteOne();

  res.status(204).send();
});

// @desc    Get group absences by name
// @route   GET /api/groups/:group/absences
// @access  Public
export const getGroupAbsencesByName = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ name: req.params.group });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  const { date, start_date, end_date } = req.query;
  const query = { groupId: group._id };

  if (date) query.date = new Date(date);
  if (start_date && end_date) {
    query.date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date),
    };
  }

  const records = await AbsenceRecord.find(query)
    .populate({
      path: 'traineeAbsences',
      populate: { path: 'traineeId' }
    })
    .sort({ date: -1 });

  res.json(records);
});

// @desc    Validate absences
// @route   POST /api/absences/validate
// @access  Public
export const validateAbsences = asyncHandler(async (req, res) => {
  const { trainee_absence_ids, trainee_absence_id, is_validated, validation_comment } = req.body;

  const absenceIds = trainee_absence_ids || [trainee_absence_id];
  let count = 0;
  const errors = [];

  for (const absenceId of absenceIds) {
    try {
      const traineeAbsence = await TraineeAbsence.findById(absenceId);
      
      if (traineeAbsence) {
        traineeAbsence.isValidated = is_validated ?? true;
        traineeAbsence.validationComment = validation_comment || null;
        traineeAbsence.validatedAt = new Date();
        await traineeAbsence.save();
        count++;
      }
    } catch (error) {
      errors.push({ id: absenceId, error: error.message });
    }
  }

  res.json({
    success: true,
    validated_count: count,
    errors,
  });
});

// @desc    Justify absences
// @route   POST /api/absences/justify
// @access  Public
export const justifyAbsences = asyncHandler(async (req, res) => {
  const { trainee_absence_ids, trainee_absence_id, is_justified, justification_comment, has_billet_entree } = req.body;

  const absenceIds = trainee_absence_ids || [trainee_absence_id];
  let count = 0;
  const errors = [];

  const isJustifiedBoolean = is_justified === 'justified';

  for (const absenceId of absenceIds) {
    try {
      const traineeAbsence = await TraineeAbsence.findById(absenceId);
      
      if (traineeAbsence) {
        traineeAbsence.isJustified = isJustifiedBoolean;
        traineeAbsence.justificationComment = justification_comment || null;
        traineeAbsence.hasBilletEntree = has_billet_entree ?? false;
        
        // Justified absences have 0 hours
        if (isJustifiedBoolean) {
          traineeAbsence.absenceHours = 0;
        }
        
        await traineeAbsence.save();
        count++;
      }
    } catch (error) {
      errors.push({ id: absenceId, error: error.message });
    }
  }

  res.json({
    success: true,
    justified_count: count,
    errors,
  });
});

// @desc    Mark billet entree
// @route   PATCH /api/absences/:id/billet-entree
// @access  Public
export const markBilletEntree = asyncHandler(async (req, res) => {
  const traineeAbsence = await TraineeAbsence.findById(req.params.id);

  if (!traineeAbsence) {
    return res.status(404).json({
      success: false,
      message: 'Trainee absence not found',
    });
  }

  traineeAbsence.hasBilletEntree = true;
  await traineeAbsence.save();

  res.json(traineeAbsence);
});

// @desc    Update trainee absence
// @route   PATCH /api/trainee-absences/:id
// @access  Public
export const updateTraineeAbsence = asyncHandler(async (req, res) => {
  const traineeAbsence = await TraineeAbsence.findById(req.params.id);

  if (!traineeAbsence) {
    return res.status(404).json({
      success: false,
      message: 'Trainee absence not found',
    });
  }

  const { status } = req.body;

  if (status) {
    traineeAbsence.status = status;
    traineeAbsence.absenceHours = await traineeAbsence.calculateAbsenceHours();
    await traineeAbsence.save();
  }

  await traineeAbsence.populate('traineeId');

  res.json({
    success: true,
    message: 'Trainee absence status updated successfully',
    trainee_absence: traineeAbsence,
  });
});

// @desc    Update single column
// @route   PATCH /api/trainee-absences/:id/update-column
// @access  Public
export const updateSingleColumn = asyncHandler(async (req, res) => {
  const traineeAbsence = await TraineeAbsence.findById(req.params.id);

  if (!traineeAbsence) {
    return res.status(404).json({
      success: false,
      message: 'Trainee absence not found',
    });
  }

  const { column, value } = req.body;

  if (column === 'is_justified' || column === 'isJustified') {
    traineeAbsence.isJustified = value;
    if (value === true) {
      traineeAbsence.absenceHours = 0;
    }
  } else if (column === 'has_billet_entree' || column === 'hasBilletEntree') {
    traineeAbsence.hasBilletEntree = value;
  }

  await traineeAbsence.save();
  await traineeAbsence.populate('traineeId');

  res.json({
    success: true,
    message: 'Trainee absence updated successfully',
    trainee_absence: traineeAbsence,
  });
});

// @desc    Get all trainee absences with trainee info
// @route   GET /api/trainee-absences-with-trainee
// @access  Public
export const getAllTraineeAbsencesWithTrainee = asyncHandler(async (req, res) => {
  const absences = await TraineeAbsence.find().populate('traineeId');
  res.json(absences);
});

// @desc    Validate displayed absences
// @route   POST /api/absences/validate-displayed
// @access  Public
export const validateDisplayedAbsences = asyncHandler(async (req, res) => {
  const { group, date, absenceIds } = req.body;

  const userId = req.user?._id || null;

  const updatedCount = await TraineeAbsence.updateMany(
    { _id: { $in: absenceIds } },
    {
      isValidated: true,
      validatedAt: new Date(),
      validatedBy: userId,
    }
  );

  // Update main absence records
  const groupDoc = await Group.findOne({ name: group });
  
  if (groupDoc) {
    await AbsenceRecord.updateMany(
      {
        date: new Date(date),
        groupId: groupDoc._id,
      },
      { isValidated: true }
    );
  }

  res.json({
    success: true,
    message: `${updatedCount.modifiedCount} absences validées avec succès`,
    data: {
      validatedCount: updatedCount.modifiedCount,
      group,
      date,
    },
  });
});

// @desc    Get weekly report
// @route   GET /api/groups/:group/weekly-report
// @access  Public
export const getWeeklyReport = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ name: req.params.group });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'start_date and end_date are required',
    });
  }

  const startDate = moment(start_date).startOf('day');
  const endDate = moment(end_date).endOf('day');

  // Get trainees
  const trainees = await Trainee.find({ groupe: group.name }).sort({ name: 1 });

  // Get absence records
  const absenceRecords = await AbsenceRecord.find({
    groupId: group._id,
    date: {
      $gte: startDate.toDate(),
      $lte: endDate.toDate(),
    },
  })
  .populate({
    path: 'traineeAbsences',
    populate: { path: 'traineeId' }
  })
  .sort({ date: 1 });

  // Prepare days
  const days = [];
  const current = startDate.clone();

  while (current <= endDate) {
    const dayName = current.format('ddd');
    
    if (dayName !== 'Sun') {
      const dayNameMap = {
        'Mon': 'LUN',
        'Tue': 'MAR',
        'Wed': 'MERC',
        'Thu': 'JEU',
        'Fri': 'VEN',
        'Sat': 'SAM',
      };

      const dateString = current.format('YYYY-MM-DD');
      const dayRecords = absenceRecords.filter(r => 
        moment(r.date).format('YYYY-MM-DD') === dateString
      );

      days.push({
        name: dayNameMap[dayName],
        date: dateString,
        day: current.date(),
        absences: dayRecords,
      });
    }

    current.add(1, 'day');
  }

  // Prepare trainee data
  const traineeData = trainees.map(trainee => {
    const weekAbsences = days.map(day => {
      const dayAbsences = [];

      for (const record of day.absences) {
        const absence = record.traineeAbsences?.find(ta => 
          ta.traineeId?._id?.toString() === trainee._id.toString()
        );

        if (absence) {
          dayAbsences.push({
            id: absence._id,
            status: absence.status,
            is_justified: absence.isJustified,
            start_time: record.startTime,
            end_time: record.endTime,
            absence_hours: absence.absenceHours,
          });
        }
      }

      return {
        date: day.date,
        absences: dayAbsences,
        is_absent: dayAbsences.some(a => a.status === 'absent'),
        is_late: dayAbsences.some(a => a.status === 'late'),
      };
    });

    return {
      id: trainee._id,
      cef: trainee.cef,
      name: trainee.name,
      first_name: trainee.firstName,
      week_absences: weekAbsences,
    };
  });

  res.json({
    group,
    days,
    trainees: traineeData,
    start_date: startDate.format('YYYY-MM-DD'),
    end_date: endDate.format('YYYY-MM-DD'),
    formatted_start: startDate.format('DD/MM/YYYY'),
    formatted_end: endDate.format('DD/MM/YYYY'),
  });
});
