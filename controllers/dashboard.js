const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation");
const { isRestaurantOwner, sendRestaurantNotFound } = require("../controllers/restaurants");

exports.getUserDashboard = async (req, res, next) => {
  try {
    const [approvalStatus, topRestaurant] = await Promise.all([
      getApprovalStatus(req.user.id),
      getUserTopRestaurant(req.user.id, 3),
    ]);
    res.status(200).json({
      success: true,
      data: { approvalStatus, topRestaurant },
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

exports.getRestaurantDashboard = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (restaurant) {
      if (isRestaurantOwner(req.user, req.params.id, res)) {
        const [approvalStatus, frequency] = await Promise.all([
          getApprovalStatus(undefined, req.params.id),
          getFrequency(req.params.id),
        ]);
        res.status(200).json({ success: true, data: { approvalStatus, frequency } });
      }
    } else {
      sendRestaurantNotFound(req.params.id, res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

async function getUserTopRestaurant(userID, limit) {
  try {
    const mostReservedRestaurant = await Reservation.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId.createFromHexString(userID),
          reserveDate: { $lt: new Date() },
        },
      },
      { $sortByCount: "$restaurant" },
      { $limit: limit },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ["$restaurant", 0] }, { count: "$count" }],
          },
        },
      },
    ]);
    return mostReservedRestaurant;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getApprovalStatus(userID, restaurantID) {
  try {
    const matchQuery = { reserveDate: { $lt: new Date() } };
    if (userID) {
      matchQuery.user = mongoose.Types.ObjectId.createFromHexString(userID);
    }
    if (restaurantID) {
      matchQuery.restaurant = mongoose.Types.ObjectId.createFromHexString(restaurantID);
    }
    const statCount = await Reservation.aggregate([
      {
        $match: matchQuery,
      },
      { $group: { _id: "$approvalStatus", count: { $count: {} } } },
      {
        $group: {
          _id: null,
          items: { $push: { k: "$_id", v: "$count" } },
          total: { $sum: "$count" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayToObject: "$items" }, { total: "$total" }],
          },
        },
      },
    ]);
    return statCount[0];
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getFrequency(restaurantID) {
  try {
    const matchQuery = {
      reserveDate: { $lt: new Date() },
      restaurant: mongoose.Types.ObjectId.createFromHexString(restaurantID),
    };
    const frequency = await Reservation.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateFromParts: {
              year: 1,
              hour: { $hour: "$reserveDate" },
              minute: {
                $subtract: [
                  { $minute: "$reserveDate" },
                  { $mod: [{ $minute: "$reserveDate" }, 30] },
                ],
              },
            },
          },
          count: { $count: {} },
        },
      },
      {
        $densify: {
          field: "_id",
          range: {
            step: 30,
            unit: "minute",
            bounds: [new Date("0001-01-01T00:00:00.000Z"), new Date("0001-01-02T00:00:00.000Z")],
          },
        },
      },
      {
        $group: {
          _id: null,
          items: {
            $push: {
              k: { $dateToString: { date: "$_id", format: "%H:%M" } },
              v: { $ifNull: ["$count", "$count", 0] },
            },
          },
        },
      },
      { $replaceRoot: { newRoot: { $arrayToObject: "$items" } } },
    ]);
    return frequency[0];
  } catch (err) {
    console.error(err);
    return null;
  }
}
