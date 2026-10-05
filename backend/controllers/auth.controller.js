import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import bcrypt from 'bcrypt';
import { generateTokens } from '../utils/generateTokens.js';
import { sendEmail } from '../utils/sendEmail.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const removeUploadedAvatar = async (avatar) => {
  if (!avatar || !avatar.startsWith('/uploads/profiles/')) return;
  const filePath = path.join(process.cwd(), avatar.replace(/^\//, ''));
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not remove old avatar:', error.message);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'bio', 'work', 'location', 'website'];
    allowedFields.forEach((field) => {
      if (typeof req.body[field] === 'string') req.user[field] = req.body[field].trim();
    });

    if (typeof req.body.interests === 'string') {
      try {
        const interests = JSON.parse(req.body.interests);
        if (Array.isArray(interests)) {
          const selectedInterests = interests.filter(Boolean).slice(0, 8);
          if (!req.user.interestsCompleted && selectedInterests.length < 3) {
            return res.status(400).json({ message: 'Please choose at least 3 interests.' });
          }
          req.user.interests = selectedInterests;
          if (selectedInterests.length >= 3) req.user.interestsCompleted = true;
        }
      } catch {
        return res.status(400).json({ message: 'Interests must be a valid list.' });
      }
    }

    if (req.user.website && !/^https?:\/\//i.test(req.user.website)) {
      return res.status(400).json({ message: 'Website must start with http:// or https://' });
    }

    if (req.file) {
      await removeUploadedAvatar(req.user.avatar);
      req.user.avatar = `/uploads/profiles/${req.file.filename}`;
    }

    await req.user.save();
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    if (req.file) await removeUploadedAvatar(`/uploads/profiles/${req.file.filename}`);
    res.status(400).json({ message: error.message || 'Could not update profile' });
  }
};

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    if (typeof name !== 'string' || !name.trim() || !email || typeof password !== 'string') {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    let user = await User.findOne({ email });

    if (user?.isVerified) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    let pendingRegistration = await PendingRegistration.findOne({ email });
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const message = `Your OTP for Upskill verification is: ${otp}\nThis OTP is valid for 10 minutes.`;
    try {
      await sendEmail({
        email,
        subject: 'Upskill - Account Verification OTP',
        message,
      });
    } catch (error) {
      console.error('Registration OTP email failed:', error.message);
      if (user?.isVerified === false) {
        try {
          await User.deleteOne({ _id: user._id, isVerified: false });
        } catch (cleanupError) {
          console.error('Could not remove unverified registration:', cleanupError.message);
          return res.status(500).json({
            message: 'Verification email failed and the pending account could not be removed. Please contact support.',
          });
        }
      }
      return res.status(503).json({
        message: 'Verification email could not be sent, so no account was created. Please try again later.',
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const role = user?.role || (adminEmail && email === adminEmail.trim().toLowerCase() ? 'admin' : 'user');
    pendingRegistration = pendingRegistration || new PendingRegistration({ email });
    pendingRegistration.name = name.trim();
    pendingRegistration.passwordHash = await bcrypt.hash(password, 10);
    pendingRegistration.role = role;
    pendingRegistration.otp = otp;
    pendingRegistration.otpExpiry = otpExpiry;
    pendingRegistration.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pendingRegistration.save();

    if (user) {
      const deletion = await User.deleteOne({ _id: user._id, isVerified: false });
      if (!deletion.deletedCount) {
        await PendingRegistration.deleteOne({ _id: pendingRegistration._id });
        return res.status(409).json({ message: 'This email has already been verified. Please sign in.' });
      }
    }

    res.status(201).json({
      message: 'Verification email sent. Enter the OTP to create and activate your account.',
      email,
      emailSent: true
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify OTP and finalize registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const pendingRegistration = await PendingRegistration.findOne({ email });
    if (pendingRegistration) {
      if (pendingRegistration.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date() > pendingRegistration.otpExpiry) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      let user = await User.findOne({ email: pendingRegistration.email });
      if (user?.isVerified) {
        return res.status(400).json({ message: 'User is already verified' });
      }

      if (user) {
        user.name = pendingRegistration.name;
        user.password = pendingRegistration.passwordHash;
        user.role = pendingRegistration.role;
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
      } else {
        user = new User({
          name: pendingRegistration.name,
          email: pendingRegistration.email,
          password: pendingRegistration.passwordHash,
          role: pendingRegistration.role,
          isVerified: true,
        });
      }
      user.$locals.passwordIsHashed = true;
      await user.save();
      await PendingRegistration.deleteOne({ _id: pendingRegistration._id });

      const { accessToken, refreshToken } = generateTokens(user._id);
      return res.status(200).json({
        message: 'Email verified successfully',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        interests: user.interests,
        interestsCompleted: user.interestsCompleted,
        accessToken,
        refreshToken
      });
    }

    // Accept registrations created by older deployments during the transition.
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Registration not found. Please register again.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.status(200).json({
      message: 'Email verified successfully',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      interests: user.interests,
      interestsCompleted: user.interestsCompleted,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const pendingRegistration = await PendingRegistration.findOne({ email });
    const user = pendingRegistration ? null : await User.findOne({ email });

    if (!pendingRegistration && !user) {
      return res.status(404).json({ message: 'Registration not found. Please register again.' });
    }

    if (user?.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    const otp = generateOTP();
    const message = `Your new OTP for Upskill verification is: ${otp}\nThis OTP is valid for 10 minutes.`;

    await sendEmail({
      email,
      subject: 'Upskill - New Verification OTP',
      message,
    });

    const registration = pendingRegistration || user;
    registration.otp = otp;
    registration.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    if (pendingRegistration) {
      pendingRegistration.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    await registration.save();

    res.status(200).json({ message: 'New OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};

// @desc    Auth user & get tokens
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by the administrator. Please contact support.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first. Request a new OTP if needed.' });
    }

    if (await user.matchPassword(password)) {
      const { accessToken, refreshToken } = generateTokens(user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        interests: user.interests,
        interestsCompleted: user.interestsCompleted,
        accessToken,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot password - send reset link via email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate password reset token (6-digit OTP)
    const resetToken = generateOTP();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    const resetMessage = `Your password reset token is: ${resetToken}\nThis token is valid for 15 minutes.\nIf you didn't request a password reset, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Upskill - Password Reset Request',
        message: resetMessage,
      });

      res.status(200).json({
        message: 'Password reset token sent to your email',
        success: true
      });
    } catch (error) {
      console.error('Email sending failed:', error.message);
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      res.status(500).json({
        message: 'Could not send reset email. Please try again later.',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (new Date() > new Date(user.resetPasswordExpiry)) {
      return res.status(400).json({ message: 'Token has expired. Please request a new one.' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
