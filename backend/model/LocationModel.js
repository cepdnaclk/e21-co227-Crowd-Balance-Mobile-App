const mongoose = require("mongoose");

// Activity Log Schema for tracking crowd updates
const activityLogSchema = new mongoose.Schema({
  crowdLevel: {
    type: String,
    enum: ['min', 'moderate', 'max'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  organizerId: {
    type: String,
    default: 'organizer' // Can replace this with actual organizer ID
  }
});

// Location Schema - UPDATED: Removed redundant score fields
const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    unique: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // REMOVED: maxCrowdScore, moderateCrowdScore, minCrowdScore
  // These are now calculated from activityLog
  
  // Activity tracking - this is the source of truth
  activityLog: {
    type: [activityLogSchema],
    default: []
  },
  // Track the last update time
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model("Location", locationSchema);