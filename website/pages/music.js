/* --- Config --- */
const RPCEnabled = false;
let maxIcoSize = 10 // Max Playlist Ico Size in MB
let animationSongs = 20 // Start animation limit
/* --- Variables --- */
// Songs Related
let nDownload = 0;
let oldSong = [];
let oldVolume = 1;
let currentPl = [null, null]; //plId (str), plIdLenght (str)
let preloadData = ["", "", "", "", 0] // struct ["url", "name", "artist", "img", 0]
let currentSongs = [] // List off songs
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
    songContainer: document.getElementById("songCtn"),

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
    plError: document.getElementById("pl-error"),

    fileInput: document.getElementById("img-file"),
    imgView: document.getElementById("modal-pl-img"),

    playlistModal: document.getElementById("playlist-modal"),
    playlistModalTitle: document.getElementById("modal-pl-title"),
    buttonModal: document.getElementById("pl-btn"),
    
    delPlButton: document.getElementById("del-pl-btn"),
}
const endpoints = {
    discordRPC: "http://127.0.0.1:8765/rpc",

    songs: "/songs",
    playlist: "/playlist",
    
    playIco: "/website/img/play-ico.svg",
    stopIco: "/website/img/stop-ico.svg",
    muteIco: "/website/img/mute-ico.svg",
    volumeIco: "/website/img/volume-ico.svg",
    deleteIco: "/website/img/delete-ico.svg"
}

/* --- Functions --- */
// Songs Player
async function DeleteSong(value) {
    const songContainer = value.parentElement.parentElement
    
    let idSong = songContainer.dataset.songId;
    let index = songContainer.children[0].innerText;

    if (idSong == oldSong[oldSong.length-1]) {
        oldSong.pop();
        domElSongs.mainContainer.dataset.play = "0";
        if (domElSongs.audioControll.playing)
            await domElSongs.audioControll.pause();
        domElSongs.audioControll.src = "";
    }
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "delete", index: idSong}),
    });
    if (req.status == 200) {
        if (domElSongs.plDSId.value == currentPl[0]) // Decrease the playlist songs number (if the song deleted is into the current open playlist)
            currentPl[1] -= 1;
        if (preloadData[4] == idSong) // Resets Preload data (if the song deleted was the next song that needed to be played)
            preloadData = ["", "", "", "", 0];

        songContainer.parentElement.removeChild(songContainer);

        // Decreases by one the indexes higher than the index of the deleted song
        let ls = domElSongs.songTableSongs.getElementsByClassName("songTcontainer")
        for (let i = 0; i < ls.length; i++) {
            if (Number(ls[i].children[0].children[0].innerText)>Number(index)) 
                ls[i].children[0].children[0].innerText = (Number(ls[i].children[0].innerText) - 1).toString()
        };
        domElSongs.plDsDesc.innerHTML = domElSongs.plDsDesc.innerHTML.replace(/( - )(.*?)(<\/i>)/, "$1" + Number(domElSongs.songTableSongs.querySelectorAll(".songTcontainer").length) + "$3");
    }
    else throw new Error("Getting a song returns a non-200 status code");
}
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}
function StartStopAudio() { // Pause Button
    if (domElSongs.audioControll.paused)
        domElSongs.audioControll.play()
    else 
        domElSongs.audioControll.pause()
}
function UpdateMSBtn() { // Update Media Session Button
    if (!domElSongs.audioControll.paused) {
        navigator.mediaSession.playbackState = "playing";
        domElSgPy.playerStateImg.src = endpoints.stopIco;
    }
    else {
        navigator.mediaSession.playbackState = "paused";
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
        navigator.mediaSession.setActionHandler('play', () => {domElSongs.audioControll.play()});  
        navigator.mediaSession.setActionHandler('pause', () => {domElSongs.audioControll.pause()});
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
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "get", index: sgId}),
    });
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        PlaySong(json.song[5], json.song[0], json.song[1], json.song[2], sgId)
    }
    else throw new Error("Getting a song returns a non-200 status code");
}

function RPCDiscord(name, artist, img, duration) {
    fetch(endpoints.discordRPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: name,
            artist: artist,
            img: img,
            duration: duration
        })
    });
}

async function PlaySong(url, name, artist, img, songId) {
    if (domElSongs.mainContainer.dataset.play == "0") {
        domElSongs.mainContainer.dataset.play = "1"
    }
    oldSong.push(songId); // idSong
    if (oldSong.length >= 3) {
        oldSong.splice(0, 1)
    }
    domElSongs.audioControll.src = url; 
    await domElSongs.audioControll.play();
    setPWA(name, artist, img);
    
    domElSgPy.playerStateImg.src = endpoints.stopIco; PreloadSong(songId); // Play and preload next song

    domElSongs.audioControll.currentTime = 0;
    domElSgPy.playerRange.value = 0; domElSgPy.playerRange.max = domElSongs.audioControll.duration; domElSgPy.maxDuration.innerHTML = formatTime(domElSongs.audioControll.duration);
    if (domElSgPy.playerRange.disabled) domElSgPy.playerRange.disabled = false;
    // Player Setup
    domElSgPy.playerSongImg.src = img; domElSgPy.playerSongTitle.innerText = name;
    // Loads DiscordRPC
    if (RPCEnabled)
        RPCDiscord(name, artist, img, domElSongs.audioControll.duration)
}

// Media Session
domElSongs.audioControll.addEventListener("play", () => {UpdateMSBtn(); updatePositionState()});
domElSongs.audioControll.addEventListener("pause", () => {UpdateMSBtn(); updatePositionState()});
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

async function PreloadSong(songId) { // id == idSong
    // Song Id -> Elements Index
    let id 
    try {id = domElSongs.songTableSongs.querySelector(`.songTcontainer[data-song-id="${songId}"]`).children[0].children[0].innerHTML - 1;}
    catch {
        console.log(`(Error) While preloading => (${id})`)
        id = 0
    }

    // Next Song (Elements Index)
    let i = id+1;
    let length = currentPl[1];
    if (shuffleState && length >= 1) {i = Math.floor(Math.random() * length)}
    if (i == id) { if (i+1>length) {i--} else {i++};} // Evita che appaia lo stesso numero
    if (i > length) {i = 0}; // Ricomincia
    // Elements Index -> Song Id
    let newSongId = domElSongs.songTableSongs.querySelectorAll(".songTcontainer")[i].dataset.songId;
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            num: currentPl[0],
            type: "get",
            index: newSongId,
        }),
    })
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        domElSongs.audioPreload.src = json.song[5]; // Preload
        preloadData = [json.song[5], json.song[0], json.song[1], json.song[2], newSongId]
    }
    else throw new Error("Getting a song (preload funct) returns a non-200 status code");
}
// Song Html
function CreateSongHTML(index, values) {
    if (values == undefined) return // Fix animation preload limit

    let trElement = document.createElement("tr"); trElement.className = "songTcontainer";
    trElement.setAttribute("onclick", `FetchSong(this.dataset.songId);`);
    trElement.dataset.songId = values[0];

    songName = values[1]

    trElement.innerHTML = `
    <td data-visible="0">
        <p>${index + 1}</p>
    </td>
    <td>
        <div class="titleSong-column">
            <img loading="lazy" src="${values[3]}">
            <p>${songName}</p>
        </div>
    </td>
    <td data-visible="0">
        <p>${values[2]}</p>
    </td>
    <td data-visible="0">
        <p>${values[4]}</p>
    </td>
    <td data-visible="0">
        <p>${values[5]}</p>
    </td>
    <td style="text-align: right;">
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
    let startPl = domElSongs.plDSId.value;
    // domElSongs.addsongInput.disabled = true;
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: startPl, type: "add", sname: songName}),
    });

    // Update Download Placeholder
    nDownload -= 1
    if (nDownload == 0) domElSongs.addsongInput.placeholder = "YT name/link...";
    else domElSongs.addsongInput.placeholder = `Downloading - ${nDownload}...`;

    if (req.status == 200) {
        indexStart = domElSongs.songTableSongs.querySelectorAll(".songTcontainer").length

        if (domElSongs.plDSId.value == currentPl[0]) currentPl[1] += 1
        let json = JSON.parse(await req.text());
        if (startPl == domElSongs.plDSId.value) {
            json.nwSongs.forEach((song, index) => {
                CreateSongHTML(indexStart+index, song)
            });
            if (preloadData[4] == '1') PreloadSong(oldSong[oldSong.length-1]);
            domElSongs.plDsDesc.innerHTML = domElSongs.plDsDesc.innerHTML.replace(/( - )(.*?)(<\/i>)/, "$1" + (Number(indexStart)+Number(json.nwSongs.length)) + "$3");
        }
    }
    else throw new Error("Adding a song returns a non-200 status code");
}

menuStateCode = 0 // 0 Closed - 1 Open Add Song - 2 Open Search
function MenuAction() {
    if (menuStateCode == 1)
        AddSong()
    else if (menuStateCode == 2) {
        window.find(
            domElSongs.addsongInput.value,
            false, false, true, false, true, true
        )
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            selection.getRangeAt(0).startContainer.parentElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }
}
function OpenMenu(code) {
    domElSongs.addsongInput.value = '';
    if (menuStateCode == code && domElSongs.addsongInput.style.display != "none") { // Fade Out
        code = 0;
        domElSongs.addsongInput.classList.add("animate", "out");
        domElSongs.addsongInput.addEventListener("animationend", () => {
            domElSongs.addsongInput.classList.remove("animate", "out");
            domElSongs.addsongInput.style.display = "none";
        }, { once: true });
    } else if (domElSongs.addsongInput.style.display == "none" && !domElSongs.addsongInput.classList.contains("animate")) { // Fade In
        domElSongs.addsongInput.style.display = "block";
        domElSongs.addsongInput.classList.add("animate");
    }
    menuStateCode = code

    if (code == 1) { // Open Song
        if (nDownload == 0) domElSongs.addsongInput.placeholder = "YT name/link...";
        else domElSongs.addsongInput.placeholder = `Downloading - ${nDownload}...`;
    } else if (code == 2) {
        domElSongs.addsongInput.placeholder = "Press Enter to search"
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
    if (currentPl[0] == domElSongs.plDSId.value) {
        // Reset Music Player
        domElSongs.mainContainer.dataset.play = "0";
        if (domElSongs.audioControll.playing)
            await domElSongs.audioControll.pause();
        domElSongs.audioControll.src = "";
        // Resets Values
        preloadData = ["", "", "", "", 0]; currentPl = [null, null]; oldSong = [];
    }
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
    PreloadSong(oldSong[oldSong.length-1]); 
    domElSgPy.playerShuffleBtn.classList.toggle("on", shuffleState);
}


// Playlist
// Playlist Grid Check
if (localStorage.getItem("pl-grid")) {
    domElPlaylist.playlistsContainer.className = localStorage.getItem("pl-grid")
}
// ---
function addRemainingSongs() {
    for (let i = animationSongs; i < currentSongs.length; i++) {
        CreateSongHTML(i, currentSongs[i]);
    }
    currentSongs = null
}

async function OpenPlaylist(item) {
    deleteChangeState(false)
    let ItemPlId = item.querySelector(".pl-id");
    let data = await GetPlData(ItemPlId.value);
    if (data == null) throw new Error("Playlist data returned null (Code was not 200)")
    
    currentSongs = data.songs;
    currentPl[1] = currentSongs.length - 1;

    domElSongs.plDSId.value = ItemPlId.value;
    domElSongs.plDsImg.src = data.playlist[2];
    domElSongs.plDsTitle.innerHTML = data.playlist[0];
    domElSongs.plDsDesc.innerHTML = `${data.playlist[1].replaceAll("\n", "<br>")}<br><br><i>Songs - ${currentSongs.length}</i>`;

    domElSongs.songTableSongs.innerHTML = null; // reset list
    for (let i = 0; i < animationSongs; i++) { // Add n.(animationSongs) of songs
        CreateSongHTML(i, currentSongs[i]);
    }
    domElSongs.songContainer.scrollTo({ top: 0 }); // Scrolls to the top (instantly)
    // Animation Fix
    if (domElSongs.mainContainer.dataset.status == "0" && !window.matchMedia("(max-width: 1003px)").matches) {
        domElSongs.mainContainer.classList.add('animation');
        domElSongs.mainContainer.addEventListener("transitionend", () => {
            addRemainingSongs();
            domElSongs.mainContainer.classList.remove('animation');
        }, { once: true });
    } else addRemainingSongs()

    domElSongs.mainContainer.dataset.status = "1";
}

function closePlaylist() {
    domElSongs.mainContainer.classList.add('animation');
    domElSongs.mainContainer.dataset.status = '0'
    domElSongs.mainContainer.addEventListener("transitionend", () => {
        domElSongs.mainContainer.classList.remove('animation');
    }, { once: true });
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
        domElPlaylist.imgView.dataset.state = "1"; domElPlaylist.fileInput.value = null; // Reset
        modalState = [true,true]; domElPlaylist.buttonModal.disabled = false;
        domElPlaylist.fileInput.files[0] = null;
        domElPlaylist.imgView.src = domElSongs.plDsImg.src; domElPlaylist.plNameIn.value = domElSongs.plDsTitle.innerText; domElPlaylist.plDescIn.value = domElSongs.plDsDesc.innerText.substring(0, domElSongs.plDsDesc.innerText.lastIndexOf("\n\n"));
        domElPlaylist.buttonModal.setAttribute("onClick", `CreateEditPlaylist('edit', ${domElSongs.plDSId.value})`); domElPlaylist.playlistModalTitle.innerText = "Edit Playlist";
        domElPlaylist.playlistModal.style.display = "flex";
    }
    else if (arg === "new") {
        domElPlaylist.imgView.dataset.state = "0"; domElPlaylist.fileInput.value = null; // Reset
        modalState = [false,false];
        domElPlaylist.plNameIn.value = ""; domElPlaylist.plDescIn.value = ""; domElPlaylist.buttonModal.disabled = true;
        domElPlaylist.buttonModal.setAttribute("onClick", "CreateEditPlaylist()"); domElPlaylist.playlistModalTitle.innerText = "Create Playlist";
        domElPlaylist.playlistModal.style.display = "flex";
    }
    else if (arg === "close") {
        domElPlaylist.playlistModal.style.display = "none";
    }
}

domElPlaylist.fileInput.addEventListener('change', () => {
    const file = domElPlaylist.fileInput.files[0];
    if (file == undefined) return
    if (imgDefault === "") imgDefault = domElPlaylist.imgView.src;

    if (domElPlaylist.fileInput.files[0].size > maxIcoSize*(10**6)) {
        domElPlaylist.plError.textContent = `Error, icon file size should be lesser or equal to ${maxIcoSize} MB`;
        return;
    }
    domElPlaylist.plError.textContent = null;

    modalState[0] = true; checkStatus();

    const reader = new FileReader();
    reader.onload = (e) => {
        domElPlaylist.imgView.dataset.state = "1"
        domElPlaylist.imgView.src = e.target.result;
    }
    reader.readAsDataURL(file);
});
domElPlaylist.plNameIn.addEventListener("keyup", () => {
    modalState[1] = (domElPlaylist.plNameIn.value != ""); checkStatus(); 
});

function checkStatus() {
    domElPlaylist.buttonModal.disabled = !(modalState[0] && modalState[1]);
};

// Create-Edit Playlist
function CreateEditPlaylist(type, num=null) {
    if (domElPlaylist.fileInput.files[0].size > maxIcoSize*(10**6)) return
    
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
