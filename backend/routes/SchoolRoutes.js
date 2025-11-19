// routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  searchSchools
} = require('../controllers/SchoolController');

// Middleware for authentication (adjust based on your auth system)
// const authMiddleware = require('../middleware/auth'); 


// GET routes
router.get('/', getAllSchools);
router.get('/search', searchSchools);
router.get('/:id', getSchoolById);

// POST routes
router.post('/', createSchool);

// PUT routes
router.put('/:id', updateSchool);

// DELETE routes
router.delete('/:id', deleteSchool);

module.exports = router;
