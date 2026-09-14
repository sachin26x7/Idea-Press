import express from 'express';
import { protect, admin } from '../middleware/auth.middleware.js';
import {
  getAllUsers,
  getUserById,
  blockUnblockUser,
  deleteUser,
  getAllBlogs,
  deleteBlogAdmin,
  getAdminStats
} from '../controllers/admin.controller.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, admin);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/block', blockUnblockUser);
router.delete('/users/:id', deleteUser);

// Blog moderation routes
router.get('/blogs', getAllBlogs);
router.delete('/blogs/:id', deleteBlogAdmin);

// Admin statistics
router.get('/stats', getAdminStats);

export default router;
