/* --- Variables --- */
const domEl = {
    terminalInput: document.getElementById("terminal-input")
}
const endpoints = {
    sendCommand: "/send_command"
}

/* --- Functions --- */
async function SendCommand() {
    await fetch(endpoints.sendCommand, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({command: domEl.terminalInput.value}),
    });
    domEl.terminalInput.value = "";
}
