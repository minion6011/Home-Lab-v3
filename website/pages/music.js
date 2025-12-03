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
    else {
        document.body.classList.remove("light");
    }
});
// Iframe Check
if (window.self === window.top) {
    document.documentElement.classList.add("not-iframe");
}
// --- 
// Songs Related

// Modal Related
const playlistsContainer = document.getElementById("playlists-container");
let modalState = [false,false]

const plNameIn = document.getElementById("pl-name");
const plDescIn = document.getElementById("pl-desc");

const fileInput = document.getElementById("img-file");
const imgView = document.getElementById("modal-pl-img");

const playlistModal = document.getElementById("playlist-modal");
const playlistModalTitle = document.getElementById("modal-pl-title");
const buttonModal = document.getElementById("pl-btn")

let imgDefault = "";



// Playlist

function OpenPlaylist(item) {
    let ItemPlImg = item.querySelector(".pl-img");
    let ItemPlName = item.querySelector(".pl-text");
    let ItemPlId = item.querySelector(".pl-id");
}


// Modal Related 
function PlaylistModal(arg, editImg=null) {
    if (imgDefault != "") imgView.src = imgDefault;
    if (arg === "edit") { // Needs changes
        playlistModalTitle.innerText = "Edit Playlist";
        imgView.src = editImg;
        playlistModal.style.display = "block";
    }
    else if (arg === "new") {
        modalState = [0,0];
        plNameIn.value = ""; plDescIn.value = ""; buttonModal.disabled = true;
        playlistModalTitle.innerText = "Create Playlist";
        playlistModal.style.display = "block";
    }
    else if (arg === "close") {
        playlistModal.style.display = "none";
    }
}

fileInput.addEventListener('change', () => {
    modalState[0] = true; checkStatus();
    const file = fileInput.files[0];
    if (imgDefault === "") imgDefault = imgView.src;
    const reader = new FileReader();
    reader.onload = (e) => imgView.src = e.target.result;
    reader.readAsDataURL(file);
});
plNameIn.addEventListener("change", () => {
    modalState[1] = (plNameIn.value != ""); checkStatus(); 
});

function checkStatus() {
    buttonModal.disabled = !(modalState[0] && modalState[1]);
};

// Create-Edit Playlist
function CreateEditPlaylist(type, num=null) {
    const formData = new FormData();
    formData.append("type", type);
    if (type === "edit") {
        formData.append("num", num);
    }
    formData.append("img", fileInput.files[0]);
    formData.append('name', plNameIn.value);
    formData.append('description', plDescIn.value);
    const requestOptions = {
        headers: {
            "Content-Type": fileInput.files[0].contentType,
        },
        mode: "no-cors",
        method: "POST",
        files: fileInput.files[0],
        body: formData,
    };

    fetch("/playlist", requestOptions).then((response) => {
        response.json().then((data) => {
            CreatePlHTML(data.plSrc, data.plName, data.plNum);
        });
    });
    PlaylistModal('close')
}

async function CreatePlHTML(imgSrc, plName, plNum) {
    let divMain = document.createElement("div");
    divMain.className = "pl-item";
    divMain.setAttribute("onClick", "OpenPlaylist(self)");
    // Elementi del divMain
    let img = document.createElement("img");
    img.className = "pl-img";
    img.src = imgSrc;
    
    let p = document.createElement("div");
    p.className = "pl-text";
    p.innerText = plName

    let hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.value = plNum;
    hiddenInput.className = "pl-id";

    divMain.append(img, p, hiddenInput);
    playlistsContainer.appendChild(divMain);
}
