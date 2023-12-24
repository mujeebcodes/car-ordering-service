const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  location: { type: String, required: true },
  destination: { type: String, required: true, unique: true },
  price: { type: String, required: true },
  status: { type: String, required: true },
  customer_id: { type: String, required: true },
  driver_id: { type: String, required: true },
});

const OrderModel = mongoose.model("Order", orderSchema);
module.exports = OrderModel;
