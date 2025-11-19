const express = require("express");
const router = express.Router();

// Import missing report controllers
const {
    getAllMissingReports,
    getMissingReportsByStatus,
    getMissingReportsByUserId,
    createMissingReport,
    getMissingReportById,
    updateMissingReport,
    updateMissingReportStatus,
    deleteMissingReport,
    searchMissingReports
} = require("../controllers/MissingReportController");

// Search route (should be before specific routes to avoid conflicts)
router.get("/search", searchMissingReports); // GET /missing-reports/search?query=name

// Status-based routes
router.get("/status/:status", getMissingReportsByStatus); // GET /missing-reports/status/Active

// User-based routes
router.get("/user/:userId", getMissingReportsByUserId); // GET /missing-reports/user/:userId

// Main CRUD routes
router.get("/", getAllMissingReports); // GET /missing-reports - Get all missing reports
router.post("/", createMissingReport); // POST /missing-reports - Create new missing report
router.get("/:id", getMissingReportById); // GET /missing-reports/:id - Get missing report by ID
router.put("/:id", updateMissingReport); // PUT /missing-reports/:id - Update missing report
router.patch("/:id/status", updateMissingReportStatus); // PATCH /missing-reports/:id/status - Update only status
router.delete("/:id", deleteMissingReport); // DELETE /missing-reports/:id - Delete missing report

module.exports = router;