const express = require("express");
const { protect } = require("../middleware/auth");
const { register, login, getMe, logout } = require("../controllers/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
