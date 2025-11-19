const mongoose = require('mongoose');
const CarPark = require('../model/CarParkModel');

const uri = 'mongodb+srv://adminUser:5NW3N2LlFEBnLE4G@cluster0.llcjvmk.mongodb.net/crowd-balance-db';

async function seed() {
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const sample = [
    { name: 'Main Car Park', capacity: 100, currentCars: 25 },
    { name: 'East Lot', capacity: 50, currentCars: 45 },
    { name: 'West Overflow', capacity: 30, currentCars: 5 },
  ];

  await CarPark.deleteMany({});
  await CarPark.insertMany(sample);
  console.log('Seeded car parks');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
