/* --- Variables --- */
// Songs Related
let nDownload = 0;
let oldSong = [];
let oldVolume = 1;
let currentPl = [null, null]; //plId (str), plIdLenght (str)
let preloadData = ["", "", "", "", 0] // struct ["url", "name", "artist", "img", 0]
let shuffleState = false;

// Modal Related
let modalState = [false,false];
let imgDefault = "";

const domElSgPy = { // Song Player Elements
    playerStateImg: document.getElementById("play-stop-img"),
    playerLoopBtn: document.getElementById("loop-btn"),
    playerShuffleBtn: document.getElementById("shuffle-btn"),
    muteImg: document.getElementById("mute-img"),
    volumeRange: document.getElementById("volumeRange"),

    currentDuration: document.getElementById("cur-duration"),
    maxDuration: document.getElementById("max-duration"),

    playerRange: document.getElementById("playerRange"),
    playerSongImg: document.getElementById("playerImg"),
    playerSongTitle: document.getElementById("playerTitle")
}
const domElSongs = { // Songs Elements
    mainContainer: document.getElementById("mainContainer"),

    audioControll: document.getElementById("AudioControll"),
    audioPreload: document.getElementById("AudioPreload"),

    songTableSongs: document.getElementById("songs-table"),

    addsongInput: document.getElementById("songs-input"),

    plDsImg: document.getElementById("plDs-img"),
    plDsTitle: document.getElementById("plDs-title"),
    plDsDesc: document.getElementById("plDs-desc"),
    plDSId: document.getElementById("plDs-id")
}
const domElPlaylist = { // Playlist Elements
    playlistsContainer: document.getElementById("playlists-container"),

    plNameIn: document.getElementById("pl-name"),
    plDescIn: document.getElementById("pl-desc"),

    fileInput: document.getElementById("img-file"),
    imgView: document.getElementById("modal-pl-img"),

    playlistModal: document.getElementById("playlist-modal"),
    playlistModalTitle: document.getElementById("modal-pl-title"),
    buttonModal: document.getElementById("pl-btn"),
    
    delPlButton: document.getElementById("del-pl-btn"),
}
const endpoints = {
    songs: "/songs",
    playlist: "/playlist",
    
    playIco: "/website/img/play-ico.webp",
    stopIco: "/website/img/stop-ico.webp",
    muteIco: "/website/img/mute-ico.webp",
    volumeIco: "/website/img/volume-ico.webp",
    deleteIco: "/website/img/delete-ico.webp"
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
/* - - */

// Songs Player
async function DeleteSong(value) {
    let id = value.parentElement.parentElement.children[0].innerText;
    if (value.parentElement.parentElement.children[1].children[1].innerText.substring(0,30) == domElSgPy.playerSongTitle.innerText.substring(0,30)) {
        domElSongs.mainContainer.dataset.play = "0";
        if (domElSongs.audioControll.playing) StartStopAudio();
        domElSongs.audioControll.src = "";
    }
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: domElSongs.plDSId.value, type: "delete", index: id-1}),
    });
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        if (domElSongs.plDSId.value == currentPl[0]) currentPl[1] -= 1;
        if (preloadData[4]+1 == id) PreloadSong(id);
        value.parentElement.parentElement.parentElement.removeChild(value.parentElement.parentElement);
        let ls = domElSongs.songTableSongs.getElementsByClassName("songTcontainer")
        for (let i = 0; i < ls.length; i++) {
            if (Number(ls[i].children[0].innerText)>Number(id)) {
                ls[i].children[0].innerText = (Number(ls[i].children[0].innerText) - 1).toString()
                ls[i].setAttribute("onclick", `FetchSong(${Number(ls[i].children[0].innerText) - 1});`);
            }
        };
        domElSongs.plDsDesc.innerHTML = domElSongs.plDsDesc.innerHTML.replace(/( - )(.*?)(<\/i>)/, "$1" + Number(json.indexNew) + "$3");
    }
    else throw new Error("Getting a song returns a non-200 status code");
}
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}
function StartStopAudio() {
    if (domElSongs.audioControll.paused) {
        navigator.mediaSession.playbackState = "playing";
        domElSongs.audioControll.play();
        domElSgPy.playerStateImg.src = endpoints.stopIco;
    }
    else {
        navigator.mediaSession.playbackState = "paused";
        domElSongs.audioControll.pause();
        domElSgPy.playerStateImg.src = endpoints.playIco;
    };
}
function ChangeVolume(mute, value) {
    if (domElSgPy.volumeRange.value == 0) {
        if (mute) {
            if (oldVolume == 0) {value = oldVolume = 0.5}
            else {value = oldVolume};
        }
        if (!mute) oldVolume = 0;
    }
    else if (value != 0 && !mute) oldVolume = value;
    domElSgPy.volumeRange.value = domElSongs.audioControll.volume = value;
    if (value == 0) domElSgPy.muteImg.src = endpoints.muteIco
    else domElSgPy.muteImg.src = endpoints.volumeIco;
}
function LoopToogle() {
    domElSongs.audioControll.loop = !domElSongs.audioControll.loop;
    domElSgPy.playerLoopBtn.classList.toggle("on", domElSongs.audioControll.loop);
}

async function NextSong() {
    if (preloadData[0] == domElSongs.audioControll.src) {
        await PreloadSong(preloadData[4])
    }
    PlaySong(preloadData[0], preloadData[1], preloadData[2], preloadData[3], preloadData[4])
}

async function setPWA(title, artist, img) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ 
            title: title,
            artist: artist,
            album: domElSongs.plDsTitle.innerText,
            artwork: [
                { src: img, sizes: "512x512", type: "image/png" }
            ],
        });
        navigator.mediaSession.setActionHandler('play', () => {StartStopAudio()});  
        navigator.mediaSession.setActionHandler('pause', () => {StartStopAudio()});
        navigator.mediaSession.setActionHandler('nexttrack', async () => {await NextSong()});
        navigator.mediaSession.setActionHandler('previoustrack', async () => {FetchSong(oldSong[0]); oldSong.splice(1, 1)})
        navigator.mediaSession.setActionHandler("seekbackward", (details) => {Seek(false, details)});
        navigator.mediaSession.setActionHandler("seekforward", (details) => {Seek(true, details)});
    }
}

function Seek(add, details) {
    const skipTime = details.seekOffset || 10;
    if (add) domElSongs.audioControll.currentTime = Math.min(domElSongs.audioControll.currentTime + skipTime, domElSongs.audioControll.duration);
    else domElSongs.audioControll.currentTime = Math.min(domElSongs.audioControll.currentTime - skipTime, 0);
}

async function FetchSong(sgId) {
    currentPl[0] = domElSongs.plDSId.value;
    currentPl[1] = document.getElementsByClassName("songTcontainer").length-1;
    let req = await fetch(endpoints.songs, {
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
    if (domElSongs.mainContainer.dataset.play == "0") {
        domElSongs.mainContainer.dataset.play = "1"
    }
    oldSong.push(index);
    if (oldSong.length >= 3) {
        oldSong.splice(0, 1)
    }
    domElSongs.audioControll.src = url; 
    await domElSongs.audioControll.play(); navigator.mediaSession.playbackState = "playing";
    domElSgPy.playerStateImg.src = endpoints.stopIco; PreloadSong(index); // Play and preload next song

    domElSongs.audioControll.currentTime = 0;
    domElSgPy.playerRange.value = 0; domElSgPy.playerRange.max = domElSongs.audioControll.duration; domElSgPy.maxDuration.innerHTML = formatTime(domElSongs.audioControll.duration);
    setPWA(name, artist, img);
    if (domElSgPy.playerRange.disabled) domElSgPy.playerRange.disabled = false;
    // Player Setup
    let SongReduc = name.substring(0,40); if (name.length>40) {SongReduc+="..."}
    domElSgPy.playerSongImg.src = img; domElSgPy.playerSongTitle.innerText = SongReduc;
    
}

// Media Session
domElSongs.audioControll.addEventListener("play", updatePositionState);
domElSongs.audioControll.addEventListener("pause", updatePositionState);
domElSongs.audioControll.addEventListener("seeking", updatePositionState);

domElSongs.audioControll.addEventListener("ratechange", updatePositionState);
domElSongs.audioControll.addEventListener("loadedmetadata", updatePositionState);
domElSongs.audioControll.addEventListener("timeupdate", updatePositionState);

function updatePositionState() {
    if (!domElSongs.audioControll.duration || isNaN(domElSongs.audioControll.duration)) return;
    if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
            duration: Math.floor(domElSongs.audioControll.duration),
            playbackRate: domElSongs.audioControll.playbackRate,
            position: Math.floor(domElSongs.audioControll.currentTime),
        });
    }
}

domElSongs.audioControll.addEventListener('timeupdate', () => {
  if (domElSongs.audioControll.duration) {
    domElSgPy.playerRange.value = domElSongs.audioControll.currentTime;
    domElSgPy.playerRange.style.setProperty('--range-progress-width', `${(domElSgPy.playerRange.value - domElSgPy.playerRange.min) / (domElSgPy.playerRange.max - domElSgPy.playerRange.min) * 100}%`);
    domElSgPy.currentDuration.innerHTML = formatTime(domElSongs.audioControll.currentTime);
  }
});

domElSongs.audioControll.addEventListener('ended', () => {
    PlaySong(preloadData[0], preloadData[1], preloadData[2], preloadData[3], preloadData[4])
    PreloadSong(preloadData[4]);
});

async function PreloadSong(id) {
    let i = id+1;
    let length = currentPl[1];
    if (shuffleState && length >= 1) {i = Math.floor(Math.random() * length)}
    if (i == id) { if (i+1>length) {i--} else {i++};} // Evita che appaia lo stesso numero
    if (i > length) {i = 0}; // Ricomincia
    let req = await fetch(endpoints.songs, {
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
        domElSongs.audioPreload.src = json.song.url_path; // Preload
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
            <img src="${endpoints.deleteIco}">
        </button>
    </td>
    `;
    domElSongs.songTableSongs.appendChild(trElement);
}

// Add-Song Button
async function AddSong() {
    nDownload += 1;
    let songName = domElSongs.addsongInput.value; domElSongs.addsongInput.value = ""; domElSongs.addsongInput.placeholder = `Downloading - ${nDownload}...`
    let startPl = domElSongs.plDSId.value
    // domElSongs.addsongInput.disabled = true;
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: startPl, type: "add", sname: songName}),
    });
    // domElSongs.addsongInput.disabled = false; 
    nDownload -= 1
    if (nDownload == 0) domElSongs.addsongInput.placeholder = "YT name/link...";
    else domElSongs.addsongInput.placeholder = `Downloading - ${nDownload}...`;
    if (req.status == 200) {
        if (domElSongs.plDSId.value == currentPl[0]) currentPl[1] += 1
        let json = JSON.parse(await req.text());
        if (startPl == domElSongs.plDSId.value) {
            json.nwSongs.forEach((song, index) => {
                CreateSongHTML(json.indexStart+index, song)
            });
            domElSongs.plDsDesc.innerHTML = domElSongs.plDsDesc.innerHTML.replace(/( - )(.*?)(<\/i>)/, "$1" + (Number(json.indexStart)+Number(json.nwSongs.length)) + "$3");
        }
    }
    else throw new Error("Adding a song returns a non-200 status code");
}
function SongAddInput() {
    if (domElSongs.addsongInput.style.display == "block") { // Fade Out
        domElSongs.addsongInput.classList.add("animate", "out");
        domElSongs.addsongInput.addEventListener("animationend", () => {
            domElSongs.addsongInput.classList.remove("animate", "out");
            domElSongs.addsongInput.style.display = "none";
        }, { once: true });

    } else if (domElSongs.addsongInput.style.display == "none" && !domElSongs.addsongInput.classList.contains("animate")) { // Fade In
        domElSongs.addsongInput.style.display = "block";
        domElSongs.addsongInput.classList.add("animate");
    }
}

// Delete Button
let deleteTimeout = null;
function deleteChangeState(fstate=null) {
    let stateDel = (!domElPlaylist.delPlButton.classList.contains("clicked-del") && fstate==null) || fstate == true
    domElPlaylist.delPlButton.classList.toggle("clicked-del", stateDel);
    if (stateDel)
        domElPlaylist.delPlButton.setAttribute("onClick", "deleteChangeState(); deletePl()")
    else
        domElPlaylist.delPlButton.setAttribute("onClick", "deleteChangeState()")
    clearTimeout(deleteTimeout);
    deleteTimeout = setTimeout(() => {deleteChangeState(false)}, 5000); // after 5 seconds
}
async function deletePl() {
    let req = await fetch(endpoints.playlist, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: domElSongs.plDSId.value, type: "delete"}),
    });
    if (req.status == 200) {
        EditPlsHTML(domElSongs.plDSId.value, null, null, "delete");
        domElSongs.mainContainer.dataset.status = "0";
    }
    else throw new Error("Deleting a playlist returns a non-200 status code");
}

// Shuffle Button
function TurnShuffle() {
    shuffleState = !shuffleState;
    domElSgPy.playerShuffleBtn.classList.toggle("on", shuffleState);
}


// Playlist
// Playlist Grid Check
if (localStorage.getItem("pl-grid")) {
    domElPlaylist.playlistsContainer.className = localStorage.getItem("pl-grid")
}
// ---

async function OpenPlaylist(item) {
    deleteChangeState(false)
    let ItemPlId = item.querySelector(".pl-id");
    let data = await GetPlData(ItemPlId.value);
    if (data == null) throw new Error("Playlist data returned null (Code was not 200)")
    domElSongs.plDSId.value = ItemPlId.value;
    domElSongs.plDsImg.src = data.img; domElSongs.plDsTitle.innerHTML = data.name; domElSongs.plDsDesc.innerHTML = `${data.description.replaceAll("\n", "<br>")}<br><br><i>Songs - ${data.songs.length}</i>`;
    domElSongs.mainContainer.dataset.status = "1";
    domElSongs.songTableSongs.innerHTML = domElSongs.songTableSongs.children[0].children[0].innerHTML; // reset list
    data.songs.forEach((song, index) => {
        CreateSongHTML(index, song);
    });
}


async function GetPlData(plNum) {
    let req = await fetch(endpoints.playlist, {
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
        domElPlaylist.playlistsContainer.className = arg;
        localStorage.setItem("pl-grid", arg);
    }
}

// Modal Related 
function PlaylistModal(arg) {
    if (imgDefault === "") imgDefault = domElPlaylist.imgView.src;
    if (imgDefault != "") domElPlaylist.imgView.src = imgDefault;
    if (arg === "edit") { // Needs changes
        domElPlaylist.fileInput.value = null; // Reset
        modalState = [true,true]; domElPlaylist.buttonModal.disabled = false;
        domElPlaylist.fileInput.files[0] = null;
        domElPlaylist.imgView.src = domElSongs.plDsImg.src; domElPlaylist.plNameIn.value = domElSongs.plDsTitle.innerText; domElPlaylist.plDescIn.value = domElSongs.plDsDesc.innerText.substring(0, domElSongs.plDsDesc.innerText.lastIndexOf("\n\n"));
        domElPlaylist.buttonModal.setAttribute("onClick", `CreateEditPlaylist('edit', ${domElSongs.plDSId.value})`); domElPlaylist.playlistModalTitle.innerText = "Edit Playlist";
        domElPlaylist.playlistModal.style.display = "block";
    }
    else if (arg === "new") {
        domElPlaylist.fileInput.value = null; // Reset
        modalState = [false,false];
        domElPlaylist.plNameIn.value = ""; domElPlaylist.plDescIn.value = ""; domElPlaylist.buttonModal.disabled = true;
        domElPlaylist.buttonModal.setAttribute("onClick", "CreateEditPlaylist()"); domElPlaylist.playlistModalTitle.innerText = "Create Playlist";
        domElPlaylist.playlistModal.style.display = "block";
    }
    else if (arg === "close") {
        domElPlaylist.playlistModal.style.display = "none";
    }
}

domElPlaylist.fileInput.addEventListener('change', () => {
    modalState[0] = true; checkStatus();
    const file = domElPlaylist.fileInput.files[0];
    if (file == undefined) return
    if (imgDefault === "") imgDefault = domElPlaylist.imgView.src;
    const reader = new FileReader();
    reader.onload = (e) => domElPlaylist.imgView.src = e.target.result;
    reader.readAsDataURL(file);
});
domElPlaylist.plNameIn.addEventListener("change", () => {
    modalState[1] = (domElPlaylist.plNameIn.value != ""); checkStatus(); 
});

function checkStatus() {
    domElPlaylist.buttonModal.disabled = !(modalState[0] && modalState[1]);
};

// Create-Edit Playlist
function CreateEditPlaylist(type, num=null) {
    const formData = new FormData();
    let ptype
    formData.append("type", type);
    if (type === "edit") {
        formData.append("num", num);
    }
    formData.append("img", domElPlaylist.fileInput.files[0]);
    formData.append('name', domElPlaylist.plNameIn.value);
    formData.append('description', domElPlaylist.plDescIn.value);
    if (domElPlaylist.fileInput.files[0] == null) {ptype = "application/json"} else {ptype = domElPlaylist.fileInput.files[0].contentType}
    const requestOptions = {
        headers: {
            "Content-Type": ptype,
        },
        mode: "no-cors",
        method: "POST",
        files: domElPlaylist.fileInput.files[0],
        body: formData,
    };
    fetch(endpoints.playlist, requestOptions).then((response) => {
        response.json().then((data) => {
            if (type != "edit") {CreatePlHTML(data.plSrc, data.plName, data.plNum);}
            else {
                // Img
                if (domElPlaylist.fileInput.files[0] != null) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        domElSongs.plDsImg.src = e.target.result
                        EditPlsHTML(num, e.target.result, null)
                    };
                    reader.readAsDataURL(domElPlaylist.fileInput.files[0]);
                }
                // Title + Desc
                domElSongs.plDsTitle.innerText = domElPlaylist.plNameIn.value; domElSongs.plDsDesc.innerHTML = domElPlaylist.plDescIn.value.replaceAll("\n","<br>") + domElSongs.plDsDesc.innerHTML.slice(domElSongs.plDsDesc.innerHTML.lastIndexOf("<br><br>")-domElSongs.plDsDesc.innerHTML.length);
                EditPlsHTML(num, null, domElPlaylist.plNameIn.value)
            }
        });
    });
    PlaylistModal('close')
}
function EditPlsHTML(id, srcNew, titleNew, type=null) {
    playlistsLs = domElPlaylist.playlistsContainer.getElementsByClassName("pl-item");
    for (let i = 0; i < playlistsLs.length; i++) {
        element = playlistsLs[i];
        if (element.querySelector(".pl-id").value == id) {
            if (type == null) {
                if (srcNew != null) element.querySelector(".pl-img").src = srcNew;
                if (titleNew != null) element.querySelector(".pl-text").innerText = titleNew;
            } else if (type == "delete") domElPlaylist.playlistsContainer.removeChild(element);
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
    domElPlaylist.playlistsContainer.appendChild(divMain);
}
