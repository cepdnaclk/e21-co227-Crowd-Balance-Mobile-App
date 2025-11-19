const express = require('express');
const router = express.Router();
const carParkController = require('../controllers/CarParkController');

// List car parks
router.get('/', carParkController.getAllCarParks);

// Add car park (main panel)
router.post('/', carParkController.addCarPark);

// Update currentCars (organizers)
router.patch('/:carParkId/current', carParkController.updateCurrentCars);

// Get single car park
router.get('/:carParkId', carParkController.getCarParkById);

// Delete car park (main panel)
router.delete('/:carParkId', carParkController.deleteCarPark);

module.exports = router;
