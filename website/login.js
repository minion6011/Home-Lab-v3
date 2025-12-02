const username = document.getElementById("username")
const password = document.getElementById("password")
const status_msg = document.getElementById("status")

async function loginAttempt() {
  let req = await fetch(`/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({username: username.value, password: password.value}),
  });
  
  if (req.status == 200) {
    location.reload();
  }
  else {
    if (status_msg.classList.contains("animate")) {
      status_msg.classList.remove("animate");
      void status_msg.offsetWidth;
    }
    status_msg.innerText = "Login failed"
    status_msg.classList.add("animate");
  }
}