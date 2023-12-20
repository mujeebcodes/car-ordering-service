const loginForm = document.querySelector(".login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const loginEmail = e.target[0].value;
  try {
    const response = await axios.post(
      "/login",
      { email: loginEmail },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Server response:", response.data);

    if (response.data.redirectToSignup) {
      window.location.href = "/signup";
      return;
    }

    if (response.data.redirectToDriver) {
      // Redirect to driver page
      window.location.href = "/driver";
      return;
    }
    if (response.data.redirectToCustomer) {
      // Redirect to customer page
      window.location.href = "/customer";
      return;
    }
  } catch (error) {
    console.log(error);
  }
});
