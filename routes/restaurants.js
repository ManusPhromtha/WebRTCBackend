const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getRestaurants,
  createRestaurant,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantAdmin,
} = require("../controllers/restaurants");

const router = express.Router();
router.route("/").get(getRestaurants).post(protect, createRestaurant);
router
  .route("/:id")
  .get(getRestaurant)
  .put(protect, updateRestaurant)
  .delete(protect, deleteRestaurant);
router.route("/:restaurantID/admin/:id").put(protect, updateRestaurantAdmin);
router.use("/:restaurantID/reservations", require("./reservations"));

module.exports = router;
