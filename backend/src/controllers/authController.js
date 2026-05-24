import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { email, password, fullName, displayName, accountType, superCode } =
    req.body;

  const finalFullName = fullName || displayName;
  if (!finalFullName) {
    return res.status(400).json({ message: 'Please add a full name' });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  let role = 'user';
  if (accountType === 'admin') {
    if (!superCode || superCode !== process.env.ADMIN_SUPER_CODE) {
      return res
        .status(400)
        .json({ message: 'Недійсний супер-код для реєстрації адміністратора' });
    }
    role = 'admin';
  }

  const user = await User.create({
    email,
    password,
    fullName: finalFullName,
    role,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

/**
 * @desc    Authenticate a user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Please provide email or username and password' });
  }

  const identifier = email.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+password');

  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { displayName, fullName } = req.body;
    const finalFullName = fullName || displayName;

    if (finalFullName) {
      user.fullName = finalFullName.trim();
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

/**
 * @desc    Update user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const updateUserPassword = async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (user) {
    const { currentPassword, nextPassword } = req.body;

    if (!currentPassword || !nextPassword) {
      return res
        .status(400)
        .json({ message: 'Please provide current and next password' });
    }

    const minLength =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
        ? 3
        : 8;
    if (nextPassword.length < minLength) {
      return res.status(400).json({
        message: `Password must be at least ${minLength} characters`,
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = nextPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = (req, res) => {
  // Since we're using JWT in headers, client just needs to discard the token.
  // We can also use HttpOnly cookies if requested, but for now we follow the checklist.
  res.json({ message: 'Logged out successfully' });
};
