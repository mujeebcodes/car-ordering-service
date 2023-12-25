document.addEventListener("DOMContentLoaded", async () => {
  const notifContainer = document.querySelector("#notification-container");
  const historyBtn = document.querySelector(".historyBtn");
  const logoutBtn = document.querySelector(".logoutBtn");
  const requestBtn = document.getElementById("request-btn");
  let requestDiv;
  let customerDataResponse;
  try {
    const response = await axios.get("/customer");

    if (response.status === 401) {
      // Redirect to the login page
      window.location.href = "/login";
    } else {
      try {
        customerDataResponse = await axios.get("/customerData");
        console.log(customerDataResponse.data.data);
        const { name, email } = customerDataResponse.data.data;
        document.querySelector(".user-greet").textContent = `Welcome, ${name}`;
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }

  historyBtn.addEventListener("click", () => {
    const userEmail = customerDataResponse.data.data.email;
    window.location.href = `/history?userEmail=${userEmail}`;
  });
  logoutBtn.addEventListener("click", () => {
    axios.get("/logout");
    window.location.href = "/login";
  });
  const { name } = customerDataResponse.data.data;
  const socket = io("http://localhost:3000", {
    query: {
      user_type: "customer",
      name: customerDataResponse.data.data.name,
      email: customerDataResponse.data.data.email,
    },
  });

  socket.on("connect", () => {
    console.log("Connected to socket as a customer:", socket.id);
  });

  socket.on("noDriver", ({ message }) => {
    console.log("Received 'noDriver' event:", message);
    requestBtn.disabled = false;

    if (requestDiv) {
      requestDiv.innerHTML = `<div class="card" style="width: 100%"><div class="card-body"<h5 class="card-title"><strong>${message}</strong></h5></div></div>`;
    }
    setTimeout(() => {
      notifContainer.innerHTML = "";
      requestBtn.disabled = false;
    }, 3000);
  });

  socket.on("rideAccepted", ({ order, driver }) => {
    console.log(order, driver);
    const { destination, location, price } = order;

    requestDiv.innerHTML = `<div class="card" style="width: 100%"><div class="card-body"<h5 class="card-title"><strong>Good News, ${name}. Driver ${driver.name}  has accepted your ride request and should be here soon!</strong></h5><div><p>Your ride details: </p> <p>Location: ${location}</p><p>Destination: ${destination}</p><p>Price: ${price}</p></div></div></div>`;
  });
  socket.on("rideEnded", ({ message }) => {
    console.log("ride ended", message);

    if (requestDiv) {
      requestDiv.innerHTML = `<div class="card" style="width: 100%"><div class="card-body"<h5 class="card-title"><strong>${message}</strong></h5></div></div>`;
    }
    setTimeout(() => {
      notifContainer.innerHTML = "";
      requestBtn.disabled = false;
    }, 3000);
  });
  document
    .getElementById("request-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      requestBtn.disabled = true;
      const location = document.getElementById("location").value;
      const destination = document.getElementById("destination").value;
      const price = document.getElementById("price").value;
      requestDiv = document.createElement("div");
      requestDiv.innerHTML = `<div class="card" style="width: 100%"><div class="card-body"<h5 class="card-title"><strong>Looking for a driver for you, ${name}</strong></h5><div><p>Your ride details: </p> <p>Location: ${location}</p><p>Destination: ${destination}</p><p>Price: ${price}</p></div></div></div>`;
      notifContainer.appendChild(requestDiv);
      // Emit the ride request to drivers only
      socket.emit("rideRequested", {
        location,
        destination,
        price,
        email: customerDataResponse.data.data.email,
      });
    });
});
