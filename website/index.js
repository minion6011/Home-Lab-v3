const settingMenu = document.getElementById("setting-menu");

const settingMenuSidebar = document.getElementById("setting-menu-sidebar");

const buttonDark = document.getElementById("dark-button");
const buttonLight = document.getElementById("light-button");

const iframePages = document.getElementById("pages-iframe");

// Page Loader
if (localStorage.getItem("lastPage") !== null) {
    let newElement = document.querySelector(`[data-path='${localStorage.getItem("lastPage")}']`);
    let oldElement = document.getElementById("active-navbar");

    if (newElement != oldElement) {
        oldElement.id = "";
        newElement.id = "active-navbar";
        iframePages.src = newElement.dataset.path;
    }
}


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
        buttonDark.style.backgroundColor = "var(--selected-theme-bg-color)"
        buttonLight.style.backgroundColor = "#ffffff00"
        document.body.classList.remove("light");
    }
    else {
        buttonLight.style.backgroundColor = "var(--selected-theme-bg-color)"
        buttonDark.style.backgroundColor = "#ffffff00"
        document.body.classList.add("light");
    }
}

/* --- */

// Settings Menù
function openSettings() {
    if (!window.matchMedia("(max-width: 1003px)").matches) {
        settingMenu.style.display = "block";
        settingMenu.classList.remove("hide");
        settingMenu.classList.add("show");
    } else {
        settingMenuSidebar.style.display = "block";
        settingMenuSidebar.classList.remove("hide");
        settingMenuSidebar.classList.add("show");
    }
}

document.addEventListener('click', (event) => {
    if (!window.matchMedia("(max-width: 1003px)").matches) {
        if (settingMenu.style.display == "block" && !settingMenu.contains(event.target)) {

            settingMenu.classList.add("hide");
            settingMenu.classList.remove("show");

            settingMenu.addEventListener('animationend', function handler() {
                settingMenu.style.display = "none";
                settingMenu.classList.remove("hide");
                settingMenu.removeEventListener('animationend', handler);
            });
        }
    }
    else {
        if (settingMenuSidebar.style.display == "block" && !settingMenuSidebar.contains(event.target)) {
            settingMenuSidebar.classList.add("hide");
            settingMenuSidebar.classList.remove("show");

            settingMenuSidebar.addEventListener('animationend', function handler() {
                settingMenuSidebar.style.display = "none";
                settingMenuSidebar.classList.remove("hide");
                settingMenuSidebar.removeEventListener('animationend', handler);
            });
        }
    }
});

/* --- */

// Navbar


function openMenu(newElement) {
    iframePages.src = "about:blank";
    setTimeout(() => {
        iframePages.src = newElement.dataset.path;
    }, 0);
    if (newElement.id === "active-navbar") return;
    let oldElement = document.getElementById("active-navbar");
    oldElement.id = "";
    
    newElement.id = "active-navbar";
    localStorage.setItem("lastPage", newElement.dataset.path);
}

/* --- */

// Sidebar Functions


const iframeContainer = document.getElementById("container-iframe")
const navbarContainer = document.getElementById("container-navbar")

function openPagesSidebar() {
    if (navbarContainer.dataset.status == "off") {
        navbarContainer.dataset.status = "on"
        navbarContainer.style.opacity = "0" // Transition
        iframeContainer.style.display = "none"
        navbarContainer.style.display = "block"
        setTimeout(() => {navbarContainer.style.opacity = "1"}, 50); // Transition
    }
    else {
        navbarContainer.dataset.status = "off"
        iframeContainer.style.opacity = "0" // Transition
        navbarContainer.style.display = "none"
        iframeContainer.style.display = "block"
        setTimeout(() => {iframeContainer.style.opacity = "1"}, 50); // Transition
    }
}

const mediaQuery = window.matchMedia("(max-width: 1003px)");

function handleResize(e) { // Fix openPagesSidebar()
  if (!e.matches) {
    navbarContainer.style.display = ""
    iframeContainer.style.display = ""
  }
}

mediaQuery.addEventListener("change", handleResize);