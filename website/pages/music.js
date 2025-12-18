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
// --- Variables
const mainContainer = document.getElementById("mainContainer");
// Songs Related
const songTableSongs = document.getElementById("songs-table");

let shuffleState = false;
const shuffleButton = document.getElementById("songs-shuffle");
const addsongInput = document.getElementById("songs-input");

const plDsImg = document.getElementById("plDs-img");
const plDsTitle = document.getElementById("plDs-title");
const plDsDesc = document.getElementById("plDs-desc");
const plDSId = document.getElementById("plDs-id");

// Modal Related
// - Playlist
const playlistsContainer = document.getElementById("playlists-container");
let modalState = [false,false];

const plNameIn = document.getElementById("pl-name");
const plDescIn = document.getElementById("pl-desc");

const fileInput = document.getElementById("img-file");
const imgView = document.getElementById("modal-pl-img");

const playlistModal = document.getElementById("playlist-modal");
const playlistModalTitle = document.getElementById("modal-pl-title");
const buttonModal = document.getElementById("pl-btn");

let imgDefault = "";
// --- Functions

// Songs
function CreateSongHTML(index, values) { // da aggiungere il link nel onclick ------
    let trElement = document.createElement("tr"); trElement.className = "songTcontainer";
    songName = values.name.substring(0,32); if (values.name.length>32) {songName+="..."}
    trElement.innerHTML = `
    <td data-visible="0">${index + 1}</td>
    <td class="titleSong-column">
        <img src="${values.img}">
        <p>${songName}</p>
    </td>
    <td data-visible="0">${values.artist}</td>
    <td data-visible="0">${values.added}</td>
    <td data-visible="0">${values.duration}</td>
    `;
    songTableSongs.appendChild(trElement);
}

// Add-Song Button
async function AddSong() {
    let songName = addsongInput.value; addsongInput.value = ""; addsongInput.placeholder = "Downloading..."
    addsongInput.disabled = true;
    let req = await fetch("/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: plDSId.value, type: "add", sname: songName}),
    });
    addsongInput.disabled = false; addsongInput.placeholder = "YT name/link...";
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        json.nwSongs.forEach((song, index) => {
            CreateSongHTML(json.indexStart+index, song)
        });
        console.log(Number(json.indexStart));
        console.log(Number(json.nwSongs.length));
        plDsDesc.innerHTML = plDsDesc.innerHTML.replace(/( - )(.*?)(<\/i>)/, "$1" + (Number(json.indexStart)+Number(json.nwSongs.length)) + "$3");
    }
    else throw new Error("Adding a song returns a non-200 status code");
}
function SongAddInput() {
    if (addsongInput.style.display == "block") { // Fade Out
        addsongInput.classList.add("animate", "out");
        addsongInput.addEventListener("animationend", () => {
            addsongInput.classList.remove("animate", "out");
            addsongInput.style.display = "none";
        }, { once: true });

    } else if (addsongInput.style.display == "none" && !addsongInput.classList.contains("animate")) { // Fade In
        addsongInput.style.display = "block";
        addsongInput.classList.add("animate");
    }
}

// Delete Button
async function deletePl() {
    let req = await fetch("/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: plDSId.value, type: "delete"}),
    });
    if (req.status == 200) {
        EditPlsHTML(plDSId.value, null, null, "delete");
        mainContainer.dataset.status = "0";
    }
    else throw new Error("Deleting a playlist returns a non-200 status code");
}

// Shuffle Button
function TurnShuffle() {
    shuffleState = !shuffleState
    if (shuffleState) {shuffleButton.classList.add("on")}
    else {shuffleButton.classList.remove("on")}
}


// Playlist
// Playlist Grid Check
if (localStorage.getItem("pl-grid")) {
    playlistsContainer.className = localStorage.getItem("pl-grid")
}
// ---

async function OpenPlaylist(item) {
    let ItemPlId = item.querySelector(".pl-id");
    let data = await GetPlData(ItemPlId.value);
    if (data == null) throw new Error("Playlist data returned null (Code was not 200)")
    plDSId.value = ItemPlId.value;
    plDsImg.src = data.img; plDsTitle.innerHTML = data.name; plDsDesc.innerHTML = `${data.description.replaceAll("\n", "<br>")}<br><br><i>Songs - ${data.songs.length}</i>`;
    mainContainer.dataset.status = "1";
    songTableSongs.innerHTML = songTableSongs.children[0].children[0].innerHTML; // reset list
    data.songs.forEach((song, index) => {
        CreateSongHTML(index, song);
    });
}


async function GetPlData(plNum) {
    let req = await fetch("/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: plNum, type: "get"}),
    });
    if (req.status == 200) {
        return JSON.parse(await req.text())
    }
    return null
}


function GridChangePlaylist(arg) { // 'playlists-details' or 'playlists-grid'
    if (arg == 'playlists-details' || arg == 'playlists-grid') {
        playlistsContainer.className = arg;
        localStorage.setItem("pl-grid", arg);
    }
}

// Modal Related 
function PlaylistModal(arg) {
    if (imgDefault === "") imgDefault = imgView.src;
    if (imgDefault != "") imgView.src = imgDefault;
    if (arg === "edit") { // Needs changes
        modalState = [true,true]; buttonModal.disabled = false;
        fileInput.files[0] = null;
        imgView.src = plDsImg.src; plNameIn.value = plDsTitle.innerText; plDescIn.value = plDsDesc.innerText.substring(0, plDsDesc.innerText.lastIndexOf("\n\n"));
        buttonModal.setAttribute("onClick", `CreateEditPlaylist('edit', ${plDSId.value})`); playlistModalTitle.innerText = "Edit Playlist";
        playlistModal.style.display = "block";
    }
    else if (arg === "new") {
        modalState = [false,false];
        plNameIn.value = ""; plDescIn.value = ""; buttonModal.disabled = true;
        buttonModal.setAttribute("onClick", "CreateEditPlaylist()"); playlistModalTitle.innerText = "Create Playlist";
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
    let ptype
    formData.append("type", type);
    if (type === "edit") {
        formData.append("num", num);
    }
    formData.append("img", fileInput.files[0]);
    formData.append('name', plNameIn.value);
    formData.append('description', plDescIn.value);
    if (fileInput.files[0] == null) {ptype = "application/json"} else {ptype = fileInput.files[0].contentType}
    const requestOptions = {
        headers: {
            "Content-Type": ptype,
        },
        mode: "no-cors",
        method: "POST",
        files: fileInput.files[0],
        body: formData,
    };
    fetch("/playlist", requestOptions).then((response) => {
        response.json().then((data) => {
            if (type != "edit") {CreatePlHTML(data.plSrc, data.plName, data.plNum);}
            else {
                // Img
                if (fileInput.files[0] != null) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        plDsImg.src = e.target.result
                        EditPlsHTML(num, e.target.result, null)
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                }
                // Title + Desc
                plDsTitle.innerText = plNameIn.value; plDsDesc.innerHTML = plDescIn.value.replaceAll("\n","<br>") + plDsDesc.innerHTML.slice(plDsDesc.innerHTML.lastIndexOf("<br><br>")-plDsDesc.innerHTML.length);
                EditPlsHTML(num, null, plNameIn.value)
            }
        });
    });
    PlaylistModal('close')
}

function EditPlsHTML(id, srcNew, titleNew, type=null) {
    playlistsLs = playlistsContainer.getElementsByClassName("pl-item");
    for (let i = 0; i < playlistsLs.length; i++) {
        element = playlistsLs[i];
        if (element.querySelector(".pl-id").value == id) {
            if (type == null) {
                if (srcNew != null) element.querySelector(".pl-img").src = srcNew;
                if (titleNew != null) element.querySelector(".pl-text").src = titleNew;
            } else if (type == "delete") playlistsContainer.removeChild(element);
        }
    };
}

async function CreatePlHTML(imgSrc, plName, plNum) {
    let divMain = document.createElement("div");
    divMain.className = "pl-item";
    divMain.setAttribute("onClick", "OpenPlaylist(this)");
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
