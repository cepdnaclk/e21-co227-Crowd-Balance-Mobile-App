const Location = require("../model/LocationModel");
const { Organizer } = require("../model/UserModel");

// Get single location with its organizers
const getLocationByIdOrganizers = async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Find all organizers assigned to this hall
    const organizers = await Organizer.find({
      assignedHall: location.name, // matching hall name
    }).select("-password");

    // Add them into response
    const locationData = {
      ...location.toObject(),
      organizers,
    };

    res.status(200).json({
      success: true,
      data: locationData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching location",
      error: error.message,
    });
  }
};

// Helper function to calculate scores from activity log
const calculateScoresFromActivityLog = (activityLog) => {
  if (!activityLog || activityLog.length === 0) {
    return {
      minCrowdScore: 0,
      moderateCrowdScore: 0,
      maxCrowdScore: 0,
      total: 0,
    };
  }

  const scores = activityLog.reduce(
    (acc, activity) => {
      switch (activity.crowdLevel) {
        case "min":
          acc.minCrowdScore += 1;
          break;
        case "moderate":
          acc.moderateCrowdScore += 1;
          break;
        case "max":
          acc.maxCrowdScore += 1;
          break;
      }
      return acc;
    },
    { minCrowdScore: 0, moderateCrowdScore: 0, maxCrowdScore: 0 }
  );

  return {
    ...scores,
    total:
      scores.minCrowdScore + scores.moderateCrowdScore + scores.maxCrowdScore,
  };
};

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true });

    // Calculate scores from activity log for each location
    const locationsWithCalculatedScores = locations.map((location) => {
      const calculatedScores = calculateScoresFromActivityLog(
        location.activityLog
      );

      return {
        ...location.toObject(),
        // Add calculated scores (these replace the removed database fields)
        minCrowdScore: calculatedScores.minCrowdScore,
        moderateCrowdScore: calculatedScores.moderateCrowdScore,
        maxCrowdScore: calculatedScores.maxCrowdScore,
        totalScore: calculatedScores.total,
      };
    });

    res.status(200).json({
      success: true,
      data: locationsWithCalculatedScores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching locations",
      error: error.message,
    });
  }
};

// Get single location
const getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Calculate scores from activity log
    const calculatedScores = calculateScoresFromActivityLog(
      location.activityLog
    );

    const locationWithCalculatedScores = {
      ...location.toObject(),
      minCrowdScore: calculatedScores.minCrowdScore,
      moderateCrowdScore: calculatedScores.moderateCrowdScore,
      maxCrowdScore: calculatedScores.maxCrowdScore,
      totalScore: calculatedScores.total,
    };

    res.status(200).json({
      success: true,
      data: locationWithCalculatedScores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching location",
      error: error.message,
    });
  }
};

// Add new location (Main Panel only) - UPDATED: Removed score initialization
const addLocation = async (req, res) => {

  console.log("add location controller...");
  try {
    const { name, capacity } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Name and capacity are required",
      });
    }

    const newLocation = new Location({
      name,
      capacity,
      // REMOVED: maxCrowdScore, moderateCrowdScore, minCrowdScore initialization
      activityLog: [], // Initialize empty activity log
    });

    const savedLocation = await newLocation.save();
    
    // Return with calculated scores (all will be 0 for new location)
    const calculatedScores = calculateScoresFromActivityLog([]);
    const locationWithScores = {
      ...savedLocation.toObject(),
      minCrowdScore: calculatedScores.minCrowdScore,
      moderateCrowdScore: calculatedScores.moderateCrowdScore,
      maxCrowdScore: calculatedScores.maxCrowdScore,
      totalScore: calculatedScores.total,
    };
    
    res.status(201).json({
      success: true,
      message: "Location added successfully",
      data: locationWithScores,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Location name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error adding location",
      error: error.message,
    });
  }
};

// Update crowd score (Organizers only) - UPDATED: Only uses activity log
const updateCrowdScore = async (req, res) => {
  console.log("location id is: " + req.params.locationId);
  console.log("Request body:", req.body);

  try {
    const { locationId } = req.params;
    const { crowdLevel } = req.body; // 'min', 'moderate', 'max'

    if (!["min", "moderate", "max"].includes(crowdLevel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid crowd level. Use: min, moderate, or max",
      });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Create new activity entry
    const newActivity = {
      crowdLevel: crowdLevel,
      timestamp: new Date(),
      organizerId: "organizer", // You might want to get this from auth token
    };

    // IMPORTANT: Only add to activity log, don't touch the old score fields
    location.activityLog.push(newActivity);
    location.lastUpdated = new Date();

    // Save the location (this preserves ALL activity log data)
    await location.save();

    console.log(`Activity added to location ${location.name}. Total activities: ${location.activityLog.length}`);

    // Calculate new scores from activity log
    const calculatedScores = calculateScoresFromActivityLog(
      location.activityLog
    );

    // Return location with calculated scores
    const locationWithCalculatedScores = {
      ...location.toObject(),
      minCrowdScore: calculatedScores.minCrowdScore,
      moderateCrowdScore: calculatedScores.moderateCrowdScore,
      maxCrowdScore: calculatedScores.maxCrowdScore,
      totalScore: calculatedScores.total,
    };

    res.status(200).json({
      success: true,
      message: `${crowdLevel} crowd level updated successfully. Total reports: ${calculatedScores.total}`,
      data: locationWithCalculatedScores,
    });
  } catch (error) {
    console.error("Error updating crowd score:", error);
    res.status(500).json({
      success: false,
      message: "Error updating crowd score",
      error: error.message,
    });
  }
};

// Get recent activities for a location
const getLocationActivities = async (req, res) => {
  try {
    const { locationId } = req.params;

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Calculate scores from activity log
    const calculatedScores = calculateScoresFromActivityLog(
      location.activityLog
    );

    console.log(`Returning ${location.activityLog.length} activities for location ${location.name}`);

    res.status(200).json({
      success: true,
      data: {
        locationName: location.name,
        activities: location.activityLog || [],
        calculatedScores: calculatedScores,
        lastUpdated: location.lastUpdated,
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching activities",
      error: error.message,
    });
  }
};

// Update location details (Main Panel only)
const updateLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const updates = req.body;

    // Don't allow updates to the old score fields if they're accidentally included
    delete updates.maxCrowdScore;
    delete updates.moderateCrowdScore;
    delete updates.minCrowdScore;

    const location = await Location.findByIdAndUpdate(locationId, updates, {
      new: true,
      runValidators: true,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Calculate and return with scores
    const calculatedScores = calculateScoresFromActivityLog(
      location.activityLog
    );

    const locationWithScores = {
      ...location.toObject(),
      minCrowdScore: calculatedScores.minCrowdScore,
      moderateCrowdScore: calculatedScores.moderateCrowdScore,
      maxCrowdScore: calculatedScores.maxCrowdScore,
      totalScore: calculatedScores.total,
    };

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: locationWithScores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating location",
      error: error.message,
    });
  }
};

// Clear all activities for a location
const clearLocationActivities = async (req, res) => {

  try {
    const { locationId } = req.params;

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const activitiesCount = location.activityLog.length;
    
    if (activitiesCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No activities to clear",
      });
    }

    // Clear the activity log
    location.activityLog = [];
    location.lastUpdated = new Date();

    await location.save();

    console.log(`Cleared ${activitiesCount} activities from location ${location.name}`);

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${activitiesCount} activity reports from ${location.name}`,
      data: {
        locationId: location._id,
        locationName: location.name,
        clearedActivities: activitiesCount,
        lastUpdated: location.lastUpdated,
      },
    });
  } catch (error) {
    console.error("Error clearing activitiesss:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing activities",
      error: error.message,
    });
  }
};

// Delete location (Main Panel only)
const deleteLocation = async (req, res) => {
  console.log("Coming to deleting Locations...");

  try {
    const { locationId } = req.params;

    const location = await Location.findByIdAndUpdate(
      locationId,
      { isActive: false },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting location",
      error: error.message,
    });
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  addLocation,
  updateCrowdScore,
  updateLocation,
  deleteLocation,
  getLocationActivities,
  getLocationByIdOrganizers,
  clearLocationActivities
};