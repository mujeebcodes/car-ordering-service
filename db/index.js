const mongoose = require("mongoose");
require("dotenv").config();

const connect = async (url) => {
  mongoose.connect(url || process.env.MONGO_URL);
  mongoose.connection.on("connected", () => {
    console.log("Connected to db successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.log("An error occured while connecting to db");
    console.log(err);
  });
};

module.exports = { connect };
