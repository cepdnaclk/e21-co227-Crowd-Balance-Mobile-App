// Load environment variables FIRST
require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./routes/UserRoutes");
const missingReportRouter = require("./routes/MissingReportRoutes");
const locationRoutes = require("./routes/LocationRoutes");
const notificationRouter = require("./routes/NotificationRoutes");
const schoolRoutes = require('./routes/SchoolRoutes');
const carParkRoutes = require('./routes/CarParkRoutes');
const chatRoutes = require('./routes/chatRoutes');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// Construct MongoDB URI from environment variables
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}`;

// Debug: Check if environment variables are loaded
if (!process.env.MONGODB_USERNAME || !process.env.MONGODB_PASSWORD) {
  console.error('Missing MongoDB credentials!');
  process.exit(1);
}
console.log('Environment variables loaded successfully');
console.log('MongoDB Cluster:', process.env.MONGODB_CLUSTER);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// Routes
app.use("/users", userRouter);
app.use("/missing-reports", missingReportRouter);
app.use("/locations", locationRoutes);
app.use("/notifications", notificationRouter);
app.use('/schools', schoolRoutes);
app.use('/car-parks', carParkRoutes);
app.use('/api', chatRoutes);

// Health check endpoint 
app.get("/", (req, res) => {
  res.json({
    message: "Server is running!",
    endpoints: {
      users: "/users",
      missingReports: "/missing-reports",
      locations: "/locations",
    },
  });
});

// Connect to MongoDB database
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB!");
    return app.listen(PORT);
  })
  .then(() => {
    console.log(`Server running on port: ${PORT}`);
    require("./cronJobs/cleanupJob");
    console.log("Cron jobs initialized");
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });