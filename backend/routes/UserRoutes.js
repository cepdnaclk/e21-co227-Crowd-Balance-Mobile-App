const express = require("express");
const router = express.Router();

// Import user controllers
const {
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
    loginUser
} = require("../controllers/UserController");

// Authentication route (should be first)
router.post("/register", registerUser);
router.post("/login", loginUser); // POST /users/login - User login

// Specific routes BEFORE generic routes to avoid conflicts
router.get("/organizers", getAllOrganizers); // GET /users/organizers - Get all organizers
router.post("/organizers", addOrganizer); // POST /users/organizers - Add new organizer
router.put("/organizers/:id", updateOrganizer); // PUT /users/organizers/:id - Update organizer

router.get("/mainpanels", getAllMainPanels); // GET /users/mainpanels - Get all main panels
router.post("/mainpanels", addMainPanel); // POST /users/mainpanels - Add new main panel
router.put("/mainpanels/:id", updateMainPanel); // PUT /users/mainpanels/:id - Update main panel

// General user routes (should be last to avoid conflicts)
router.get("/", getAllUsers); // GET /users - Get all users (Organizers and MainPanels)
router.get("/:id", getByID); // GET /users/:id - Get user by ID
router.delete("/:id", deleteUser); // DELETE /users/:id - Delete user by ID

module.exports = router;