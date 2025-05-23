const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    const token = req.headers.authorization.split(" ")[1];
    if (token && token != "null") {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        if (req.user) {
          return next();
        } else {
          return res.status(400).json({ success: false, message: "User does not exist" });
        }
      } catch (err) {
        console.log(err.stack);
      }
    }
  }
  res.status(401).json({
    success: false,
    message: "Not authorize to access this route",
  });
};

// exports.authorize = (...roles) => {
//   return (req, res, next) => {
//     if (roles.includes(req.user.role)) {
//       return next();
//     }
//     res.status(403).json({
//       success: false,
//       message: `User role ${req.user.role} is not authorize to access this route`,
//     });
//   };
// };
