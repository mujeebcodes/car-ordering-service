const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const jwt = require("jsonwebtoken");

const server = http.createServer(app);
const io = socketIO(server);

const auth = (req, res, next) => {};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
});

app.get("/driver", (req, res) => {
  res.sendFile(__dirname + "/public/driver.html");
});
app.get("/customer", (req, res) => {
  res.sendFile(__dirname + "/public/customer.html");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
