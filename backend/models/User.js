import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      select: false,
    },

    otpHash: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    otpLastSentAt: {
      type: Date,
    },

    avatar: {
      type: String,
      default: '',
    },

    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    work: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },

    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },

    website: {
      type: String,
      default: '',
      trim: true,
      maxlength: 240,
    },

    interests: [{
      type: String,
      trim: true,
    }],

    interestsCompleted: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordTokenHash: {
      type: String,
    },

    resetPasswordAttempts: {
      type: Number,
      default: 0,
    },

    resetPasswordLastSentAt: {
      type: Date,
    },

    resetPasswordExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


// 🔐 Hash password before saving (FIXED)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.$locals.passwordIsHashed) return;

  this.password = await bcrypt.hash(this.password, 10);
});


// 🔑 Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// ❌ Remove sensitive fields when sending response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpHash;
  delete obj.otpExpiry;
  delete obj.otpAttempts;
  delete obj.otpLastSentAt;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpiry;
  delete obj.resetPasswordAttempts;
  delete obj.resetPasswordLastSentAt;
  return obj;
};


const User = mongoose.model('User', userSchema);

export default User;