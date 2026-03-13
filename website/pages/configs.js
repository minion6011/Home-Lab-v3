/* --- Variables --- */
const domEl = {
    disconnectCheck: document.getElementById("disconnectUsers")
}
const endpoints = {
    loadConfig: "/load-configs"
}

/* --- Functions --- */
async function UpdateConfigs() {
    let req = await fetch(endpoints.loadConfig, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({themesFile: getThemes(), configFile: getConfig()}),
    });
    if (req.status == 200) {
        window.parent.location.reload();
    }
}
