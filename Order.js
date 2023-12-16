const { v4: uuidv4 } = require("uuid");

class Order {
  constructor(location, destination, price, customer) {
    this.location = location;
    this.destination = destination;
    this.price = price;
    this.id = uuidv4();
    this.status = "pending";
    this.customer = customer;
    this.driver = null;
  }

  assignDriver(driver) {
    console.log(`Order assigned to ${driver.name}`);
    this.driver = driver;
  }
}

module.exports = Order;
