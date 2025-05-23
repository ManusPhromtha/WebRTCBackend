const mongoose = require("mongoose");
const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    unique: true,
    trim: true,
    maxlength: [50, "Restaurant name can not be more than 50 characters"],
  },
  address: { type: String, required: [true, "Please add an address"] },
  district: { type: String, required: [true, "Please add a district"] },
  province: { type: String, required: [true, "Please add a province"] },
  postalcode: {
    type: String,
    required: [true, "Please add a postalcode"],
    maxlength: [5, "Postal Code can not be more than 5 digits"],
  },
  phone: { type: String },
  region: { type: String, required: [true, "Please add a region"] },
  createdAt: { type: Date, default: Date.now },
  // User 1-n Restaurant
  owner: { type: mongoose.Schema.ObjectId, ref: "User" },
  // User n-n Restaurant
  admin: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Restaurant", RestaurantSchema);
