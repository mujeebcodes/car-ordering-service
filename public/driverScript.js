document.addEventListener("DOMContentLoaded", async () => {
  let driverDataResponse;
  const notifContainer = document.querySelector("#notification-container");
  let currentOrders = [];
  let requestDiv;
  try {
    const response = await axios.get("/driver");

    if (response.status === 401) {
      console.log(data.msg); // Log the error message
      // Redirect to the login page
      window.location.href = "/login";
    } else {
      try {
        driverDataResponse = await axios.get("/driverData");
        console.log(driverDataResponse.data.data);
        const { name, email } = driverDataResponse.data.data;
        document.querySelector(
          ".driver-greet"
        ).textContent = `Welcome, ${name}`;
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }

  const logoutBtn = document.querySelector(".logoutBtn");
  logoutBtn.addEventListener("click", () => {
    axios.get("/logout");
    window.location.href = "/login";
  });

  const socket = io("http://localhost:3000", {
    query: {
      user_type: "driver",
      name: driverDataResponse.data.data.name,
      email: driverDataResponse.data.data.email,
    },
  });

  socket.on("rideRequestData", (order) => {
    console.log(order);
    currentOrders.push(order);
    // Display the received order in the notification container
    updateNotifContainer();
  });

  socket.on("rideRequestTimeout", (data) => {
    const { order_id } = data;
    const indexToRemove = currentOrders.findIndex(
      (order) => order.id === order_id
    );
    if (indexToRemove !== -1) {
      currentOrders.splice(indexToRemove, 1);
      console.log("Order removed due to timeout");

      // Display the updated orders in the notification container
      updateNotifContainer();
    }
  });
  const updateNotifContainer = () => {
    notifContainer.innerHTML = "";
    currentOrders.forEach((order) => {
      requestDiv = document.createElement("div");
      requestDiv.innerHTML = `<div class="card" style="width: 100%"><div class="card-body"<h5 class="card-title"><strong>Ride Requested by ${order.customer.name}</strong></h5><div> <p>Location: ${order.location}</p><p>Destination: ${order.destination}</p><p>Price: ${order.price}</p></div><div class="btn-group">
<button class="btn btn-primary btn-sm acceptBtn">Accept</button>
<button class="btn btn-primary btn-sm rejectBtn">Reject</button>
</div></div></div>`;
      notifContainer.appendChild(requestDiv);

      const acceptBtn = requestDiv.querySelector(".acceptBtn");
      acceptBtn.addEventListener("click", (e) => {
        const { email } = driverDataResponse.data.data;
        // Your accept button logic here
        console.log("accepted ride");
        e.target.disabled = true;
        e.target.textContent = "Accepted";
        currentOrders = [order];
        const acceptedDiv = document.createElement("div");
        acceptedDiv.innerHTML = `<div class="card" style="width: 100%"><div class="card-body"<h5 class="card-title"><strong> Driving ${order.customer.name} to ${order.location} </strong></h5><div class="btn-group">
<button class="btn btn-primary btn-sm finishBtn">End Trip</button>
</div></div></div>`;
        notifContainer.innerHTML = "";
        notifContainer.appendChild(acceptedDiv);
        socket.emit("rideAccepted", { order, driverEmail: email });

        const finishBtn = acceptedDiv.querySelector(".finishBtn");
        if (finishBtn) {
          finishBtn.addEventListener("click", () => {
            // Your "Finish Trip" button logic here
            console.log("Trip finished");
            // Add any logic to handle finishing the trip
            notifContainer.innerHTML = "";
            socket.emit("rideCompleted", { order, email });
          });
        }
      });

      const rejectBtn = requestDiv.querySelector(".rejectBtn");
      rejectBtn.addEventListener("click", (e) => {
        // Your reject button logic here
        currentOrders = currentOrders.filter((order) => order.id !== order.id);
        updateNotifContainer();
        socket.emit("rejectOrder", { order_id: order.id });
      });
    });
  };
});
