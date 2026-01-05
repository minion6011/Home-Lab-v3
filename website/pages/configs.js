// Theme Loader
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
}
else {
    document.body.classList.remove("light");
}

window.addEventListener("storage", (event) => { // This event is different from the defaults
    if (event.newValue === "light") {
        document.body.classList.add("light");
    }
    else if (event.newValue === "dark") {
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
// --- Variables
const disconnectCheck = document.getElementById("disconnectUsers");

// --- Functions
async function UpdateConfigs() {
    let req = await fetch("/load-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({themesFile: getThemes(), configFile: getConfig(), disconnectAll: disconnectCheck.checked}),
    });
    if (req.status == 200) {
        window.parent.location.reload();
    }
}