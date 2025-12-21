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
// - Main
const mainContainer = document.getElementById("mainContainer");

// - Song
// Player Related
const playerStateImg = document.getElementById("play-stop-img");
const playerLoopBtn = document.getElementById("loop-btn");
const playerShuffleBtn = document.getElementById("shuffle-btn");
const muteImg = document.getElementById("mute-img");
const volumeRange = document.getElementById("volumeRange");

const currentDuration = document.getElementById("cur-duration");
const maxDuration = document.getElementById("max-duration");

const playerRange = document.getElementById("playerRange");
const playerSongImg = document.getElementById("playerImg");
const playerSongTitle = document.getElementById("playerTitle");

// Songs Related
let oldSong = [];
let oldVolume = 1;
let currentPl = [null, null]; //plId (str), plIdLenght (str)
let preloadData = ["", "", "", "", 0] // struct ["url", "name", "artist", "img", 0]
const audioControll = document.getElementById("AudioControll");

const songTableSongs = document.getElementById("songs-table");

let shuffleState = false;
const addsongInput = document.getElementById("songs-input");

const plDsImg = document.getElementById("plDs-img");
const plDsTitle = document.getElementById("plDs-title");
const plDsDesc = document.getElementById("plDs-desc");
const plDSId = document.getElementById("plDs-id");

// - Modal Related
// Playlist
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
// Songs Player
async function DeleteSong(value) {
    let id = value.parentElement.parentElement.children[0].innerText;
    let req = await fetch("/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: plDSId.value, type: "delete", index: id-1}),
    });
    if (req.status == 200) {
        if (plDSId.value == currentPl[0]) currentPl[1] -= 1;
        if (preloadData[4]+1 == id) PreloadSong(id);
        value.parentElement.parentElement.parentElement.removeChild(value.parentElement.parentElement);
        let ls = songTableSongs.getElementsByClassName("songTcontainer")
        for (let i = 0; i < ls.length; i++) {
            if (Number(ls[i].children[0].innerText)>Number(id)) {
                ls[i].children[0].innerText = (Number(ls[i].children[0].innerText) - 1).toString()
                ls[i].setAttribute("onclick", `FetchSong(${Number(ls[i].children[0].innerText) - 1});`);
            }
        };
    }
    else throw new Error("Getting a song returns a non-200 status code");
}
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}
function StartStopAudio() {
    if (audioControll.paused) {
        audioControll.play();
        playerStateImg.src = "/website/img/stop-ico.webp"
    }
    else {
        audioControll.pause();
        playerStateImg.src = "/website/img/play-ico.webp"
    };
}
function ChangeVolume(mute, value) {
    if (volumeRange.value == 0) {
        if (mute) {
            if (oldVolume == 0) {value = oldVolume = 0.5}
            else {value = oldVolume};
        }
        if (!mute) oldVolume = 0;
    }
    else if (value != 0 && !mute) oldVolume = value;
    volumeRange.value = audioControll.volume = value;
    if (value == 0) muteImg.src = "/website/img/mute-ico.webp"
    else muteImg.src = "/website/img/volume-ico.webp";
}
function LoopToogle() {
    audioControll.loop = !audioControll.loop;
    playerLoopBtn.classList.toggle("on", audioControll.loop);
}

async function NextSong() {
    if (preloadData[0] == audioControll.src) {
        await PreloadSong(preloadData[4])
    }
    PlaySong(preloadData[0], preloadData[1], preloadData[2], preloadData[3], preloadData[4])
}

async function setPWA(title, artist, img) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ 
            title: title,
            artist: artist,
            album: plDsTitle.innerText,
            artwork: [
                { src: img, sizes: "512x512", type: "image/png" }
            ],
        });
        navigator.mediaSession.setActionHandler('play', () => {StartStopAudio()});  
        navigator.mediaSession.setActionHandler('pause', () => {StartStopAudio()});
        navigator.mediaSession.setActionHandler('nexttrack', async () => {await NextSong()});
        navigator.mediaSession.setActionHandler('previoustrack', async () => {FetchSong(oldSong[0]); oldSong.splice(1, 1)})
    }
}

async function FetchSong(sgId) {
    currentPl[0] = plDSId.value;
    currentPl[1] = document.getElementsByClassName("songTcontainer").length-1;
    let req = await fetch("/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: currentPl[0], type: "get", index: sgId}),
    });
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        PlaySong(json.song.url_path,json.song.name,json.song.artist, json.song.img, sgId)
    }
    else throw new Error("Getting a song returns a non-200 status code");
}

async function PlaySong(url, name, artist, img, index) {
    if (mainContainer.dataset.play == "0") {
        mainContainer.dataset.play = "1"
    }
    oldSong.push(index);
    if (oldSong.length >= 3) {
        oldSong.splice(0, 1)
    }
    audioControll.src = url; await audioControll.play(); playerStateImg.src = "/website/img/stop-ico.webp"; PreloadSong(index); // Play and preload next song
    playerRange.value = 0; playerRange.max = audioControll.duration; maxDuration.innerHTML = formatTime(audioControll.duration);
    setPWA(name, artist, img);
    if (playerRange.disabled) playerRange.disabled = false;
    // Player Setup
    let SongReduc = name.substring(0,40); if (name.length>40) {SongReduc+="..."}
    playerSongImg.src = img; playerSongTitle.innerText = SongReduc;
    
}

 
if (window.isSecureContext) { // Only Works in HTTPS
    audioControll.addEventListener("play", updatePositionState);
    audioControll.addEventListener("loadedmetadata", updatePositionState);
    function updatePositionState() {
        if (!navigator.mediaSession || !audioControll.duration) return;
        navigator.mediaSession.setPositionState({
            duration: audioControll.duration,
            playbackRate: audioControll.playbackRate,
            position: audioControll.currentTime
        });
    }
}

audioControll.addEventListener('timeupdate', () => {
  if (audioControll.duration) {
    playerRange.value = audioControll.currentTime;
    currentDuration.innerHTML = formatTime(audioControll.currentTime)
    playerRange.style.setProperty('--range-progress-width', `${(playerRange.value - playerRange.min) / (playerRange.max - playerRange.min) * 100}%`);
  }
});

audioControll.addEventListener('ended', () => {
    PlaySong(preloadData[0], preloadData[1], preloadData[2], preloadData[3], preloadData[4])
    PreloadSong(preloadData[4]);
});

async function PreloadSong(id) {
    let i = id+1;
    let length = currentPl[1];
    if (shuffleState && length >= 1) {i = Math.floor(Math.random() * length)}
    if (i == id) { if (i+1>length) {i--} else {i++};} // Evita che appaia lo stesso numero
    if (i > length) {i = 0}; // Ricomincia
    let req = await fetch("/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            num: currentPl[0],
            type: "get",
            index: i,
        }),
    })
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        preloadData = [json.song.url_path, json.song.name, json.song.artist, json.song.img, i]
    }
    else throw new Error("Getting a song (preload funct) returns a non-200 status code");
}
// Song Html
function CreateSongHTML(index, values) { // da aggiungere il link nel onclick ------
    let trElement = document.createElement("tr"); trElement.className = "songTcontainer";
    trElement.setAttribute("onclick", `FetchSong(${index});`);
    songName = values.name.substring(0,32); if (values.name.length>32) {songName+="..."}
    trElement.innerHTML = `
    <td data-visible="0">${index + 1}</td>
    <td class="titleSong-column">
        <img loading="lazy" src="${values.img}">
        <p>${songName}</p>
    </td>
    <td data-visible="0">${values.artist}</td>
    <td data-visible="0">${values.added}</td>
    <td data-visible="0">${values.duration}</td>
    <td style="text-align: center;">
        <button onclick="event.stopPropagation(); DeleteSong(this)" class="songTable-delete">
            <img src="/website/img/delete-ico.webp">
        </button>
    </td>
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
        if (plDSId.value == currentPl[0]) currentPl[1] += 1
        let json = JSON.parse(await req.text());
        json.nwSongs.forEach((song, index) => {
            CreateSongHTML(json.indexStart+index, song)
        });
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
    shuffleState = !shuffleState;
    playerShuffleBtn.classList.toggle("on", shuffleState);
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
