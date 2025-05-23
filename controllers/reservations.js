const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const { sendRestaurantNotFound } = require("./restaurants");

exports.getReservations = async (req, res, next) => {
  try {
    if (req.params.restaurantID) {
      getRestaurantReservations(req, res, next);
    } else {
      const reservations = await Reservation.find({ user: req.user.id }).populate({
        path: "restaurant",
        select: "name phone",
      });
      res.status(200).json({ success: true, count: reservations.length, data: reservations });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Cannot find Reservation" });
    console.error(err);
  }
};

async function getRestaurantReservations(req, res, next) {
  const restaurant = await Restaurant.findById(req.params.restaurantID);
  if (restaurant) {
    let queryOptions = { restaurant: req.params.restaurantID };
    if (!checkRestaurantAdmin(req.user, req.params.restaurantID)) {
      queryOptions.user = req.user.id;
    }
    const reservations = await Reservation.find(queryOptions);
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: { restaurant, reservations },
    });
  } else {
    sendRestaurantNotFound(req.params.restaurantID, res);
  }
}

exports.getReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate({
      path: "restaurant",
      select: "name phone",
    });

    if (reservation) {
      if (checkReservationPermission(reservation, req, res, "see")) {
        res.status(200).json({ success: true, data: reservation });
      }
    } else {
      sendReservationNotFound(req, res);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Cannot find Reservation" });
    console.error(err);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const restaurantID = req.body.restaurant || req.params.restaurantID;
    // TODO: change bussiness logic here
    const existedAppointments = await Reservation.countDocuments({
      user: req.user.id,
      reserveDate: { $gt: new Date() },
    });
    if (existedAppointments >= 3 && !req.user.restaurantOwner.includes(restaurantID)) {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 appointments`,
      });
    }
    const restaurant = await Restaurant.findById(restaurantID);
    if (restaurant) {
      req.body.user = req.user.id;
      req.body.restaurant = restaurantID;
      const appointment = await Reservation.create(req.body);
      res.status(200).json({ success: true, data: appointment });
    } else {
      sendRestaurantNotFound(restaurantID, res);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Cannot create Reservation" });
    console.error(err);
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    let reservation = await Reservation.findById(req.params.id);
    if (reservation) {
      if (checkReservationPermission(reservation, req, res, "update")) {
        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });
        res.status(200).json({ success: true, data: reservation });
      }
    } else {
      sendReservationNotFound(req, res);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Cannot update Reservation" });
    console.error(err);
  }
};

exports.deleteReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (reservation) {
      if (checkReservationPermission(reservation, req, res, "delete")) {
        await reservation.deleteOne();
        res.status(200).json({ success: true, data: {} });
      }
    } else {
      sendReservationNotFound(req, res);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Cannot delete Reservation" });
    console.error(err);
  }
};

function checkReservationPermission(reservation, req, res, action) {
  if (
    reservation.user.toString() === req.user.id ||
    checkRestaurantAdmin(req.user, reservation.restaurant)
  ) {
    return true;
  }
  res.status(403).json({
    success: false,
    message: `User ${req.user.id} is not authorized to ${action} this Reservation`,
  });
  return false;
}

function checkRestaurantAdmin(user, restaurantID) {
  return user.restaurantAdmin.includes(restaurantID) || user.restaurantOwner.includes(restaurantID);
}

function sendReservationNotFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Not found Reservation with id of ${req.params.id}`,
  });
  console.log(`Not found Reservation with id:${req.params.id}`);
}
