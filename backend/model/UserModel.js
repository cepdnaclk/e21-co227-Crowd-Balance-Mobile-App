const mongoose = require("mongoose");

// Base User Schema (Superclass)
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['Organizer', 'Panel'] // Fixed to match discriminator keys
    }
}, {
    discriminatorKey: 'userType', // Field used for discrimination
    collection: 'users', // All users stored in same collection
    // timestamps: true // Adds createdAt and updatedAt
});

// Create base User model
const User = mongoose.model('User', userSchema);

// Organizer Schema (Subclass) - Fixed field names
const organizerSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    assignedHall: { // Fixed typo: was 'asignedHall'
        type: String,
        default: null
    },
    status: { // Available or Busy
        type: String,
        enum: ['Available', 'Busy'],
        default: 'Available'
    }
});

// Main Panel Schema (Subclass) - Fixed field names
const mainPanelSchema = new mongoose.Schema({
    role: { // panel or admin (developers)
        type: String,
        required: true,
        enum: ['panel', 'admin'],
        default: 'panel'
    }
});

// Create discriminator models - Fixed discriminator keys
const Organizer = User.discriminator('Organizer', organizerSchema);
const MainPanel = User.discriminator('Panel', mainPanelSchema);

module.exports = {
    User,
    Organizer,
    MainPanel
};
