import express from 'express';
import {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { check } from 'express-validator';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
      check('role', 'Role is required').not().isEmpty(),
    ],
    createUser
  );

router
  .route('/:id')
  .get(getUser)
  .put(
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
    ],
    updateUser
  )
  .delete(deleteUser);

export default router;
