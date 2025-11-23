import Group from '../models/Group.js';
import Trainee from '../models/Trainee.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all groups
// @route   GET /api/groups
// @access  Public
export const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find().sort({ name: 1 });
  res.json(groups);
});

// @desc    Create group
// @route   POST /api/groups
// @access  Public
export const createGroup = asyncHandler(async (req, res) => {
  const { name, filiere, annee } = req.body;

  const group = await Group.create({
    name,
    filiere,
    annee,
  });

  res.status(201).json(group);
});

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Public
export const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  res.json(group);
});

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Public
export const updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  const { name, filiere, annee } = req.body;

  if (name) group.name = name;
  if (filiere !== undefined) group.filiere = filiere;
  if (annee !== undefined) group.annee = annee;

  await group.save();

  res.json(group);
});

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Public
export const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  await group.deleteOne();

  res.status(204).send();
});

// @desc    Get trainees in a group
// @route   GET /api/groups/:group/trainees
// @access  Public
export const getGroupTrainees = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ name: req.params.group });

  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'Group not found',
    });
  }

  const trainees = await Trainee.find({ groupe: group.name }).sort({ name: 1 });

  res.json(trainees);
});
