/* --- Variables --- */
const domEl = {
    terminalInput: document.getElementById("terminal-input")
}
const endpoints = {
    sendCommand: "/send_command"
}

/* --- Functions --- */
/* - Default - */
// Theme Loader
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
// Iframe Check
if (window.self === window.top) {
    document.documentElement.classList.add("not-iframe");
}
// Logged Check
(function () { // change how fetch works
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch(...args);
        if (response.status === 401) {
            window.parent.location.reload();
        }
        return response;
    };
})();
/* - - */

// --- Functions
async function SendCommand() {
    await fetch(endpoints.sendCommand, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({command: domEl.terminalInput.value}),
    });
    domEl.terminalInput.value = "";
}