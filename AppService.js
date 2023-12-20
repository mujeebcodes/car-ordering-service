const Driver = require("./Driver");
const Customer = require("./Customer");
const Order = require("./Order");
const CustomerModel = require("./models/customer");
const DriverModel = require("./models/driver");

class AppService {
  constructor() {
    this.orders = [];
    this.drivers = [];
    this.customers = [];
    this.socketUserMap = new Map();
  }
  async joinSession(socket) {
    const { user_type, email } = socket.handshake.query;

    switch (user_type) {
      case "driver":
        const driver = await DriverModel.findOne({ email });
        this.drivers.push(driver);
        this.assignSocket({ socket, user: driver });
        break;
      case "customer":
        const customer = await CustomerModel.findOne({ email });
        this.customers.push(customer);
        this.assignSocket({ socket, user: customer });
        break;
      default:
        console.log("Invalid user type");
    }
  }

  assignSocket({ socket, user }) {
    // console.log(user);
    console.log("Assigning socket to user", user.name);
    this.socketUserMap.set(user._id, socket);
  }

  sendEvent({ socket, data, eventname }) {
    socket.emit(eventname, data);
  }

  requestOrder({ location, destination, price, email }) {
    // const { name, location, destination, price } = data;
    // const newOrder = new Order(location, destination, price, name);
    // console.log(`Customer ${name} is requesting a ride`);
    // return newOrder;
    const customer = this.customers.find(
      (customer) => customer.email === email
    );

    const order = new Order(location, destination, price, customer);

    // this.orders.push(order);

    // for (const driver of this.drivers) {
    //   if (driver.in_ride) continue;
    //   this.sendEvent({
    //     socket: this.socketUserMap.get(driver.id),
    //     data: order,
    //     eventname: "orderRequested",
    //   });
    // }
    const availableDrivers = this.drivers.filter((driver) => !driver.in_ride);
    console.log(availableDrivers);

    if (availableDrivers.length === 0) {
      // Emit the "noDriver" event to the customer
      const customerSocket = this.socketUserMap.get(customer._id);
      this.sendEvent({
        socket: customerSocket,
        data: { message: "No available drivers at the moment" },
        eventname: "noDriver",
      });

      console.log("No available drivers for the order");
      return null;
    }

    // Notify each available driver about the order
    for (const driver of availableDrivers) {
      const driverSocket = this.socketUserMap.get(driver._id);

      // Emit the "rideRequested" event to the specific driver
      this.sendEvent({
        socket: driverSocket,
        data: order,
        eventname: "rideRequestData",
      });
    }

    // Update the order and driver information
    this.orders.push(order);
    console.log("Order requested", order);
    return order;
  }

  acceptOrder(order, driverName) {
    const { id, customer } = order;
    // get all info about order
    const driver = this.drivers.find((driver) => driver.name === driverName);
    const _order = this.orders.find((order) => order.id === id);
    const _customer = this.customers.find(
      (customer) => customer.id === _order.customer.id
    );

    console.log("Accepting order", { _order, driver, _customer });

    _order.assignDriver(driver);
    driver.in_ride = true;

    const userSocket = this.socketUserMap.get(_customer.id);
    userSocket.emit("rideAcceptedData", _order);

    const driverSocket = this.socketUserMap.get(driver.id);
    driverSocket.emit("rideAccepted", _order);

    console.log(_order);
  }
}

module.exports = AppService;
