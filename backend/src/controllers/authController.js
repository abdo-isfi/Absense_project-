import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import jwtConfig from '../config/jwt.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

// @desc    Login user (admin/sg/teacher)
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Check for admin user
  const admin = await User.findOne({ email, role: 'admin' }).select('+password');
  
  if (admin && await admin.comparePassword(password)) {
    const token = generateToken(admin._id);
    
    return res.json({
      success: true,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        must_change_password: false,
      },
      token,
      message: 'Login successful',
    });
  }

  // Check for SG user
  const sgUser = await User.findOne({ email, role: 'sg' }).select('+password');
  
  if (sgUser && await sgUser.comparePassword(password)) {
    // Check if account is active
    if (sgUser.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account is inactive by admin',
      });
    }
    
    const token = generateToken(sgUser._id);
    
    return res.json({
      success: true,
      user: {
        id: sgUser._id,
        email: sgUser.email,
        first_name: sgUser.firstName || 'SG',
        last_name: sgUser.lastName || 'User',
        role: 'sg',
        must_change_password: false,
      },
      token,
      message: 'Login successful',
    });
  }

  // Check for teacher
  const teacher = await Teacher.findOne({ email }).select('+password').populate('groups');
  
  if (teacher && await teacher.comparePassword(password)) {
    // Check if account is active
    if (teacher.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account is inactive by admin',
      });
    }
    
    const token = generateToken(teacher._id);
    
    return res.json({
      success: true,
      user: {
        id: teacher._id,
        email: teacher.email,
        first_name: teacher.firstName,
        last_name: teacher.lastName,
        matricule: teacher.matricule,
        role: 'teacher',
        must_change_password: teacher.mustChangePassword,
        groups: teacher.groups.map(g => g.name),
      },
      token,
      message: 'Login successful',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'The provided credentials are incorrect',
    errors: [{ field: 'email', message: 'The provided credentials are incorrect' }],
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password, new_password_confirmation } = req.body;

  if (!current_password || !new_password || !new_password_confirmation) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  if (new_password !== new_password_confirmation) {
    return res.status(400).json({
      success: false,
      message: 'New password confirmation does not match',
      errors: [{ field: 'new_password_confirmation', message: 'The password confirmation does not match' }],
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters',
      errors: [{ field: 'new_password', message: 'The password must be at least 8 characters' }],
    });
  }

  // Get user with password
  let user = await User.findById(req.user._id).select('+password');
  
  if (!user) {
    user = await Teacher.findById(req.user._id).select('+password');
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Check current password
  const isMatch = await user.comparePassword(current_password);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
      errors: [{ field: 'current_password', message: 'The current password is incorrect' }],
    });
  }

  // Update password
  user.password = new_password;
  
  // If teacher, update must_change_password flag
  if (user.constructor.modelName === 'Teacher') {
    user.mustChangePassword = false;
  }
  
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const me = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const userData = {
    id: user._id,
    email: user.email,
    role: user.role || 'teacher',
  };

  // Add role-specific data
  if (user.constructor.modelName === 'Teacher') {
    const teacher = await Teacher.findById(user._id).populate('groups');
    userData.first_name = teacher.firstName;
    userData.last_name = teacher.lastName;
    userData.matricule = teacher.matricule;
    userData.must_change_password = teacher.mustChangePassword;
    userData.groups = teacher.groups.map(g => g.name);
  } else if (user.role === 'admin') {
    userData.name = user.name;
    userData.must_change_password = false;
  } else if (user.role === 'sg') {
    userData.first_name = user.firstName || 'SG';
    userData.last_name = user.lastName || 'User';
    userData.must_change_password = false;
  }

  res.json({
    success: true,
    user: userData,
  });
});
