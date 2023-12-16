const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  in_ride: { type: Boolean, default: false },
  orders: [],
});

const DriverModel = mongoose.model("Driver", driverSchema);
module.exports = DriverModel;
