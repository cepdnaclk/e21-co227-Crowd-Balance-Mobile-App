// Username: adminUser
// Password: 5NW3N2LlFEBnLE4G
// URL: mongodb+srv://adminUser:<db_password>@cluster0.llcjvmk.mongodb.net/

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

// const chatRoutes = require('./routes/chat');
// app.use('/api', chatRoutes);

// Middleware
app.use(express.json({ limit: "50mb" })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // For form data
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

// Connect to mongodb database
mongoose
  .connect(
    "mongodb+srv://adminUser:5NW3N2LlFEBnLE4G@cluster0.llcjvmk.mongodb.net/crowd-balance-db"
  )
  .then(() => {
    console.log("Connected to MongoDB!");
    return app.listen(PORT);
  })
  .then(() => {
    // Start the server only after the database connected
    console.log(`Server running on port: ${PORT}`);

    require("./cronJobs/cleanupJob");
    console.log("Going to cornJobs");

  })
  .catch((err) => {
    console.log(err);
  });
