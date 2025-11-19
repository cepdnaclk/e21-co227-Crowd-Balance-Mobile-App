const express = require('express');
const router = express.Router();
const locationController = require('../controllers/LocationController');

// Get all locations
router.get('/', locationController.getAllLocations);

// Add new location (Main Panel only)
router.post('/', locationController.addLocation);

// Update crowd score (Organizers only) - BEFORE /:locationId routes
router.patch('/:locationId/crowd', locationController.updateCrowdScore);

// Get recent activities for a location - BEFORE /:locationId routes
router.get('/:locationId/activities', locationController.getLocationActivities);

// Clear all activities for a location - BEFORE /:locationId routes
router.delete('/:locationId/activities', locationController.clearLocationActivities);

// Get organizers for a location - BEFORE /:locationId routes
router.get("/:locationId/organizers", locationController.getLocationByIdOrganizers);

// Get single location by ID - AFTER all specific sub-routes
router.get('/:locationId', locationController.getLocationById);

// Update location details (Main Panel only) - AFTER get route
router.put('/:locationId', locationController.updateLocation);

// Delete location (Main Panel only) - LAST
router.delete('/:locationId', locationController.deleteLocation);

module.exports = router;