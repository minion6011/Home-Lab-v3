/* --- Variables --- */
const domEl = {
    settingMenu: document.getElementById("setting-menu"),
    settingMenuSidebar: document.getElementById("setting-menu-sidebar"),

    buttonDark: document.getElementById("dark-button"),
    buttonDarkMobile: document.getElementById("dark-button_mobile"),
    buttonLight: document.getElementById("light-button"),
    buttonLightMobile: document.getElementById("light-button_mobile"),

    iframePages: document.getElementById("pages-iframe"),

    iframeContainer: document.getElementById("container-iframe"),
    navbarContainer: document.getElementById("container-navbar")
}
const endpoints = {
    login: "/login"
}
defaultPageId = "/home"

/* --- Functions --- */
// Pages Load
const pageIdIn = document.getElementById("pagesId-input");

let newElement = document.querySelector(`a[href='/${pageIdIn.value}']`);
let oldElement = document.getElementById("active-navbar");
if (newElement != oldElement) {
    if (oldElement) oldElement.id = ""; 
    newElement.id = "active-navbar";
    domEl.iframePages.src = newElement.dataset.path;
} else if (!newElement) {
    newElement = document.querySelector(`a[href='${defaultPageId}']`);
    newElement.id = "active-navbar";
    domEl.iframePages.src = newElement.dataset.path;
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
domEl.iframePages.addEventListener("load", (event) => {
    fetch(domEl.iframePages.src)
    .then(res => {
        if (res.status == 401) { 
            location.reload();
        }
    });
});

// Theme Management
if (localStorage.getItem("theme") === "light") {
    changeTheme("light");
}
else {
    changeTheme("dark");
}

function changeTheme(color) {
    localStorage.setItem("theme", color);
    if (color === "dark") {
        domEl.buttonDarkMobile.style.backgroundColor = domEl.buttonDark.style.backgroundColor = "var(--selected-theme-bg-color)"
        domEl.buttonLightMobile.style.backgroundColor = domEl.buttonLight.style.backgroundColor = "#ffffff00"
        document.body.classList.remove("light");
    }
    else {
        domEl.buttonLightMobile.style.backgroundColor = domEl.buttonLight.style.backgroundColor = "var(--selected-theme-bg-color)"
        domEl.buttonDarkMobile.style.backgroundColor = domEl.buttonDark.style.backgroundColor = "#ffffff00"
        
        document.body.classList.add("light");
    }
}

/* --- */

document.addEventListener("click", (e) => { // **Thanks Internet for the help
    const link = e.target.closest("a[data-path]");
    if (!link) return;
    e.preventDefault(); // No-Reload
    try {
        pathname = domEl.iframePages?.contentWindow?.location?.pathname;
    } catch (e) {
        pathname = undefined;
    }
    const pagePath = link.dataset.path;
    if (pagePath != pathname) {
        let oldElement = document.getElementById("active-navbar");
        if (oldElement) oldElement.id = "";

        link.id = "active-navbar";

        const url = link.getAttribute("href");
        if (domEl.iframePages.contentWindow) domEl.iframePages.contentWindow.location.replace(pagePath);
        else domEl.iframePages.src = pagePath;

        history.pushState({ pagePath },"", url);
    }
});
window.addEventListener("popstate", (e) => {
    window.location.reload()
});


// Settings Menù
function openSettings() {
    if (!window.matchMedia("(max-width: 1003px)").matches) {
        domEl.settingMenu.style.display = "block";
        domEl.settingMenu.classList.remove("hide");
        domEl.settingMenu.classList.add("show");
    } else {
        domEl.settingMenuSidebar.style.display = "block";
        domEl.settingMenuSidebar.classList.remove("hide");
        domEl.settingMenuSidebar.classList.add("show");
    }
}

document.addEventListener('click', (event) => closeThemeMenu(event.target));
window.addEventListener('blur', () => closeThemeMenu(null));

function closeThemeMenu(target) {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        closeTarget = domEl.settingMenu
    else
        closeTarget = domEl.settingMenuSidebar

    if (closeTarget.style.display == "block" && !closeTarget.contains(target)) {
        closeTarget.classList.add("hide");
        closeTarget.classList.remove("show");

        closeTarget.addEventListener('animationend', function handler() {
            closeTarget.style.display = "none";
            closeTarget.classList.remove("hide");
            closeTarget.removeEventListener('animationend', handler);
        });
    }
    
}

/* --- */

// Sidebar Functions

function openPagesSidebar() {
    if (domEl.navbarContainer.dataset.status == "off") {
        domEl.navbarContainer.dataset.status = "on"
        domEl.navbarContainer.style.opacity = "0" // Transition
        domEl.iframeContainer.style.display = "none"
        domEl.navbarContainer.style.display = "block"
        setTimeout(() => {domEl.navbarContainer.style.opacity = "1"}, 50); // Transition
    }
    else {
        domEl.navbarContainer.dataset.status = "off"
        domEl.iframeContainer.style.opacity = "0" // Transition
        domEl.navbarContainer.style.display = "none"
        domEl.iframeContainer.style.display = "block"
        setTimeout(() => {domEl.iframeContainer.style.opacity = "1"}, 50); // Transition
    }
}

const mediaQuery = window.matchMedia("(max-width: 1003px)");

function handleResize(e) { // Fix openPagesSidebar()
    if (!e.matches) {
        domEl.navbarContainer.style.display = ""
        domEl.iframeContainer.style.display = ""
    }
}

mediaQuery.addEventListener("change", handleResize);