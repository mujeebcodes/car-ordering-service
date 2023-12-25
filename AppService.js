const Driver = require("./Driver");
const Customer = require("./Customer");
const Order = require("./Order");
const CustomerModel = require("./models/customer");
const DriverModel = require("./models/driver");
const OrderModel = require("./models/order");
let timeoutId;

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
    const customer = this.customers.find(
      (customer) => customer.email === email
    );

    const order = new Order(location, destination, price, customer);

    const availableDrivers = this.drivers.filter((driver) => !driver.in_ride);

    if (availableDrivers.length === 0) {
      // Emit the "noDriver" event to the customer
      const customerSocket = this.socketUserMap.get(customer._id);
      this.sendEvent({
        socket: customerSocket,
        data: {
          message: "No available drivers at the moment. Please try again later",
        },
        eventname: "noDriver",
      });

      console.log("No available drivers for the order");
      return null;
    }

    // Set a timeout for 1 minute (60,000 milliseconds)
    timeoutId = setTimeout(() => {
      // Remove the order if it hasn't been accepted within the timeout
      const index = this.orders.indexOf(order);
      if (index !== -1) {
        this.orders.splice(index, 1);
        console.log("Order removed due to timeout:", order);

        // Notify the customer that no driver was found within the timeout
        const customerSocket = this.socketUserMap.get(customer._id);
        this.sendEvent({
          socket: customerSocket,
          data: {
            message: "No driver accepted the ride request within the timeout",
          },
          eventname: "noDriver",
        });
        const availableDriverSockets = availableDrivers.map((driver) =>
          this.socketUserMap.get(driver._id)
        );
        availableDriverSockets.forEach((driverSocket) => {
          this.sendEvent({
            socket: driverSocket,
            data: { message: "Ride request timeout", order_id: order.id },
            eventname: "rideRequestTimeout",
          });
        });
      }
    }, 60000); // 1 minute timeout

    // Notify each available driver about the order
    for (const driver of availableDrivers) {
      const driverSocket = this.socketUserMap.get(driver._id);

      // Emit the "rideRequestData" event to the specific driver with a timeout
      this.sendEvent({
        socket: driverSocket,
        data: order,
        eventname: "rideRequestData",
        callback: (err, response) => {
          clearTimeout(timeoutId); // Clear the timeout when the driver acknowledges
          if (err) {
            // The driver did not acknowledge the event
            console.log(
              `Driver ${driver.name} did not acknowledge the ride request`
            );
          } else {
            // The driver acknowledged the event
            console.log(
              `Driver ${driver.name} accepted the ride request:`,
              response
            );
          }
        },
      });
    }

    // Update the order and driver information
    this.orders.push(order);
    console.log("Order requested", order);
    return order;
  }

  acceptOrder(order, driverEmail) {
    // console.log("from accept", order, driverEmail);
    clearTimeout(timeoutId);
    const driver = this.drivers.filter(
      (driver) => driver.email === driverEmail
    )[0];
    driver.in_ride = true;
    order.driver_id = driver._id;
    // console.log(this.drivers, this.orders);
    const customerSocket = this.socketUserMap.get(order.customer._id);
    this.sendEvent({
      socket: customerSocket,
      data: {
        order,
        driver,
      },
      eventname: "rideAccepted",
    });
  }

  async endRide(order, email) {
    const driver = this.drivers.filter((driver) => driver.email === email)[0];
    driver.in_ride = false;
    order.driver_id = driver._id;
    order.status = "completed";
    const { _id, location, destination, price, status, driver_id } = order;
    console.log(driver);
    console.log(order);
    await OrderModel.create({
      _id,
      location,
      destination,
      price,
      status,
      customer: order.customer._id,
      driver: driver_id,
    });
    const customerSocket = this.socketUserMap.get(order.customer._id);
    this.sendEvent({
      socket: customerSocket,
      data: {
        message:
          "Thanks for riding with us. Feel free to check this ride's details in your order history",
      },
      eventname: "rideEnded",
    });
  }
}

module.exports = AppService;
