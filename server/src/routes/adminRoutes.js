import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllTasks,
  deleteTaskByAdmin,
  claimAdminRole,
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Claim admin (Requires valid user authentication)
router.post('/claim-admin', protect, claimAdminRole);

// All subsequent routes require Admin privileges
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/tasks', getAllTasks);
router.delete('/tasks/:id', deleteTaskByAdmin);

export default router;
