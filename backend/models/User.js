const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Prevents returning password by default in queries
  },
  emergencyContacts: [
    {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    }
  ],
  status: {
    type: String,
    enum: ['Safe', 'SOS Active', 'Anomaly Detected'],
    default: 'Safe',
  },
  role: {
    type: String,
    enum: ['user', 'hr', 'admin'],
    default: 'user',
  },
  shiftTime: {
    type: String,
    default: '22:00 - 06:00', // Default corporate night shift
  },
  location: {
    lat: { type: Number, default: 12.9716 }, // Default Bangalore lat
    lng: { type: Number, default: 77.5946 }, // Default Bangalore lng
    updatedAt: { type: Date, default: Date.now },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
