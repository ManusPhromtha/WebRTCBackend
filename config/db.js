const mongoose = require("mongoose");

exports.connect = async () => {
  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(process.env.MONGO_URI);

  console.log(`MongoDB Connected: ${connection.connection.host}`);
};
