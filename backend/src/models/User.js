import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test'
          ? 3
          : 8,
        'Password must be at least 8 characters',
      ],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'paid_user', 'legislator', 'admin'],
      default: 'user',
    },
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    billingPlan: {
      type: String,
      enum: ['preview', 'trial', 'user', 'plus', 'pro'],
      default: 'preview',
    },
    registrationSource: {
      referrer: { type: String, default: null },
      source: {
        type: String,
        enum: ['direct', 'google', 'bing', 'social', 'link', 'unknown'],
        default: 'unknown',
      },
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
