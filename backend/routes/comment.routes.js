import express from 'express';
import { getComments, addComment, deleteComment } from '../controllers/comment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, addComment);

router.route('/:id')
  .delete(protect, deleteComment);

router.get('/:blogId', getComments);

export default router;
