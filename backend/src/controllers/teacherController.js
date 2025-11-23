import Teacher from '../models/Teacher.js';
import Group from '../models/Group.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Public
export const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().populate('groups');
  
  const teachersData = teachers.map(teacher => ({
    ...teacher.toObject(),
    groups: teacher.groups.map(g => g.name),
  }));

  res.json({
    success: true,
    data: teachersData,
  });
});

// @desc    Create teacher
// @route   POST /api/teachers
// @access  Public
export const createTeacher = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, matricule, password } = req.body;

  const teacher = await Teacher.create({
    firstName: first_name,
    lastName: last_name,
    email,
    matricule,
    password,
    mustChangePassword: true,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    data: teacher,
  });
});

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Public
export const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate('groups');

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  const teacherData = {
    ...teacher.toObject(),
    groups: teacher.groups.map(g => g.name),
  };

  res.json({
    success: true,
    data: teacherData,
  });
});

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Public
export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  const { first_name, last_name, email, matricule, password, groups } = req.body;

  if (first_name) teacher.firstName = first_name;
  if (last_name) teacher.lastName = last_name;
  if (email) teacher.email = email;
  if (matricule) teacher.matricule = matricule;
  if (password) teacher.password = password;

  // Update groups if provided
  if (groups && Array.isArray(groups)) {
    const groupDocs = await Group.find({ name: { $in: groups } });
    teacher.groups = groupDocs.map(g => g._id);
  }

  await teacher.save();

  await teacher.populate('groups');

  const teacherData = {
    ...teacher.toObject(),
    groups: teacher.groups.map(g => g.name),
  };

  res.json({
    success: true,
    data: teacherData,
  });
});

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Public
export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  await teacher.deleteOne();

  res.json({ success: true });
});

// @desc    Upload teacher schedule
// @route   POST /api/teachers/:id/schedule
// @access  Public
export const uploadSchedule = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  teacher.schedulePath = req.file.path;
  await teacher.save();

  res.json({
    success: true,
    message: 'Schedule uploaded successfully',
    path: req.file.path,
  });
});
