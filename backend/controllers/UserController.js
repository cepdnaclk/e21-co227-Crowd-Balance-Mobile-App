const { User, Organizer, MainPanel } = require("../model/UserModel");

// Get all users (both Organizers and MainPanels)
const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find().select("-password"); // Exclude password from response
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!users || users.length === 0) {
    return res.status(404).json({ message: "No users found!" });
  }

  return res.status(200).json({ users });
};

// Get all organizers only
const getAllOrganizers = async (req, res, next) => {
  let organizers;
  try {
    organizers = await Organizer.find().select("-password");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!organizers || organizers.length === 0) {
    return res.status(404).json({ message: "No organizers found!" });
  }

  return res.status(200).json({ organizers });
};

// Get all main panels only
const getAllMainPanels = async (req, res, next) => {
  let mainPanels;
  try {
    mainPanels = await MainPanel.find().select("-password");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!mainPanels || mainPanels.length === 0) {
    return res.status(404).json({ message: "No main panels found!" });
  }

  return res.status(200).json({ mainPanels });
};

// Add a new organizer - FIXED FIELDS
const addOrganizer = async (req, res, next) => {
  const { email, password, name, phone, assignedHall, status } = req.body;

  // Validation
  if (!email || !password || !name || !phone) {
    return res
      .status(400)
      .json({ message: "Email, password, name, and phone are requiredd" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const organizer = new Organizer({
      email: email.toLowerCase().trim(),
      password, // In production, hash this password
      name: name.trim(),
      phone: phone.trim(),
      assignedHall: assignedHall || null,
      status: status || "Available",
    });

    await organizer.save();

    // Remove password from response
    const organizerResponse = organizer.toObject();
    delete organizerResponse.password;

    return res.status(201).json({ organizer: organizerResponse });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Unable to add organizer" });
  }
};

// Add a new main panel - FIXED FIELDS
const addMainPanel = async (req, res, next) => {
  const { email, password, name, role } = req.body;

  console.log(req.body);

  // Validation
  if (!email || !password || !name || !role) {
    return res
      .status(400)
      .json({ message: "Email, password, name, and role are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const mainPanel = new MainPanel({
      email: email.toLowerCase().trim(),
      password, // In production, hash this password
      name: name.trim(),
      role,
    });

    await mainPanel.save();

    // Remove password from response
    const mainPanelResponse = mainPanel.toObject();
    delete mainPanelResponse.password;

    return res.status(201).json({ mainPanel: mainPanelResponse });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Unable to add main panel" });
  }
};


// Get user by ID (works for both Organizers and MainPanels)
const getByID = async (req, res, next) => {
  const id = req.params.id;
  let user;

  try {
    user = await User.findById(id).select("-password");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  return res.status(200).json({ user });
};

// Update organizer - FIXED FIELDS
const updateOrganizer = async (req, res, next) => {
  console.log("Comming to update organizer controller...");
  const id = req.params.id;
  const { email, password, name, phone, assignedHall, status } = req.body;

  let organizer;

  try {
    // Build update object (only include provided fields)
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password; // Hash in production
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (assignedHall !== undefined) updateData.assignedHall = assignedHall;
    if (status) updateData.status = status;

    organizer = await Organizer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!organizer) {
    return res.status(404).json({ message: "Unable to update organizer!" });
  }

  return res.status(200).json({ organizer });
};

// Update main panel - FIXED FIELDS
const updateMainPanel = async (req, res, next) => {
  const id = req.params.id;
  const { email, password, name, role } = req.body;

  let mainPanel;

  try {
    // Build update object (only include provided fields)
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password; // Hash in production
    if (name) updateData.name = name;
    if (role) updateData.role = role;

    mainPanel = await MainPanel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!mainPanel) {
    return res.status(404).json({ message: "Unable to update main panel!" });
  }

  return res.status(200).json({ mainPanel });
};

// Delete user (works for both Organizers and MainPanels)
const deleteUser = async (req, res, next) => {
  const id = req.params.id;
  let user;

  try {
    user = await User.findByIdAndDelete(id).select("-password");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }

  if (!user) {
    return res.status(404).json({ message: "Unable to delete user!" });
  }

  return res.status(200).json({
    message: `${user.userType} deleted successfully`,
    user,
  });
};

// const { Organizer, User } = require("../model/UserModel");

// Register controller function
const registerUser = async (req, res) => {
  console.log("Received registration data:", req.body);

  const { email, password, name, userType, phone, assignedHall, status } = req.body;

  try {
    // Check if user already exists in the User collection (this covers both Organizers and MainPanels)
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      return res.json({
        status: "error",
        message: "Email already exists",
      });
    }

    let newUser;

    if (userType === "Organizer") {
      // Create organizer with required fields
      newUser = new Organizer({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        userType,
        phone: phone.trim(),
        assignedHall: assignedHall || "", // Default empty string
        status: status || "Available", // Match enum values
      });
    } else if (userType === "Panel") {
      // Create main panel user
      newUser = new MainPanel({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        userType,
        role: "panel", // Default role
      });
    } else {
      return res.json({
        status: "error",
        message: "Invalid user type. Must be 'Organizer' or 'Panel'",
      });
    }

    await newUser.save();
    
    res.json({
      status: "ok",
      message: `${userType} registered successfully`,
    });
    
  } catch (err) {
    console.error("Registration error:", err);

    // Handle MongoDB duplicate key error (just in case)
    if (err.code === 11000) {
      return res.json({
        status: "error",
        message: "Email already exists",
      });
    } 
    
    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.json({
        status: "error",
        message: `Validation error: ${errors.join(", ")}`,
      });
    } 
    
    // Handle other errors
    return res.json({
      status: "error",
      message: "Registration failed. Please try again.",
    });
  }
};

// Login controller function
const loginUser = async (req, res) => {
  const { gmail, password } = req.body;

  try {
    // Search in the User collection
    const user = await User.findOne({ email: gmail });

    if (!user) {
      return res.json({ err: "User not found" });
    }

    if (user.password === password) {
      return res.json({
        status: "ok",
        userType: user.userType,
        userId: user._id,
        name: user.name,
      });
    } else {
      return res.json({ err: "Incorrect password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server error" });
  }
};

/*
// Register Administrator endpoint
// Still do not have a frontend
app.post("/register/panel", async (req, res) => {
    const { name, email, password, role } = req.body;
    
    try {
        const administrator = new Administrator({
            email,
            password,
            name,
            role
        });
        
        await administrator.save();
        res.json({ status: "ok", message: "Administrator registered successfully" });
    } catch (err) {
        console.error(err);
        res.json({ status: "error", message: "Admin registration failed" });
    }
});
*/

/*
// Login function for both user types - FIXED
const loginUser = async (req, res, next) => {
    const { email, password, userType } = req.body;
    
    // Validation
    if (!email || !password || !userType) {
        return res.status(400).json({ message: "Email, password, and userType are required" });
    }
    
    let user;
    
    try {
        // Find user based on userType
        if (userType === 'organizer' || userType === 'Organizer') {
            user = await Organizer.findOne({ email });
        } else if (userType === 'panel' || userType === 'Panel') {
            user = await MainPanel.findOne({ email });
        } else {
            return res.status(400).json({ message: "Invalid user type. Use 'organizer' or 'panel'" });
        }
        
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        
        // In a real app, you'd hash and compare passwords using bcrypt
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        return res.status(200).json({ 
            message: "Login successful",
            user: userResponse 
        });
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
};
*/

module.exports = {
  getAllUsers,
  getAllOrganizers,
  getAllMainPanels,
  addOrganizer,
  addMainPanel,
  getByID,
  updateOrganizer,
  updateMainPanel,
  deleteUser,
  registerUser,
  loginUser,
};
