// controllers/schoolController.js
const School = require('../model/SchoolModel');

// Get all schools
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find()
      .populate('createdBy', 'name userType')
      .populate('updatedBy', 'name userType')
      .sort({ schoolNumber: 1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schools',
      error: error.message
    });
  }
};

// Get school by ID
exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('createdBy', 'name userType')
      .populate('updatedBy', 'name userType');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      school
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching school',
      error: error.message
    });
  }
};

// Create new school
exports.createSchool = async (req, res) => {
  try {
    const { schoolNumber, schoolName, guardian, phoneNumber } = req.body;
    const userId = req.user?.id || req.body.userId;

    // Validation
    if (!schoolNumber || !schoolName || !guardian || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (schoolNumber, schoolName, guardian, phoneNumber)'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if school number already exists
    const existingSchool = await School.findOne({ 
      schoolNumber: schoolNumber.toUpperCase() 
    });

    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School number already exists'
      });
    }

    const newSchool = new School({
      schoolNumber,
      schoolName,
      guardian,
      phoneNumber,
      createdBy: userId
    });

    const savedSchool = await newSchool.save();
    
    // Populate the created school data
    const populatedSchool = await School.findById(savedSchool._id)
      .populate('createdBy', 'name userType');

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      school: populatedSchool
    });
  } catch (error) {
    console.error('Error creating school:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'School number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating school',
      error: error.message
    });
  }
};

// Update school
exports.updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolNumber, schoolName, guardian, phoneNumber } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if school exists
    const existingSchool = await School.findById(id);
    if (!existingSchool) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check if new school number conflicts with existing one (excluding current school)
    if (schoolNumber && schoolNumber.toUpperCase() !== existingSchool.schoolNumber) {
      const duplicateSchool = await School.findOne({ 
        schoolNumber: schoolNumber.toUpperCase(),
        _id: { $ne: id }
      });

      if (duplicateSchool) {
        return res.status(400).json({
          success: false,
          message: 'School number already exists'
        });
      }
    }

    const updatedSchool = await School.findByIdAndUpdate(
      id,
      {
        ...(schoolNumber && { schoolNumber }),
        ...(schoolName && { schoolName }),
        ...(guardian && { guardian }),
        ...(phoneNumber && { phoneNumber }),
        updatedBy: userId
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'name userType')
     .populate('updatedBy', 'name userType');

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      school: updatedSchool
    });
  } catch (error) {
    console.error('Error updating school:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating school',
      error: error.message
    });
  }
};

// Delete school
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSchool = await School.findByIdAndDelete(id);

    if (!deletedSchool) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'School deleted successfully',
      school: deletedSchool
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting school',
      error: error.message
    });
  }
};

// Search schools
exports.searchSchools = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const schools = await School.find({
      $or: [
        { schoolNumber: searchRegex },
        { schoolName: searchRegex },
        { guardian: searchRegex },
        { phoneNumber: searchRegex }
      ]
    })
    .populate('createdBy', 'name userType')
    .populate('updatedBy', 'name userType')
    .sort({ schoolNumber: 1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (error) {
    console.error('Error searching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching schools',
      error: error.message
    });
  }
};