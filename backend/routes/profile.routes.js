import express from 'express';
import { getPublicProfile } from '../controllers/profile.controller.js';

const router = express.Router();

router.get('/:id', getPublicProfile);

export default router;
