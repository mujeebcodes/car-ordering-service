document.addEventListener("DOMContentLoaded", async () => {
  const notifContainer = document.querySelector("#notification-container");
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

  const logoutBtn = document.querySelector(".logoutBtn");
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

  document
    .getElementById("request-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

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
