

/* Theme Loader */
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}
else {
    document.body.classList.remove("light");
}

window.addEventListener("storage", (event) => {
    if (event.newValue === "light") {
        document.body.classList.add("light");
    }
    else {
        document.body.classList.remove("light");
    }
});
/* --- */

/* Iframe Check */
if (window.self === window.top) {
    document.documentElement.classList.add("not-iframe");
}
/* --- */

const terminalInput = document.getElementById("terminal-input")

async function SendCommand() {
    await fetch(`/send_command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:  JSON.stringify({command: terminalInput.value}),
    });
    terminalInput.value = "";
}