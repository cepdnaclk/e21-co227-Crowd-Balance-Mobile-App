const MissingReport = require("../model/MissingReportModel");
const { User } = require("../model/UserModel");

// Get all missing reports
const getAllMissingReports = async (req, res, next) => {
  let reports;
  try {
    reports = await MissingReport.find()
      .populate("UserId", "name email userType") // Populate user details
      .sort({ createdAt: -1 }); // Most recent first
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!reports || reports.length === 0) {
    return res.status(404).json({ message: "No missing reports found!" });
  }

  return res.status(200).json({ reports });
};

// Get missing reports by status
const getMissingReportsByStatus = async (req, res, next) => {
  const { status } = req.params;

  if (!["Active", "Found", "Closed"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Use 'Active', 'Found', or 'Closed'" });
  }

  let reports;
  try {
    reports = await MissingReport.find({ status })
      .populate("UserId", "name email userType")
      .sort({ createdAt: -1 });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!reports || reports.length === 0) {
    return res
      .status(404)
      .json({ message: `No ${status.toLowerCase()} missing reports found!` });
  }

  return res.status(200).json({ reports });
};

// Get missing reports by user ID
const getMissingReportsByUserId = async (req, res, next) => {
  const { userId } = req.params;

  let reports;
  try {
    reports = await MissingReport.find({ UserId: userId })
      .populate("UserId", "name email userType")
      .sort({ createdAt: -1 });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!reports || reports.length === 0) {
    return res
      .status(404)
      .json({ message: "No missing reports found for this user!" });
  }

  return res.status(200).json({ reports });
};

// Create a new missing report
const createMissingReport = async (req, res, next) => {
  const { name, age, gender, image, lastseenlocation, description, UserId } =
    req.body;

  // Validation
  if (!age || !gender || !lastseenlocation || !description || !UserId) {
    return res.status(400).json({
      message: "All fields are required: age, gender, lastseenlocation, UserId",
    });
  }

  try {
    // Verify that the user exists
    const user = await User.findById(UserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate age
    if (age < 0 || age > 150) {
      return res.status(400).json({ message: "Invalid age" });
    }

    // Validate description array
    // if (!Array.isArray(description) || description.length === 0) {
    //     return res.status(400).json({ message: "Description must be a non-empty array of strings" });
    // }

    const missingReport = new MissingReport({
      name: name ? name.trim() : null, // Name is optional
      age: parseInt(age),
      gender,
      image: image || null, // Image is optional
      lastseenlocation: lastseenlocation.trim(),
      description:
        description && Array.isArray(description)
          ? description.map((desc) => desc.trim())
          : [], // Description is optional
      UserId,
    });

    await missingReport.save();

    // Populate user details before sending response
    await missingReport.populate("UserId", "name email userType");

    return res.status(201).json({
      message: "Missing report created successfully",
      report: missingReport,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to create missing report" });
  }
};

// Get missing report by ID
const getMissingReportById = async (req, res, next) => {
  const { id } = req.params;
  let report;

  try {
    report = await MissingReport.findById(id).populate(
      "UserId",
      "name email userType"
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!report) {
    return res.status(404).json({ message: "Missing report not found!" });
  }

  return res.status(200).json({ report });
};

// Update missing report
const updateMissingReport = async (req, res, next) => {
  const { id } = req.params;
  const { name, age, gender, image, lastseenlocation, description, status } =
    req.body;

  let report;

  try {
    // Build update object (only include provided fields)
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (age) {
      if (age < 0 || age > 150) {
        return res.status(400).json({ message: "Invalid age" });
      }
      updateData.age = parseInt(age);
    }
    if (gender) updateData.gender = gender;
    if (image) updateData.image = image;
    if (lastseenlocation) updateData.lastseenlocation = lastseenlocation.trim();
    if (description) {
      if (!Array.isArray(description) || description.length === 0) {
        return res
          .status(400)
          .json({
            message: "Description must be a non-empty array of strings",
          });
      }
      updateData.description = description.map((desc) => desc.trim());
    }
    if (status) updateData.status = status;

    report = await MissingReport.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("UserId", "name email userType");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!report) {
    return res
      .status(404)
      .json({ message: "Unable to update missing report!" });
  }

  return res.status(200).json({
    message: "Missing report updated successfully",
    report,
  });
};

// Update missing report status only
const updateMissingReportStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["Active", "Found", "Closed"].includes(status)) {
    return res.status(400).json({
      message: "Valid status is required. Use 'Active', 'Found', or 'Closed'",
    });
  }

  let report;

  try {
    report = await MissingReport.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate("UserId", "name email userType");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!report) {
    return res.status(404).json({ message: "Missing report not found!" });
  }

  return res.status(200).json({
    message: "Missing report status updated successfully",
    report,
  });
};

// Delete missing report
const deleteMissingReport = async (req, res, next) => {
  const { id } = req.params;
  let report;

  try {
    report = await MissingReport.findByIdAndDelete(id).populate(
      "UserId",
      "name email userType"
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!report) {
    return res
      .status(404)
      .json({ message: "Unable to delete missing report!" });
  }

  return res.status(200).json({
    message: "Missing report deleted successfully",
    report,
  });
};

// Search missing reports by name or location
const searchMissingReports = async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ message: "Search query is required" });
  }

  let reports;

  try {
    reports = await MissingReport.find({
      $or: [
        { name: { $regex: query.trim(), $options: "i" } },
        { lastseenlocation: { $regex: query.trim(), $options: "i" } },
        {
          description: { $elemMatch: { $regex: query.trim(), $options: "i" } },
        },
      ],
    })
      .populate("UserId", "name email userType")
      .sort({ createdAt: -1 });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!reports || reports.length === 0) {
    return res
      .status(404)
      .json({ message: "No matching missing reports found!" });
  }

  return res.status(200).json({ reports });
};

module.exports = {
  getAllMissingReports,
  getMissingReportsByStatus,
  getMissingReportsByUserId,
  createMissingReport,
  getMissingReportById,
  updateMissingReport,
  updateMissingReportStatus,
  deleteMissingReport,
  searchMissingReports,
};
