const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: "./config/config.env" });
require("./config/db").connect();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/restaurants", require("./routes/restaurants"));
app.use("/api/v1/reservations", require("./routes/reservations"));
app.use("/api/v1/dashboard", require("./routes/dashboard"));

const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode, on port ${PORT}`)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(err);
  server.close(() => process.exit(1));
});
