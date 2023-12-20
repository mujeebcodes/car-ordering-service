document.addEventListener("DOMContentLoaded", async () => {
  let driverDataResponse;
  const notifContainer = document.querySelector("#notification-container");
  const acceptBtn = document.querySelector(".acceptBtn");
  let currentOrder;
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
    currentOrder = order;
    // Display the received order in the notification container
    requestDiv = document.createElement("div");
    requestDiv.innerHTML = `<div class="card" style="width: 100%"><div class="card-body"<h5 class="card-title"><strong>Ride Requested by ${order.customer.name}</strong></h5><div> <p>Location: ${order.location}</p><p>Destination: ${order.destination}</p><p>Price: ${order.price}</p></div><div class="btn-group">
<button class="btn btn-primary btn-sm acceptBtn">Accept</button>
<button class="btn btn-primary btn-sm rejectBtn">Reject</button>
</div></div></div>`;
    notifContainer.appendChild(requestDiv);
  });
});
