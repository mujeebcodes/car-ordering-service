const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const CustomerModel = mongoose.model("Customer", customerSchema);
module.exports = CustomerModel;
