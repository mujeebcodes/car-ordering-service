const { v4: uuidv4 } = require("uuid");
class Customer {
  constructor(name, email) {
    this.id = uuidv4();
    this.name = name;
    this.email = email;
  }
  requestRide(order) {}
}

module.exports = Customer;
