const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Dynamic hot-swap loaders
let SafetyReport = require('../models/SafetyReport');

router.use((req, res, next) => {
  if (global.useLocalDB) {
    SafetyReport = require('../config/localDb').reports;
  } else {
    SafetyReport = require('../models/SafetyReport');
  }
  next();
});

// Seed data to make the map look active out of the box
const seedReports = [
  {
    title: 'Capgemini Tech Park Safe Zone',
    description: 'Highly secure tech campus, fully lit, 24/7 security guards and continuous CCTV monitoring.',
    type: 'safe',
    location: { lat: 12.9720, lng: 77.5950 }
  },
  {
    title: 'Isolated Alley Way',
    description: 'Extremely dark, non-functioning streetlights, high isolated activity at night. Better to avoid.',
    type: 'unsafe',
    location: { lat: 12.9690, lng: 77.5910 }
  },
  {
    title: 'Active Police Patrol Beat',
    description: 'Police interceptor vehicle stationed here every evening from 10 PM to 6 AM.',
    type: 'police',
    location: { lat: 12.9750, lng: 77.5980 }
  },
  {
    title: 'Construction Area Road Block',
    description: 'Ongoing metro construction, narrows the road, very low visibility. Take detours.',
    type: 'warning',
    location: { lat: 12.9740, lng: 77.5920 }
  }
];

// @route   GET /api/reports
// @desc    Get all safety reports (for safety zones maps)
// @access  Public
router.get('/', async (req, res) => {
  try {
    let reports = await SafetyReport.find();
    
    // If database is empty, seed it with initial markers so the map is instantly beautiful!
    if (reports.length === 0) {
      reports = await SafetyReport.insertMany(seedReports);
      console.log('✅ Seeded default safety reports successfully in database');
    }

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ success: false, error: 'Server fetch reports error' });
  }
});

// @route   POST /api/reports
// @desc    Submit a new safety report (anonymous or authenticated)
// @access  Public (Optional auth)
router.post('/', async (req, res) => {
  const { title, description, type, location, userId } = req.body;

  try {
    if (!title || !description || !type || !location || !location.lat || !location.lng) {
      return res.status(400).json({ success: false, error: 'All fields (title, description, type, location.lat, location.lng) are required' });
    }

    const report = await SafetyReport.create({
      title,
      description,
      type,
      location,
      reporter: userId || null // Will link to user if logged in
    });

    res.status(201).json({
      success: true,
      message: 'Safety report submitted successfully! Thank you for protecting the community.',
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, error: 'Server report submission error' });
  }
});

module.exports = router;
