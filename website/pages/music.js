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


/* Playlist Modal */
const playlistModal = document.getElementById("playlist-modal");
const playlistModalTitle = document.getElementById("modal-pl-title");

function PlaylistModal(arg, editImg=null) {
    if (arg === "edit") {
        playlistModalTitle.innerText = "Edit Playlist";
        imgView.src = editImg;
        playlistModal.style.display = "block";
    }
    else if (arg === "new") {
        if (imgDefault !== "") {
            imgView.src = imgDefault;
        }
        playlistModalTitle.innerText = "Create Playlist";
        playlistModal.style.display = "block";
    }
    else if (arg === "close") {
        playlistModal.style.display = "none";
    }
}
let imgDefault = "";
const fileInput = document.getElementById("img-file");
const imgView = document.getElementById("modal-pl-img");

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (imgDefault === "") {
        imgDefault = imgView.src;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        imgView.src = e.target.result;
    };
    reader.readAsDataURL(file);
});


/* Api */

const pl_name = document.getElementById("pl-name");
const pl_desc = document.getElementById("pl-desc");
function CreateEditPlaylist(type, num=null) {
    const formData = new FormData();
    formData.append("type", type);
    if (type === "edit") {
        formData.append("num", num);
    }
    formData.append("img", fileInput.files[0]);
    formData.append('name', pl_name.value);
    formData.append('description', pl_desc.value);
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
}

const playlistsContainer = document.getElementById("playlists-container");
async function CreatePlHTML(imgSrc, plName, plNum) {
    let divMain = document.createElement("div");
    divMain.className = "pl-item";
    // Elementi del divMain
    let img = document.createElement("img");
    img.className = "pl-img";
    img.src = imgSrc;
    divMain.appendChild(img);

    let p = document.createElement("div");
    p.className = "pl-text";
    p.innerText = plName // Non sono sicuro sia innerText o innerHTML;
    divMain.appendChild(p);

    let hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.value = plNum;
    hiddenInput.className = "pl-id";
    divMain.appendChild(hiddenInput);

    playlistsContainer.appendChild(divMain);
}
