const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
require("dotenv").config();
const db = require("./db");
const http = require("http");
const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const Customer = require("./Customer");
const Driver = require("./Driver");
const CustomerModel = require("./models/customer");
const DriverModel = require("./models/driver");
const AppService = require("./AppService");
const OrderModel = require("./models/order");

const server = http.createServer(app);
const io = socketio(server);

db.connect();

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.get(["/", "/login"], (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.post("/login", async (req, res) => {
  const emailFromForm = req.body.email;
  const existingCustomer = await CustomerModel.findOne({
    email: emailFromForm,
  });
  const existingDriver = await DriverModel.findOne({ email: emailFromForm });

  if (!existingCustomer && !existingDriver) {
    console.log("User not found. Redirecting to signup.");
    return res.status(200).json({ success: false, redirectToSignup: true });
  }
  const token = await jwt.sign(
    {
      email: emailFromForm,
      name: existingCustomer ? existingCustomer.name : existingDriver.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("jwt", token, { httpOnly: true });

  if (existingDriver) {
    console.log("redirecting to driver dashboard");
    return res.status(200).json({ token, redirectToDriver: true });
  }
  if (existingCustomer) {
    console.log("redirecting to customer dashboard");
    return res.status(200).json({ token, redirectToCustomer: true });
  }
});
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
});

app.post("/signup", async (req, res) => {
  const { email, name, user_type } = req.body;
  console.log("Signup route:", user_type, email);
  try {
    const isExistingCustomer = await CustomerModel.findOne({ email });
    const isExistingDriver = await DriverModel.findOne({ email });

    if (isExistingCustomer || isExistingDriver) {
      console.log("User already exists. Redirecting to login.");
      return res.status(200).json({ success: false, redirectToLogin: true });
    }
    if (user_type === "customer") {
      const newCustomer = new Customer(name, email);
      console.log(newCustomer);
      await CustomerModel.create({
        _id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
      });
    }
    if (user_type === "driver") {
      const newDriver = new Driver(name, email);
      console.log(newDriver);
      await DriverModel.create({
        _id: newDriver.id,
        name: newDriver.name,
        email: newDriver.email,
        in_ride: newDriver.in_ride,
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {}
});

app.get("/history", (req, res) => {
  res.sendFile(__dirname + "/public/userHistory.html");
});

app.get("/historyData", async (req, res) => {
  const token = req.cookies.jwt;
  const userEmail = req.query.email;

  if (!token) {
    return res.redirect("/login");
  }

  const customer = await CustomerModel.findOne({ email: userEmail });
  const driver = await DriverModel.findOne({ email: userEmail });

  if (!customer && !driver) {
    return res.status(404).json({ success: false, message: "Invalid user" });
  }

  let orders;

  if (customer) {
    orders = await OrderModel.find({ customer: customer._id });

    if (orders) {
      for (const order of orders) {
        try {
          const driver = await DriverModel.findById(order.driver);

          if (driver) {
            console.log("found driver");
            order.driver = driver.name;
          }
        } catch (error) {
          console.error("Error fetching driver:", error);
        }
      }
    }
    return res
      .status(200)
      .json({ success: true, user_type: "customer", data: orders });
  } else {
    orders = await OrderModel.find({ driver: driver._id });

    if (orders) {
      for (const order of orders) {
        try {
          const customer = await CustomerModel.findById(order.customer);

          if (customer) {
            order.customer = customer.name;
          }
        } catch (error) {
          console.error("Error fetching customer:", error);
        }
      }
    }
    return res
      .status(200)
      .json({ success: true, user_type: "driver", data: orders });
  }
});

app.get("/logout", (req, res) => {
  console.log("signing out user");
  res.cookie("jwt", "", { expires: new Date(0), httpOnly: true });

  // Redirect or send a response as needed
  res.redirect("/login"); //
});

app.get("/driver", (req, res) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decodedToken = decoded;
    console.log(decoded);
    res.sendFile(__dirname + "/public/driver.html");
  } catch (error) {
    return res.redirect("/login");
  }
});
app.get("/customer", (req, res) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decodedToken = decoded;
    console.log(decoded);
    res.sendFile(__dirname + "/public/customer.html");
  } catch (error) {
    return res.redirect("/login");
  }
});

app.get("/customerData", async (req, res) => {
  const token = req.cookies.jwt;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decodedToken = decoded;
    return res.status(200).json({ data: decoded });
  } catch (error) {
    console.log(error);
  }
});
app.get("/driverData", (req, res) => {
  const token = req.cookies.jwt;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decodedToken = decoded;
    return res.status(200).json({ data: decoded });
  } catch (error) {
    console.log(error);
  }
});

// socket io

const appService = new AppService();
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  appService.joinSession(socket);

  socket.on("rideRequested", (order) => {
    console.log("Requesting order", order);
    appService.requestOrder(order);
  });
  socket.on("rideAccepted", (data) => {
    const { order, driverEmail } = data;
    console.log("Accepting order", data);
    appService.acceptOrder(order, driverEmail);
  });

  socket.on("rideCompleted", (data) => {
    const { order, email } = data;
    appService.endRide(order, email);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
