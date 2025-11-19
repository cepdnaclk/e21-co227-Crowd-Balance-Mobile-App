const mongoose = require("mongoose");

const missingReportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true
    },
    image: {
        type: String, // Store as base64 string or file path/URL
        required: false
    },
    lastseenlocation: {
        type: String,
        required: true
    },
    description: {
        type: [String],
        required: false
    },
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: { // May be remove this
        type: String,
        enum: ['Active', 'Found', 'Closed'],
        default: 'Active'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model("MissingReport", missingReportSchema);