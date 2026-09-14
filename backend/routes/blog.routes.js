import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { 
  getBlogs, 
  getBlogBySlug, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  likeBlog,
  addComment,
  getComments,
  deleteComment
} from '../controllers/blog.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const blogUploadPath = path.join(__dirname, '..', 'uploads', 'blogs');
fs.mkdirSync(blogUploadPath, { recursive: true });

const blogUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, blogUploadPath),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `cover-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Only JPG, JPEG, and PNG images are allowed'));
    }
  },
});

// Public routes
router.get('/', getBlogs);
router.get('/:id/comments', getComments);
router.get('/slug/:slug', getBlogBySlug);

// Protected routes - require authentication
router.post('/', protect, blogUpload.single('coverFile'), createBlog);
router.post('/:id/like', protect, likeBlog);
router.post('/:id/comments', protect, addComment);

// Protected routes - require authentication and ownership check (or admin)
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

// Delete comment route - must come after slug routes
router.delete('/comment/:id', protect, deleteComment);

export default router;
