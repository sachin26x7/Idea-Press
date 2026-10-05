import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { registerUser, verifyOtp, loginUser, resendOtp, forgotPassword, resetPassword, updateProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profileUploadPath = path.join(__dirname, '..', 'uploads', 'profiles');
fs.mkdirSync(profileUploadPath, { recursive: true });

const profileUpload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, callback) => callback(null, profileUploadPath),
		filename: (_req, file, callback) => {
			const extension = path.extname(file.originalname).toLowerCase();
			callback(null, `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
		},
	}),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, callback) => {
		if (file.mimetype.startsWith('image/')) {
			callback(null, true);
		} else {
			callback(new Error('Only image files are allowed'));
		}
	},
});

const router = express.Router();

const authEmailLimiter = (limit, message) => rateLimit({
	windowMs: 15 * 60 * 1000,
	limit,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message },
});

router.post('/register', authEmailLimiter(5, 'Too many registration attempts. Please try again later.'), registerUser);
router.post('/verify-otp', authEmailLimiter(10, 'Too many code attempts. Please try again later.'), verifyOtp);
router.post('/resend-otp', authEmailLimiter(3, 'Too many code requests. Please try again later.'), resendOtp);
router.post('/login', loginUser);
router.post('/forgot-password', authEmailLimiter(3, 'Too many password reset requests. Please try again later.'), forgotPassword);
router.post('/reset-password', authEmailLimiter(10, 'Too many password reset attempts. Please try again later.'), resetPassword);
router.put('/profile', protect, profileUpload.single('avatar'), updateProfile);

export default router;
