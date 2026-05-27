const mongoose = require('mongoose');

const SafetyReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Allow anonymous reporting
  },
  title: {
    type: String,
    required: [true, 'Please add a title for the report'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add details for the report'],
  },
  type: {
    type: String,
    enum: ['safe', 'warning', 'unsafe', 'police'],
    required: [true, 'Please specify the safety zone type'],
  },
  location: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SafetyReport', SafetyReportSchema);
