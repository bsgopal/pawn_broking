import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'PawnBookPro_Enterprise_Secure_Token_Key_2026';

// @desc    Authenticate User (Admin / Manager / Staff)
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, mobile, email, password } = req.body;
    const identifier = (mobile || email || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide mobile/email and password.' });
    }

    const tenantCode = req.customerCode || getCurrentTenantCode();
    await (await import('../config/tenantConnectionManager.js')).ensureTenantBootstrap(tenantCode);
    const User = getTenantModel(tenantCode, 'User');
    const Branch = getTenantModel(tenantCode, 'Branch');
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');


    const user = await User.findOne({
      $or: [
        { mobile: identifier },
        { phone: identifier },
        { email: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or user not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        customerCode: tenantCode.toUpperCase(),
        branchId: user.branchId,
        branchCode: user.branchCode
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const branches = await Branch.find({ isActive: true });
    const config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });

    res.json({
      success: true,
      token,
      customerCode: tenantCode.toUpperCase(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        branchId: user.branchId,
        branchCode: user.branchCode,
        permissions: user.permissions
      },
      shopConfig: config,
      branches
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const ShopConfig = getTenantModel(tenantCode, 'ShopConfig');
    const config = await ShopConfig.findOne({ customerCode: tenantCode.toUpperCase() });
    
    res.json({
      success: true,
      user: req.user,
      customerCode: tenantCode.toUpperCase(),
      shopConfig: config
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Current User Profile (Name, Mobile, Email, Password)
// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const User = getTenantModel(tenantCode, 'User');
    const { name, email, mobile, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (mobile) user.mobile = mobile.trim();
    if (password && password.trim().length >= 4) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        branchId: user.branchId,
        branchCode: user.branchCode,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    List all staff users in tenant
// @route   GET /api/auth/users
router.get('/users', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const User = getTenantModel(tenantCode, 'User');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new staff user
// @route   POST /api/auth/users
router.post('/users', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, mobile, password, role, branchCode, permissions } = req.body;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const User = getTenantModel(tenantCode, 'User');

    const existing = await User.findOne({ mobile: mobile.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this mobile already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    const newUser = await User.create({
      name: name.trim(),
      email: (email || '').toLowerCase().trim(),
      mobile: mobile.trim(),
      password: hashedPassword,
      role: role || 'STAFF',
      branchCode: branchCode || '',
      permissions: permissions || {}
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
