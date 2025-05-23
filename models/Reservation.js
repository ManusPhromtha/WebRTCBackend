const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  reserveDate: { type: Date, required: true },
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  restaurant: { type: mongoose.Schema.ObjectId, ref: "Restaurant", required: true },
  personCount: { type: Number, required: true },
  approvalStatus: {
    type: String,
    enum: ["pending", "canceled", "approved", "rejected"],
    default: "pending",
  },
  paymentStatus: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reservation", ReservationSchema);
