const mongoose = require('mongoose');

const carParkSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  currentCars: { type: Number, default: 0 },
  assignedOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CarPark', carParkSchema);
