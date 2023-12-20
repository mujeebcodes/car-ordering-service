const signupForm = document.querySelector("form");
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    email: e.target[0].value,
    name: e.target[1].value,
    user_type: e.target[2].value,
  };

  try {
    const response = await axios.post("/signup", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.success || response.data.redirectToLogin) {
      window.location.href = "/login";
      return;
    }
  } catch (error) {
    console.log(error);
  }
});
