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

app.get("/logout", (req, res) => {
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
    return res.status(401).json({ success: false, msg: "Token is not valid" });
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
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
