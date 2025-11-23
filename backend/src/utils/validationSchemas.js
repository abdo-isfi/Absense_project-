import { body, param, query } from 'express-validator';

// Auth validation schemas
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  body('new_password_confirmation')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.new_password)
    .withMessage('Password confirmation does not match'),
];

// Trainee validation schemas
export const createTraineeValidation = [
  body('cef')
    .notEmpty()
    .withMessage('CEF is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('CEF must be between 1 and 50 characters'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('groupe')
    .notEmpty()
    .withMessage('Groupe is required')
    .trim(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Invalid phone number format'),
];

export const updateTraineeValidation = [
  body('cef')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('CEF must be between 1 and 50 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('groupe')
    .optional()
    .trim(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Invalid phone number format'),
];

// Group validation schemas
export const createGroupValidation = [
  body('name')
    .notEmpty()
    .withMessage('Group name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('filiere')
    .optional()
    .trim(),
  body('annee')
    .optional()
    .trim(),
];

export const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('filiere')
    .optional()
    .trim(),
  body('annee')
    .optional()
    .trim(),
];

// Teacher validation schemas
export const createTeacherValidation = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('matricule')
    .notEmpty()
    .withMessage('Matricule is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const updateTeacherValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('matricule')
    .optional()
    .trim(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('groups')
    .optional()
    .isArray()
    .withMessage('Groups must be an array'),
];

// Absence validation schemas
export const createAbsenceValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('group_id')
    .notEmpty()
    .withMessage('Group ID is required')
    .isMongoId()
    .withMessage('Invalid group ID'),
  body('teacher_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  body('start_time')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:mm)'),
  body('end_time')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:mm)'),
  body('students')
    .isArray({ min: 1 })
    .withMessage('At least one student is required'),
  body('students.*.trainee_id')
    .isMongoId()
    .withMessage('Invalid trainee ID'),
  body('students.*.status')
    .isIn(['absent', 'late', 'present'])
    .withMessage('Invalid status'),
];

// MongoDB ID validation
export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];

// CEF validation
export const cefValidation = [
  param('cef')
    .notEmpty()
    .withMessage('CEF is required')
    .trim(),
];
