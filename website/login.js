/* --- Variables --- */
const domEl = {
    username: document.getElementById("username"),
    password: document.getElementById("password"),
    
    status_msg: document.getElementById("status"),
}
const endpoints = {
    login: "/login"
}

/* --- Functions --- */
async function loginAttempt() {
	let req = await fetch(endpoints.login, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({username: domEl.username.value, password: domEl.password.value}),
	});
	
	if (req.status == 200) {
		location.reload();
	}
	else {
		if (domEl.status_msg.classList.contains("animate")) {
			domEl.status_msg.classList.remove("animate");
			void domEl.status_msg.offsetWidth;
		}
		domEl.status_msg.innerText = "Login failed"
		domEl.status_msg.classList.add("animate");
	}
}