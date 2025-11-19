// models/School.js
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  schoolNumber: {
    type: String,
    required: [true, 'School number is required'],
    unique: true,
    trim: true
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  guardian: {
    type: String,
    required: [true, 'Guardian name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Only allow numbers starting with 0 or +94
        // Examples: 0771234567, +94771234567
        return /^(\+94|0)\d{9}$/.test(v);
      },
      message: 'Phone number must start with 0 or +94 and be followed by 9 digits (e.g., 0771234567 or +94771234567)'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// // Index for faster searches
// schoolSchema.index({ schoolNumber: 1 });
// schoolSchema.index({ schoolName: 1 });

module.exports = mongoose.model('School', schoolSchema);