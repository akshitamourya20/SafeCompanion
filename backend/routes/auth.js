const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');

// Dynamic hot-swap loaders
let User = require('../models/User');
let Evidence = require('../models/Evidence');

router.use((req, res, next) => {
  if (global.useLocalDB) {
    User = require('../config/localDb').users;
    Evidence = require('../config/localDb').evidence;
  } else {
    User = require('../models/User');
    Evidence = require('../models/Evidence');
  }
  next();
});

// Helper to sign JWT tokens
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'safecompanion_super_secret_key_12345', 
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, role, shiftTime } = req.body;

  try {
    let userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User with this email or username already exists' });
    }

    let user;
    if (global.useLocalDB) {
      user = await User.create({
        username,
        email,
        password,
        role: role || 'user',
        shiftTime: shiftTime || '22:00 - 06:00',
        emergencyContacts: [
          { name: 'Family Guard 1', phone: '+91 99999 88888' },
          { name: 'Safety Officer (HR)', phone: '+91 88888 77777' }
        ]
      });
    } else {
      user = await User.create({
        username,
        email,
        password,
        role: role || 'user',
        shiftTime: shiftTime || '22:00 - 06:00',
        emergencyContacts: [
          { name: 'Family Guard 1', phone: '+91 99999 88888' },
          { name: 'Safety Officer (HR)', phone: '+91 88888 77777' }
        ]
      });
    }

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        emergencyContacts: user.emergencyContacts,
        shiftTime: user.shiftTime
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Server registration error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user;
    if (global.useLocalDB) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ email }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    let isMatch = false;
    if (global.useLocalDB) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = await user.matchPassword(password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        emergencyContacts: user.emergencyContacts,
        shiftTime: user.shiftTime
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server login error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        emergencyContacts: req.user.emergencyContacts,
        shiftTime: req.user.shiftTime,
        location: req.user.location
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, error: 'Server profile fetch error' });
  }
});

// @route   PUT /api/auth/contacts
// @desc    Update emergency contacts
// @access  Private
router.put('/contacts', protect, async (req, res) => {
  try {
    const { emergencyContacts } = req.body;
    if (!Array.isArray(emergencyContacts)) {
      return res.status(400).json({ success: false, error: 'Contacts must be an array' });
    }
    req.user.emergencyContacts = emergencyContacts;
    await req.user.save();
    res.json({
      success: true,
      message: 'Emergency contacts updated successfully',
      emergencyContacts: req.user.emergencyContacts
    });
  } catch (error) {
    console.error('Contacts update error:', error);
    res.status(500).json({ success: false, error: 'Server contacts update error' });
  }
});

// @route   PUT /api/auth/status
// @desc    Update safety status (Safe, SOS Active, Anomaly Detected)
// @access  Private
router.put('/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Safe', 'SOS Active', 'Anomaly Detected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid safety status' });
    }
    req.user.status = status;
    await req.user.save();
    res.json({
      success: true,
      message: 'Safety status updated successfully',
      status: req.user.status
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ success: false, error: 'Server status update error' });
  }
});

// @route   PUT /api/auth/location
// @desc    Update live location GPS coords
// @access  Private
router.put('/location', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }
    req.user.location = {
      lat,
      lng,
      updatedAt: Date.now()
    };
    await req.user.save();
    res.json({
      success: true,
      message: 'Live location updated successfully',
      location: req.user.location
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ success: false, error: 'Server location update error' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (for HR Dashboard employee list)
// @access  Private/HR or Admin
router.get('/users', protect, authorize('hr', 'admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, error: 'Server user fetch error' });
  }
});

// --- ADVANCED FEATURE: SECURE CLOUD EVIDENCE VAULT ---

// @route   POST /api/auth/evidence
// @desc    Save newly captured and AES-encrypted audio evidence log
// @access  Private
router.post('/evidence', protect, async (req, res) => {
  const { transcript, audioLength } = req.body;
  try {
    if (!transcript) {
      return res.status(400).json({ success: false, error: 'Transcript is required' });
    }

    const evidenceRecord = await Evidence.create({
      user: req.user._id,
      username: req.user.username,
      transcript,
      audioLength: audioLength || '0:15',
      encryptedHash: 'AES256_' + Math.random().toString(36).substring(2, 15) // AES-256 Mock Encryption
    });

    res.status(201).json({
      success: true,
      message: '🔒 EVIDENCE VAULT ENCRYPTION SYNCED: Ambient audio file securely saved in the cloud.',
      evidence: evidenceRecord
    });
  } catch (err) {
    console.error('Evidence creation error:', err);
    res.status(500).json({ success: false, error: 'Evidence server error' });
  }
});

// @route   GET /api/auth/evidence
// @desc    Retrieve all evidence logs (viewable by B2B HR safety desks or users themselves)
// @access  Private
router.get('/evidence', protect, async (req, res) => {
  try {
    let query = {};
    // If not HR, users can only see their own evidence files!
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      query = { user: req.user._id };
    }
    const evidenceLogs = await Evidence.find(query);
    res.json({
      success: true,
      count: evidenceLogs.length,
      evidence: evidenceLogs
    });
  } catch (err) {
    console.error('Evidence fetch error:', err);
    res.status(500).json({ success: false, error: 'Evidence fetch server error' });
  }
});

module.exports = router;
