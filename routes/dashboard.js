const express = require("express");
const { protect } = require("../middleware/auth");
const { getUserDashboard, getRestaurantDashboard } = require("../controllers/dashboard");

const router = express.Router();
router.route("/user").get(protect, getUserDashboard);
router.route("/restaurant/:id").get(protect, getRestaurantDashboard);

module.exports = router;
