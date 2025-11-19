const CarPark = require('../model/CarParkModel');

// Get all car parks
const getAllCarParks = async (req, res) => {
  try {
    const parks = await CarPark.find({ isActive: true });
    res.status(200).json({ success: true, data: parks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching car parks', error: err.message });
  }
};

// Add a new car park (main panel)
const addCarPark = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (!name || capacity == null) {
      return res.status(400).json({ success: false, message: 'Name and capacity are required' });
    }

    const newPark = new CarPark({ name, capacity });
    const saved = await newPark.save();
    res.status(201).json({ success: true, message: 'Car park added', data: saved });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Car park name already exists' });
    }
    res.status(500).json({ success: false, message: 'Error adding car park', error: err.message });
  }
};

// Update currentCars (organizer)
const updateCurrentCars = async (req, res) => {
  try {
    const { carParkId } = req.params;
    const { currentCars } = req.body;

    if (currentCars == null || isNaN(currentCars)) {
      return res.status(400).json({ success: false, message: 'currentCars number is required' });
    }

    const park = await CarPark.findById(carParkId);
    if (!park) return res.status(404).json({ success: false, message: 'Car park not found' });

    park.currentCars = Math.max(0, Math.min(park.capacity, Number(currentCars)));
    park.lastUpdated = new Date();
    await park.save();

    res.status(200).json({ success: true, message: 'Car park updated', data: park });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating car park', error: err.message });
  }
};

// Get single car park by id
const getCarParkById = async (req, res) => {
  try {
    const park = await CarPark.findById(req.params.carParkId);
    if (!park) return res.status(404).json({ success: false, message: 'Car park not found' });
    res.status(200).json({ success: true, data: park });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching car park', error: err.message });
  }
};

// Delete car park (main panel)
const deleteCarPark = async (req, res) => {
  try {
    const { carParkId } = req.params;
    const park = await CarPark.findByIdAndDelete(carParkId);
    if (!park) return res.status(404).json({ success: false, message: 'Car park not found' });
    res.status(200).json({ success: true, message: 'Car park deleted', data: { _id: carParkId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting car park', error: err.message });
  }
};

module.exports = {
  getAllCarParks,
  addCarPark,
  updateCurrentCars,
  getCarParkById,
  deleteCarPark,
};
