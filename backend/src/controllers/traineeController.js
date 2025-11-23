import Trainee from '../models/Trainee.js';
import TraineeAbsence from '../models/TraineeAbsence.js';
import Dropout from '../models/Dropout.js';
import Group from '../models/Group.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { calculateTotalAbsenceHours, getDisciplinaryStatus } from '../services/absenceCalculator.js';
import { importFromExcel, importFromCSV, saveTrainees } from '../services/excelImporter.js';
import path from 'path';
import fs from 'fs';

// @desc    Get all trainees
// @route   GET /api/trainees
// @access  Public
export const getTrainees = asyncHandler(async (req, res) => {
  const { group } = req.query;
  
  const query = group ? { groupe: group } : {};
  
  const trainees = await Trainee.find(query);
  
  // Add statistics to each trainee
  const traineesWithStats = await Promise.all(trainees.map(async (trainee) => {
    const totalAbsenceHours = await trainee.calculateTotalAbsenceHours();
    const disciplinaryNote = await trainee.calculateDisciplinaryNote();
    
    return {
      ...trainee.toObject(),
      totalAbsenceHours,
      disciplinaryNote,
    };
  }));

  res.json({
    success: true,
    data: traineesWithStats,
  });
});

// @desc    Get trainees with detailed stats
// @route   GET /api/trainees/with-stats
// @access  Public
export const getTraineesWithStats = asyncHandler(async (req, res) => {
  const trainees = await Trainee.find().select('id cef name firstName groupe phone');
  
  const traineeIds = trainees.map(t => t._id);
  const absences = await TraineeAbsence.find({ traineeId: { $in: traineeIds } })
    .populate('absenceRecordId');

  const absencesByTrainee = {};
  absences.forEach(abs => {
    const traineeId = abs.traineeId.toString();
    if (!absencesByTrainee[traineeId]) {
      absencesByTrainee[traineeId] = [];
    }
    absencesByTrainee[traineeId].push({
      ...abs.toObject(),
      is_validated: abs.absenceRecordId?.isValidated ?? false,
    });
  });

  const result = trainees.map(t => {
    const abs = absencesByTrainee[t._id.toString()] || [];
    const hours = calculateTotalAbsenceHours(abs);
    const disciplinaryStatus = getDisciplinaryStatus(hours);

    return {
      id: t._id,
      cef: t.cef,
      name: t.name,
      first_name: t.firstName,
      groupe: t.groupe,
      phone: t.phone,
      totalAbsenceHours: hours,
      disciplinaryStatus,
      disciplinaryNote: Math.max(0, 20 - Math.floor(hours / 5)),
      absences: abs.map(a => ({
        id: a._id,
        status: a.status,
        is_justified: a.isJustified,
        absence_hours: a.absenceHours,
        is_validated: a.is_validated,
        isValidated: a.is_validated,
      })),
    };
  });

  res.json(result);
});

// @desc    Create trainee
// @route   POST /api/trainees
// @access  Public
export const createTrainee = asyncHandler(async (req, res) => {
  const { cef, name, first_name, groupe } = req.body;

  const trainee = await Trainee.create({
    cef,
    name,
    firstName: first_name,
    groupe,
  });

  res.status(201).json(trainee);
});

// @desc    Get single trainee
// @route   GET /api/trainees/:cef
// @access  Public
export const getTrainee = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({ cef: req.params.cef });

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: 'Trainee not found',
    });
  }

  const absences = await TraineeAbsence.find({ traineeId: trainee._id })
    .populate('absenceRecordId');

  const totalAbsenceHours = await trainee.calculateTotalAbsenceHours();
  const disciplineScore = await trainee.calculateDisciplinaryNote();

  const absenceStats = {
    absent: await TraineeAbsence.countDocuments({ traineeId: trainee._id, status: 'absent' }),
    late: await TraineeAbsence.countDocuments({ traineeId: trainee._id, status: 'late' }),
    justified: await TraineeAbsence.countDocuments({ traineeId: trainee._id, isJustified: true }),
  };

  const absenceHistory = absences.map(absence => ({
    id: absence._id,
    date: absence.absenceRecordId?.date || 'N/A',
    time: `${absence.absenceRecordId?.startTime} - ${absence.absenceRecordId?.endTime}`,
    status: absence.status,
    source: absence.isJustified ? 'Justifié' : 'Non justifié',
    color: absence.status === 'absent' ? 'text-danger' : (absence.status === 'late' ? 'text-warning' : 'text-success'),
  }));

  res.json({
    success: true,
    data: {
      ...trainee.toObject(),
      absenceStats,
      totalAbsenceHours,
      disciplineScore,
      absenceHistory,
    },
  });
});

// @desc    Update trainee
// @route   PUT /api/trainees/:cef
// @access  Public
export const updateTrainee = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({ cef: req.params.cef });

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: 'Trainee not found',
    });
  }

  const { cef, name, first_name, groupe } = req.body;

  if (cef) trainee.cef = cef;
  if (name) trainee.name = name;
  if (first_name) trainee.firstName = first_name;
  if (groupe) trainee.groupe = groupe;

  await trainee.save();

  res.json(trainee);
});

// @desc    Delete trainee
// @route   DELETE /api/trainees/:cef
// @access  Public
export const deleteTrainee = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({ cef: req.params.cef });

  if (!trainee) {
    return res.status(404).json({
      success: false,
      message: 'Trainee not found',
    });
  }

  await trainee.deleteOne();

  res.status(204).send();
});

// @desc    Delete all trainees
// @route   DELETE /api/trainees/delete-all
// @access  Public
export const deleteAllTrainees = asyncHandler(async (req, res) => {
  await TraineeAbsence.deleteMany({});
  await Dropout.deleteMany({});
  await Trainee.deleteMany({});
  await Group.deleteMany({});

  res.json({
    success: true,
    message: 'Tous les stagiaires, groupes et leurs données associées ont été supprimés',
  });
});

// @desc    Get trainee absences
// @route   GET /api/trainees/:cef/absences
// @access  Public
export const getTraineeAbsences = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({ cef: req.params.cef });

  if (!trainee) {
    return res.status(404).json({ error: 'Trainee not found' });
  }

  const absences = await TraineeAbsence.find({ traineeId: trainee._id })
    .populate('absenceRecordId')
    .sort({ createdAt: -1 });

  const formattedAbsences = absences.map(absence => ({
    id: absence._id,
    status: absence.status,
    is_justified: absence.isJustified,
    absence_hours: absence.absenceHours,
    date: absence.absenceRecordId?.date,
    start_time: absence.absenceRecordId?.startTime,
    end_time: absence.absenceRecordId?.endTime,
    isValidated: absence.absenceRecordId?.isValidated ?? false,
    created_at: absence.createdAt,
  }));

  res.json(formattedAbsences);
});

// @desc    Get trainee statistics
// @route   GET /api/trainees/:cef/statistics
// @access  Public
export const getTraineeStatistics = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findOne({ cef: req.params.cef });

  if (!trainee) {
    return res.status(404).json({ error: 'Trainee not found' });
  }

  const totalAbsenceHours = await trainee.calculateTotalAbsenceHours();
  const disciplinaryNote = await trainee.calculateDisciplinaryNote();
  
  const lateCount = await TraineeAbsence.countDocuments({
    traineeId: trainee._id,
    status: 'late',
  });
  
  const absentCount = await TraineeAbsence.countDocuments({
    traineeId: trainee._id,
    status: 'absent',
  });
  
  const justifiedCount = await TraineeAbsence.countDocuments({
    traineeId: trainee._id,
    isJustified: true,
  });

  res.json({
    total_absence_hours: totalAbsenceHours,
    disciplinary_note: disciplinaryNote,
    late_count: lateCount,
    absent_count: absentCount,
    justified_count: justifiedCount,
  });
});

// @desc    Bulk import trainees
// @route   POST /api/trainees/bulk-import
// @access  Public
export const bulkImport = asyncHandler(async (req, res) => {
  const { trainees } = req.body;

  if (!trainees || !Array.isArray(trainees)) {
    return res.status(400).json({
      success: false,
      message: 'Trainees array is required',
    });
  }

  let importedCount = 0;
  const errors = [];

  for (const traineeData of trainees) {
    try {
      const existing = await Trainee.findOne({ cef: traineeData.cef });
      
      if (existing) {
        await existing.updateOne({
          name: traineeData.name,
          firstName: traineeData.first_name,
          groupe: traineeData.groupe,
        });
      } else {
        await Trainee.create({
          cef: traineeData.cef,
          name: traineeData.name,
          firstName: traineeData.first_name,
          groupe: traineeData.groupe,
        });
      }
      
      importedCount++;
    } catch (error) {
      errors.push({
        cef: traineeData.cef || 'Unknown',
        error: error.message,
      });
    }
  }

  res.json({
    success: true,
    imported: importedCount,
    errors,
  });
});

// @desc    Import trainees from file
// @route   POST /api/trainees/import
// @access  Public
export const importTrainees = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let result;
    
    if (ext === '.xlsx' || ext === '.xls') {
      result = await importFromExcel(filePath);
    } else if (ext === '.csv') {
      result = await importFromCSV(filePath);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type',
      });
    }

    const { trainees, errors } = result;
    const saveResult = await saveTrainees(trainees);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      imported: saveResult.imported,
      errors: [...errors, ...saveResult.errors],
      message: `${saveResult.imported} stagiaires importés`,
    });
  } catch (error) {
    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw error;
  }
});
