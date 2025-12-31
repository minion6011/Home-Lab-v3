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
    else if (event.newValue === "dark"){
        document.body.classList.remove("light");
    }
});
/* Iframe Check */
if (window.self === window.top) {
    document.documentElement.classList.add("not-iframe");
}
// Logged Check
(function () { // change how fetch works
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch(...args);
        if (response.status === 401) {
            location.reload();
        }
        return response;
    };
})();


const terminalInput = document.getElementById("terminal-input")

async function SendCommand() {
    await fetch(`/send_command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:  JSON.stringify({command: terminalInput.value}),
    });
    terminalInput.value = "";
}