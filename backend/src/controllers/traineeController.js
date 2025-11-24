import mongoose from 'mongoose';
import Trainee from '../models/Trainee.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a new trainee
// @route   POST /api/trainees
// @access  Private (SG/Admin)
export const createTrainee = asyncHandler(async (req, res) => {
  const { cef, name, firstName, groupe, phone } = req.body;

  const traineeExists = await Trainee.findOne({ cef });
  if (traineeExists) {
    return res.status(400).json({
      success: false,
      message: 'Trainee with this CEF already exists',
    });
  }

  const trainee = await Trainee.create({
    cef,
    name,
    firstName,
    groupe,
    phone,
  });

  res.status(201).json({
    success: true,
    data: trainee,
    message: 'Trainee created successfully',
  });
});

// @desc    Get all trainees
// @route   GET /api/trainees
// @access  Private (SG/Admin/Teacher)
export const getAllTrainees = asyncHandler(async (req, res) => {
  const { group, search, page = 1, limit = 10 } = req.query;
  
  const query = {};
  
  // Filter by group
  if (group) {
    query.groupe = group;
  }
  
  // Search by name or CEF
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { cef: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;
  
  const trainees = await Trainee.find(query)
    .sort({ groupe: 1, name: 1 })
    .skip(skip)
    .limit(Number(limit));
    
  const total = await Trainee.countDocuments(query);

  res.json({
    success: true,
    data: trainees,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get trainee by ID
// @route   GET /api/trainees/:id
// @access  Private
export const getTraineeById = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findById(req.params.id);

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: 'Trainee not found',
    });
  }

  res.json({
    success: true,
    data: trainee,
  });
});

// @desc    Update trainee
// @route   PUT /api/trainees/:id
// @access  Private (SG/Admin)
export const updateTrainee = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findById(req.params.id);

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: 'Trainee not found',
    });
  }

  const updatedTrainee = await Trainee.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedTrainee,
    message: 'Trainee updated successfully',
  });
});

// @desc    Delete trainee
// @route   DELETE /api/trainees/:id
// @access  Private (SG/Admin)
export const deleteTrainee = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findById(req.params.id);

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: 'Trainee not found',
    });
  }

  await trainee.deleteOne();

  res.json({
    success: true,
    message: 'Trainee deleted successfully',
  });
});

import Group from '../models/Group.js';

// @desc    Import trainees from JSON (converted from Excel on frontend)
// @route   POST /api/trainees/import
// @access  Private (SG/Admin)
export const importTrainees = asyncHandler(async (req, res) => {
  const { trainees } = req.body; // Array of trainee objects

  if (!trainees || !Array.isArray(trainees) || trainees.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No trainees data provided',
    });
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  const groupsToSync = new Set();

  for (const t of trainees) {
    try {
      if (t.groupe) groupsToSync.add(t.groupe);

      // Check if exists
      const exists = await Trainee.findOne({ cef: t.cef });
      if (exists) {
        // Option: Update or Skip. Here we skip.
        results.failed++;
        results.errors.push(`Trainee with CEF ${t.cef} already exists`);
        continue;
      }

      await Trainee.create({
        cef: t.cef,
        name: t.name,
        firstName: t.firstName,
        groupe: t.groupe,
        phone: t.phone,
      });
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Error importing ${t.cef}: ${error.message}`);
    }
  }

  // Sync groups
  for (const groupName of groupsToSync) {
    try {
      await Group.findOneAndUpdate(
        { name: groupName },
        { name: groupName },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error(`Error syncing group ${groupName}:`, err);
    }
  }

  res.json({
    success: true,
    message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
    results,
  });
});

// @desc    Get all trainees with calculated stats
// @route   GET /api/trainees/with-stats
// @access  Private (SG/Admin)
export const getTraineesWithStats = asyncHandler(async (req, res) => {
  const trainees = await Trainee.find().sort({ groupe: 1, name: 1 });
  
  // Calculate stats for each trainee
  // Note: This might be slow for large datasets. 
  // Optimization: Use aggregation pipeline or store stats in Trainee model and update on absence change.
  // For now, we use the method on the model.
  
  const traineesWithStats = await Promise.all(trainees.map(async (t) => {
    const totalAbsenceHours = await t.calculateTotalAbsenceHours();
    const disciplinaryNote = await t.calculateDisciplinaryNote();
    
    // Get detailed absences for frontend logic if needed, or just summary
    // The frontend spec says it fetches "trainees list" and then "computes per-group validation".
    // But it also says "calculateAbsenceHours... sum validated absences".
    // If we return raw absences, the frontend can do the math.
    // Let's attach the raw absences (validated ones) as requested by the "normalization" logic description.
    
    const TraineeAbsence = mongoose.model('TraineeAbsence');
    const absences = await TraineeAbsence.find({ traineeId: t._id })
      .populate('absenceRecordId', 'date startTime endTime subject');

    return {
      ...t.toObject(),
      totalAbsenceHours,
      disciplinaryNote,
      absences, // Include all absences so frontend can filter/validate
    };
  }));

  res.json({
    success: true,
    data: traineesWithStats,
  });
});

// @desc    Delete all trainees
// @route   DELETE /api/trainees/delete-all
// @access  Private (Admin/SG)
export const deleteAllTrainees = asyncHandler(async (req, res) => {
  await Trainee.deleteMany({});
  // Also delete associated absences?
  // Ideally yes, to maintain integrity.
  const TraineeAbsence = mongoose.model('TraineeAbsence');
  await TraineeAbsence.deleteMany({});
  
  res.json({
    success: true,
    message: 'All trainees and their absences have been deleted',
  });
});

// @desc    Get all absences for a specific trainee
// @route   GET /api/trainees/:cef/absences
// @access  Private
export const getTraineeAbsences = asyncHandler(async (req, res) => {
  const { cef } = req.params;

  // Find trainee by CEF
  const trainee = await Trainee.findOne({ cef });
  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: `Trainee with CEF ${cef} not found`
    });
  }

  // Get all trainee absences
  const TraineeAbsence = mongoose.model('TraineeAbsence');
  const AbsenceRecord = mongoose.model('AbsenceRecord');
  
  const traineeAbsences = await TraineeAbsence.find({ traineeId: trainee._id })
    .sort({ createdAt: -1 });

  // Populate absence record details
  const absencesWithDetails = await Promise.all(
    traineeAbsences.map(async (ta) => {
      const record = await AbsenceRecord.findById(ta.absenceRecordId)
        .populate('groupId', 'name code')
        .populate('teacherId', 'name firstName lastName');

      return {
        ...ta.toObject(),
        id: ta._id,
        date: record?.date,
        absence_date: record?.date,
        start_time: record?.startTime,
        end_time: record?.endTime,
        group: record?.groupId,
        teacher: record?.teacherId,
        is_validated: ta.isValidated,
        is_justified: ta.isJustified,
        has_billet_entree: ta.hasBilletEntree,
        absence_hours: ta.absenceHours,
        justification_comment: ta.justificationComment,
      };
    })
  );

  res.json({
    success: true,
    data: absencesWithDetails,
  });
});

