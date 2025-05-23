const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Reservation = require("../models/Reservation");

exports.getRestaurants = async (req, res, next) => {
  try {
    let query = Restaurant.find(),
      reqQuery = { ...req.query };
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);
    reqQuery = JSON.parse(
      JSON.stringify(reqQuery).replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)
    );

    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }
    if (req.query.sort) {
      const fields = req.query.sort.split(",").join(" ");
      query = query.sort(fields);
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const totalIndex = await Restaurant.countDocuments();
    query = query.skip(startIndex).limit(limit);

    const pagination = {};
    if (endIndex < totalIndex) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    const restaurants = await query;
    res.status(200).json({
      success: true,
      count: restaurants.length,
      pagination,
      data: restaurants,
    });
  } catch (err) {
    res.status(200).json({ success: false });
    console.error(err);
  }
};

exports.createRestaurant = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    const restaurant = await Restaurant.create(req.body);
    if (restaurant) {
      await req.user.updateOne({ $addToSet: { restaurantOwner: restaurant.id } });
      res.status(201).json({ success: true, data: restaurant });
    } else {
      res.status(500).json({ success: false });
      console.log("Restaurant creation failed");
    }
  } catch (err) {
    res.status(400).json({ success: false });
    console.error(err);
  }
};

exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate({
      path: "owner",
      select: "name email",
    });
    if (restaurant) {
      res.status(200).json({ success: true, data: restaurant });
    } else {
      sendRestaurantNotFound(req.params.id, res);
    }
  } catch (err) {
    res.status(500).json({ success: false });
    console.error(err);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    if (this.isRestaurantOwner(req.user, req.params.id, res)) {
      const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (restaurant) {
        res.status(200).json({ success: true, data: restaurant });
      } else {
        sendRestaurantNotFound(req.params.id, res);
      }
    }
  } catch (err) {
    res.status(500).json({ success: false });
    console.error(err);
  }
};

exports.deleteRestaurant = async (req, res, next) => {
  try {
    if (this.isRestaurantOwner(req.user, req.params.id, res)) {
      const restaurant = await Restaurant.findById(req.params.id);
      if (restaurant) {
        await req.user.updateOne({ $pull: { restaurantOwner: req.params.id } });
        await User.updateMany({ $pull: { restaurantAdmin: req.params.id } });
        await restaurant.deleteOne();
        await Reservation.deleteMany({ restaurant: req.params.id });
        res.status(200).json({ success: true, data: {} });
      } else {
        sendRestaurantNotFound(req.params.id, res);
      }
    }
  } catch (err) {
    res.status(500).json({ success: false });
    console.error(err);
  }
};

exports.sendRestaurantNotFound = (restaurantID, res) => {
  res.status(404).json({
    success: false,
    message: `Not found Restaurant with id of ${restaurantID}`,
  });
  console.log(`Not found Restaurant with id:${restaurantID}`);
};

exports.isRestaurantOwner = (user, restaurantID, res) => {
  if (!user.restaurantOwner.includes(restaurantID)) {
    res.status(403).json({ success: false, message: "You are not this restaurant owner" });
    return false;
  }
  return true;
};

exports.updateRestaurantAdmin = async (req, res, next) => {
  try {
    const option = ["add", "remove"];
    if (!req.query.option && !option.includes(req.query.option)) {
      return res
        .status(400)
        .json({ success: false, message: "Specify a query valid option(add, remove)" });
    }
    const admin = await User.findById(req.params.id);
    if (admin) {
      if (this.isRestaurantOwner(req.user, req.params.restaurantID, res)) {
        const restaurant = await Restaurant.findByIdAndUpdate(
          req.params.restaurantID,
          req.query.option == "add"
            ? { $addToSet: { admin: req.params.id } }
            : { $pull: { admin: req.params.id } },
          { new: true, runValidators: true }
        );
        if (restaurant) {
          await admin.updateOne(
            req.query.option == "add"
              ? { $addToSet: { restaurantAdmin: req.params.restaurantID } }
              : { $pull: { restaurantAdmin: req.params.restaurantID } }
          );
          res.status(200).json({ success: true, data: restaurant });
        } else {
          sendRestaurantNotFound(req.params.id, res);
        }
      }
    } else {
      res.status(400).json({ success: false, message: "User does not exist" });
    }
  } catch (err) {
    res.status(500).json({ success: false });
    console.error(err);
  }
};
