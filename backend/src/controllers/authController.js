const prisma = require('../prisma/client');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');

/**
 * Authentication Controller
 * Implements user registration, sign-in, profile viewing, and profile/password updates.
 */

/**
 * POST /api/auth/register
 * Register a new user with default USER role.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Password confirmation match check (if confirmPassword provided)
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Password complexity check (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // 2. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered. Please sign in or use another email.',
      });
    }

    // 3. Hash password and persist user (default role is strictly USER)
    const passwordHash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        currency: '₹', // Default currency for Indian Finora context, customizable in Settings
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currency: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please sign in.',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and issue JWT token.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 2. Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support or administrator.',
      });
    }

    // 3. Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. Generate signed JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        currency: user.currency,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Return currently authenticated user profile.
 */
async function getMe(req, res, next) {
  try {
    // req.user is attached by authMiddleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        currency: req.user.currency,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/profile
 * Update user profile details (name, currency, password).
 */
async function updateProfile(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { name, currency, currentPassword, newPassword } = req.body;
    const updateData = {};

    if (name && typeof name === 'string') {
      updateData.name = name.trim();
    }

    if (currency && typeof currency === 'string') {
      updateData.currency = currency.trim();
    }

    // If changing password:
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
        });
      }

      // Fetch user with passwordHash
      const fullUser = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      const isCurrentValid = await comparePassword(currentPassword, fullUser.passwordHash);
      if (!isCurrentValid) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password',
        });
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
