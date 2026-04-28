/* --- Config --- */
let RPCEnabled = true; 
let maxIcoSize = 10 // Max Playlist Ico Size in MB
let animationSongs = 20 // Start animation limit
/* --- Variables --- */
// Songs Related
let nDownload = 0;
let oldSong = [];
let oldVolume = 1;
let playingPl = [null, []]; //plId (str), <list>(index, idsong) - for the current playing playlist

nextSongId = null

let currentSongs = [] // List off songs - used for the animation when opening a playlist
let shuffleState = false;

// Modal Related
let modalState = [false,false];
let imgDefault = "";

const domElSgPy = { // Song Player Elements
    playerSongTitle: document.getElementById("playerTitle"),
    playerSongImg: document.getElementById("playerImg"),

    shuffleBtn: document.getElementById("shuffle-btn"),
    prevBtn: document.getElementById("prev-btn"),
    playStopBtn: document.getElementById("play-stop-btn"), playerStateImg: document.getElementById("play-stop-img"),
    nextBtn: document.getElementById("next-btn"),
    loopBtn: document.getElementById("loop-btn"),

    volumeRange: document.getElementById("volumeRange"), volumeImg: document.getElementById("mute-img"),

    currentDuration: document.getElementById("cur-duration"),
    maxDuration: document.getElementById("max-duration"),

    playerRange: document.getElementById("playerRange")
    
}
const domElSongs = { // Songs Elements
    mainContainer: document.getElementById("mainContainer"),
    songContainer: document.getElementById("songCtn"),

    audioControll: document.getElementById("AudioControll"),
    audioPreloader: new Audio(),

    songTableSongs: document.getElementById("songs-table"),

    addSongInput: document.getElementById("songs-input"),

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


// ------------------------
// Songs Managment
// ------------------------

/**
 * Removes a song, from the server and from the HTML page
 * @param {string} value HTML DOM Element of the song
 */
async function deleteSong(value) {
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
        // Removes the deleted song from the playlist
        if (domElSongs.plDSId.value == playingPl[0]) 
            playingPl[1].pop(idSong)

        if (nextSongId == idSong) // Resets Preload data (if the song deleted was the next song that needed to be played)
            nextSongId = chooseSong(idSong);

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

/**
 * Adds a song or playlist to the server and to the HTML page using the `domElSongs.addSongInput` value
 */
async function addSong() {
    nDownload += 1;
    let songName = domElSongs.addSongInput.value; domElSongs.addSongInput.value = ""; domElSongs.addSongInput.placeholder = `Downloading - ${nDownload}...`
    let startPl = domElSongs.plDSId.value;
    // domElSongs.addSongInput.disabled = true;
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: startPl, type: "add", sname: songName}),
    });

    // Update Download Placeholder
    nDownload -= 1
    if (nDownload == 0) domElSongs.addSongInput.placeholder = "YT name/link...";
    else domElSongs.addSongInput.placeholder = `Downloading - ${nDownload}...`;

    if (req.status == 200) {
        indexStart = domElSongs.songTableSongs.querySelectorAll(".songTcontainer").length

        let json = JSON.parse(await req.text());
        if (startPl == domElSongs.plDSId.value) {
            json.nwSongs.forEach((song, index) => {
                createSongHTML(indexStart+index, song)
            });
            domElSongs.plDsDesc.innerHTML = domElSongs.plDsDesc.innerHTML.replace(/( - )(.*?)(<\/i>)/, "$1" + (Number(indexStart)+Number(json.nwSongs.length)) + "$3");
        }
        
        if (startPl == playingPl[0]) {
            json.nwSongs.forEach(song => {
                playingPl[1].push(song[0])
            });
            if (nextSongId == playingPl[0]) { // If the current playlist is the one that is being added, it updates the next song to play (if the next song was the last one, it becomes the first of the new songs)
                nextSongId = chooseSong(nextSongId);
                preloadSong();
            }
        }
    }
    else throw new Error("Adding a song returns a non-200 status code");
}

/**
 * Gets a song data from the server, given its ID
 * @param {string | number} songId 
 * @returns The song data list [songName, authorName, imageUrl, date, duration, songUrl, idPlaylist]
 */
async function getSongData(songId) {
    let req = await fetch(endpoints.songs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            type: "get",
            index: songId,
        }),
    })
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        return json.song
    }
    else throw new Error("Getting a song returns a non-200 status code");
}

/**
 * Plays a song
 * @param {string} sgId The ID of the song to play
 */
async function playSong(songId) {
    // Reset Preload Data
    nextSongId = null;

    // Gets Song Data
    domElSgPy.playerRange.disabled = true; // Disables the audio range until the song data is loaded and the duration is set (to avoid bugs with the range max value)
    let songData = await getSongData(songId);
    let url = songData[5], name = songData[0], artist = songData[1], img = songData[2], playlistId = songData[6].toString();


    // Play Song
    domElSongs.audioControll.src = url; 
    await domElSongs.audioControll.play();


    // Update Old Songs
    oldSong.push(songId);
    if (oldSong.length >= 3) {
        oldSong.splice(0, 1)
    }


    // Media Session
    setMS(name, artist, img);


    // Player Setup
    domElSgPy.playerStateImg.src = endpoints.stopIco;

    domElSgPy.playerSongImg.src = img; domElSgPy.playerSongTitle.innerText = name;

    domElSgPy.playerRange.value = 0; domElSgPy.playerRange.max = domElSongs.audioControll.duration; domElSgPy.maxDuration.innerHTML = formatTime(domElSongs.audioControll.duration);
    domElSongs.audioControll.currentTime = 0;
    if (domElSgPy.playerRange.disabled) 
        domElSgPy.playerRange.disabled = false;


    if (domElSongs.mainContainer.dataset.play == "0") {
        domElSongs.mainContainer.dataset.play = "1"
    }


    // Update Playing Playlist Data
    if (playingPl[0] != playlistId) {
        playingPl[0] = playlistId;
        playingPl[1] = [];
        let songList = await getPlData(playingPl[0]);
        songList.songs.forEach(song => {
            playingPl[1].push(song[0])
        });
    }


    // Preload next song
    nextSongId = chooseSong(songId)
    preloadSong(); 


    // Loads DiscordRPC
    if (RPCEnabled)
        RPCDiscord(name, artist, img, domElSongs.audioControll.duration)
}

/**
 * Chooses the next song to play
 * @param {string} songId The ID of the current song
 * @returns {string} The ID of the chosen song
 */
function chooseSong(songId) {
    id = playingPl[1].indexOf( parseInt(songId) ) // 0
    let i = id+1;
    let length = playingPl[1].length - 1;

    if (shuffleState && length >= 1) {i = Math.floor(Math.random() * length)}
    if (i == id) { // If the random song is the same as the current one, it chooses the next one (or the previous one if it's the last song)
        if (i+1>length) 
            i--
        else 
            i++;
    }
    if (i > length) {i = 0}; // Ricomincia

    return playingPl[1][i];
}

/**
 * Preloads a song
 * @param {string | number | void} songId 
 */
async function preloadSong(songId=nextSongId) { // id == idSong
    if (songId != null) {
        songId = chooseSong(songId)
    }
    let songData = await getSongData(songId);

    domElSongs.audioPreloader.src = songData[5]; // Preload (songData[5] == url)
    domElSongs.audioPreloader.preload = "auto";
    domElSongs.audioPreloader.load();

    preloadedSongId = songId;   
}

/**
 * Plays the next song
 */
async function nextSong() {
    if (nextSongId != null) {
        await playSong(nextSongId);
    }
}

async function prevSong() {
    await playSong(oldSong[0]);
    oldSong.splice(1, 1);
}



// ------------------------
// Playlists Managment
// ------------------------

/**
 * Deletes a playlist, removing it from the server and from the HTML page. If the deleted playlist is the currently playing one, it also resets the music player
 */
async function deletePlaylist() {
    if (playingPl[0] == domElSongs.plDSId.value) {
        // Reset Music Player
        domElSongs.mainContainer.dataset.play = "0";
        if (domElSongs.audioControll.playing)
            await domElSongs.audioControll.pause();
        domElSongs.audioControll.src = "";
        // Resets Values
        nextSongId = null; playingPl = [null, []]; oldSong = [];
    }
    let req = await fetch(endpoints.playlist, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({num: domElSongs.plDSId.value, type: "delete"}),
    });
    if (req.status == 200) {
        editPlHTML(domElSongs.plDSId.value, null, null, "delete");
        domElSongs.mainContainer.dataset.status = "0";
    }
    else throw new Error("Deleting a playlist returns a non-200 status code");
}

/**
 * Opens a playlist, displaying its songs in the HTML page
 * @param {Object} item The HTML element representing the playlist to open
 */
async function openPlaylist(item) {
    function addRemainingSongs() {
        for (let i = animationSongs; i < currentSongs.length; i++) {
            createSongHTML(i, currentSongs[i]);
        }
        currentSongs = null
    }

    deleteChangeState(false)
    let ItemPlId = item.querySelector(".pl-id");
    let data = await getPlData(ItemPlId.value);
    if (data == null) throw new Error("Playlist data returned null (Code was not 200)")
    
    currentSongs = data.songs;

    domElSongs.plDSId.value = ItemPlId.value;
    domElSongs.plDsImg.src = data.playlist[2];
    domElSongs.plDsTitle.innerHTML = data.playlist[0];
    domElSongs.plDsDesc.innerHTML = `${data.playlist[1].replaceAll("\n", "<br>")}<br><br><i>Songs - ${currentSongs.length}</i>`;

    domElSongs.songTableSongs.innerHTML = null; // reset list
    for (let i = 0; i < animationSongs; i++) { // Add n.(animationSongs) of songs
        createSongHTML(i, currentSongs[i]);
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

/**
 * Closes the playlist, hiding the songs and resetting the playlist details in the HTML page
 */
function closePlaylist() {
    domElSongs.mainContainer.classList.add('animation');
    domElSongs.mainContainer.dataset.status = '0'
    domElSongs.mainContainer.addEventListener("transitionend", () => {
        domElSongs.mainContainer.classList.remove('animation');
    }, { once: true });
}

// Must be changed
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
            if (type != "edit") {createPlHTML(data.plSrc, data.plName, data.plNum);}
            else {
                // Img
                if (domElPlaylist.fileInput.files[0] != null) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        domElSongs.plDsImg.src = e.target.result
                        editPlHTML(num, e.target.result, null)
                    };
                    reader.readAsDataURL(domElPlaylist.fileInput.files[0]);
                }
                // Title + Desc
                domElSongs.plDsTitle.innerText = domElPlaylist.plNameIn.value; domElSongs.plDsDesc.innerHTML = domElPlaylist.plDescIn.value.replaceAll("\n","<br>") + domElSongs.plDsDesc.innerHTML.slice(domElSongs.plDsDesc.innerHTML.lastIndexOf("<br><br>")-domElSongs.plDsDesc.innerHTML.length);
                editPlHTML(num, null, domElPlaylist.plNameIn.value)
            }
        });
    });
    PlaylistModal('close')
}

let deleteTimeout = null;
/**
 * Sets the delete playlist button in a "confirm delete" state, where if the user clicks it again within 5 seconds, the playlist will be deleted. After 5 seconds, it resets to the normal state
 * @param {boolean | void} fstate 
 */
function deleteChangeState(fstate=null) {
    let stateDel = (!domElPlaylist.delPlButton.classList.contains("clicked-del") && fstate==null) || fstate == true
    domElPlaylist.delPlButton.classList.toggle("clicked-del", stateDel);
    if (stateDel)
        domElPlaylist.delPlButton.setAttribute("onClick", "deleteChangeState(); deletePlaylist()")
    else
        domElPlaylist.delPlButton.setAttribute("onClick", "deleteChangeState()")
    clearTimeout(deleteTimeout);
    deleteTimeout = setTimeout(() => {deleteChangeState(false)}, 5000); // after 5 seconds
}

// Playlist Menu functions
menuStateCode = 0 // 0 Closed - 1 Open Add Song - 2 Open Search
function MenuAction() {
    if (menuStateCode == 1)
        addSong()
    else if (menuStateCode == 2) {
        window.find(
            domElSongs.addSongInput.value,
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
    domElSongs.addSongInput.value = '';
    if (menuStateCode == code && domElSongs.addSongInput.style.display != "none") { // Fade Out
        code = 0;
        domElSongs.addSongInput.classList.add("animate", "out");
        domElSongs.addSongInput.addEventListener("animationend", () => {
            domElSongs.addSongInput.classList.remove("animate", "out");
            domElSongs.addSongInput.style.display = "none";
        }, { once: true });
    } else if (domElSongs.addSongInput.style.display == "none" && !domElSongs.addSongInput.classList.contains("animate")) { // Fade In
        domElSongs.addSongInput.style.display = "block";
        domElSongs.addSongInput.classList.add("animate");
    }
    menuStateCode = code

    if (code == 1) { // Open Song
        if (nDownload == 0) domElSongs.addSongInput.placeholder = "YT name/link...";
        else domElSongs.addSongInput.placeholder = `Downloading - ${nDownload}...`;
    } else if (code == 2) {
        domElSongs.addSongInput.placeholder = "Press Enter to search"
    }
}




// ------------------------
// HTML Creators Functions
// ------------------------

// Song Related
/**
 * Creates the song row in the HTML playlist table
 * @param {number} index Index of the song (for the index column in the table)
 * @param {[number, string, string, string, string]} values Values of the song (songId, songName, authorName, imageUrl, date, duration)
 */
function createSongHTML(index, values) {
    if (values == undefined) return // Fix animation preload limit

    let trElement = document.createElement("tr"); trElement.className = "songTcontainer";
    trElement.setAttribute("onclick", `playSong(this.dataset.songId);`);
    trElement.dataset.songId = values[0];

    trElement.innerHTML = `
    <td data-visible="0">
        <p>${index + 1}</p>
    </td>
    <td>
        <div class="titleSong-column">
            <img loading="lazy" src="${values[3]}">
            <p>${values[1]}</p>
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
        <button onclick="event.stopPropagation(); deleteSong(this)" class="songTable-delete">
            <img src="${endpoints.deleteIco}">
        </button>
    </td>
    `;
    domElSongs.songTableSongs.appendChild(trElement);
}

// Playlist Related
/**
 * Edits/Removes a playlist HTML element
 * @param {number} id Playlist Id
 * @param {string} srcNew Playlist Image url
 * @param {string} titleNew Playlist new Title
 * @param {string} [type=null] Used to know the action of this function, can be null (edit playlist) or 'delete' (delete playlist)
 */
function editPlHTML(id, srcNew, titleNew, type=null) {
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

/** 
 * Creates the playlist HTML element (for the playlist selection section)
 * @param {string} imgSrc Playlist Thumb Image url
 * @param {string} plName Playlist Name
 * @param {number | string} plNum Playlist ID
 */
async function createPlHTML(imgSrc, plName, plNum) {
    let divMain = document.createElement("div");
    divMain.className = "pl-item";
    divMain.setAttribute("onClick", "openPlaylist(this)");
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
async function getPlData(plNum) {
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





// ------------------------
// Media Session
// ------------------------

// Media Session Event Listeners
domElSongs.audioControll.addEventListener("play", () => {updateMSBtn(); updatePositionState()});
domElSongs.audioControll.addEventListener("pause", () => {updateMSBtn(); updatePositionState()});
domElSongs.audioControll.addEventListener("seeking", updatePositionState);

domElSongs.audioControll.addEventListener("ratechange", updatePositionState);
domElSongs.audioControll.addEventListener("loadedmetadata", updatePositionState);
domElSongs.audioControll.addEventListener("timeupdate", updatePositionState);

/**
 * Updates the Media Session Button (Play/Pause) and the normal Play/Pause button in the HTML page, based on the current state of the audio (playing or paused)
 */
function updateMSBtn() { // Update Media Session Button
    if (!domElSongs.audioControll.paused) {
        navigator.mediaSession.playbackState = "playing";
        domElSgPy.playerStateImg.src = endpoints.stopIco;
    }
    else {
        navigator.mediaSession.playbackState = "paused";
        domElSgPy.playerStateImg.src = endpoints.playIco;
    };
}

/**
 * Updates the position state (audio time bar) of the media session
 */
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

/**
 * Sets the Media Session metadata and action handlers
 * @param {string} title Song Name
 * @param {string} artist Artist Name
 * @param {string} img Image URL
 */
async function setMS(title, artist, img) {
    if ('mediaSession' in navigator) {
        if (navigator.mediaSession.metadata == null) {
            navigator.mediaSession.metadata = new MediaMetadata();
            navigator.mediaSession.setActionHandler('play', () => {domElSongs.audioControll.play()});  
            navigator.mediaSession.setActionHandler('pause', () => {domElSongs.audioControll.pause()});
            navigator.mediaSession.setActionHandler('nexttrack', async () => {await nextSong()});
            navigator.mediaSession.setActionHandler('previoustrack', async () => {await prevSong()});
            navigator.mediaSession.setActionHandler("seekbackward", (details) => {Seek(false, details)});
            navigator.mediaSession.setActionHandler("seekforward", (details) => {Seek(true, details)});
        }
        navigator.mediaSession.metadata.title = title;
        navigator.mediaSession.metadata.artist = artist;
        navigator.mediaSession.metadata.album = domElSongs.plDsTitle.innerText;
        navigator.mediaSession.metadata.artwork = [{ src: img, sizes: "512x512", type: "image/png" }];
    }
}





// ------------------------
// Music Player
// ------------------------

// Event Listeners
domElSgPy.shuffleBtn.addEventListener("click", () => {
    TurnShuffle();
});
domElSgPy.prevBtn.addEventListener("click", async () => {
    await prevSong();
});
domElSgPy.playStopBtn.addEventListener("click", () => {
    startStopAudio();
});
domElSgPy.nextBtn.addEventListener("click", async () => {
    await nextSong();
});
domElSgPy.loopBtn.addEventListener("click", () => {
    LoopToogle()
});

domElSgPy.volumeImg.addEventListener("click", () => {
    ChangeVolume(true, 0)
});
domElSgPy.volumeRange.addEventListener("input", () => {
    ChangeVolume(false, domElSgPy.volumeRange.value)
});

domElSongs.audioControll.addEventListener('timeupdate', () => {
  if (domElSongs.audioControll.duration) {
    domElSgPy.playerRange.value = domElSongs.audioControll.currentTime;
    domElSgPy.playerRange.style.setProperty('--range-progress-width', `${(domElSgPy.playerRange.value - domElSgPy.playerRange.min) / (domElSgPy.playerRange.max - domElSgPy.playerRange.min) * 100}%`);
    domElSgPy.currentDuration.innerHTML = formatTime(domElSongs.audioControll.currentTime);
  }
});
domElSongs.audioControll.addEventListener('ended', () => {
    playSong(nextSongId);
});

/**
 * Formats the time in seconds to a MM:SS string
 * @param {number} seconds 
 * @returns {string} The formatted time string
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Toggles the play/pause state of the audio player
 */
function startStopAudio() { // Pause Button
    if (domElSongs.audioControll.paused)
        domElSongs.audioControll.play()
    else 
        domElSongs.audioControll.pause()
}

/**
 * Changes the volume of the audio player
 * @param {boolean} mute Whether to mute the audio
 * @param {number} value The volume level (0 to 1)
 */
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
    if (value == 0) domElSgPy.volumeImg.src = endpoints.muteIco
    else domElSgPy.volumeImg.src = endpoints.volumeIco;
}

/**
 * Toggles the loop state of the audio player
 */
function LoopToogle() {
    domElSongs.audioControll.loop = !domElSongs.audioControll.loop;
    domElSgPy.loopBtn.classList.toggle("on", domElSongs.audioControll.loop);
}

/**
 * (Used primarily by Media Session) Seeks to a specific time in the audio player
 * @param {boolean} add Whether to seek forward (true) or backward (false)
 * @param {Object} details The details for the seek action
 */
function Seek(add, details) {
    const skipTime = details.seekOffset || 10;
    if (add) domElSongs.audioControll.currentTime = Math.min(domElSongs.audioControll.currentTime + skipTime, domElSongs.audioControll.duration);
    else domElSongs.audioControll.currentTime = Math.min(domElSongs.audioControll.currentTime - skipTime, 0);
}

/**
 * Toggles the shuffle state of the playlist, and preloads the next song based on the new shuffle state
 */
function TurnShuffle() {
    shuffleState = !shuffleState;
    nextSongId = chooseSong(oldSong[oldSong.length-1])
    preloadSong(); 
    domElSgPy.shuffleBtn.classList.toggle("on", shuffleState);
}





// ------------------------
// Playlist Grid/Details View
// ------------------------
if (localStorage.getItem("pl-grid")) {
    domElPlaylist.playlistsContainer.className = localStorage.getItem("pl-grid")
}

function GridChangePlaylist(arg) { // 'playlists-details' or 'playlists-grid'
    if (arg == 'playlists-details' || arg == 'playlists-grid') {
        domElPlaylist.playlistsContainer.className = arg;
        localStorage.setItem("pl-grid", arg);
    }
}





// ------------------------
// Playlist Modal
// ------------------------

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

function checkStatus() {
    domElPlaylist.buttonModal.disabled = !(modalState[0] && modalState[1]);
};





// ------------------------
// Discord RPC
// ------------------------

/**
 * Sends a POST request to the Discord RPC endpoint with the current song information to update the Discord Rich Presence status
 * @param {string} name The name of the song
 * @param {string} artist The artist of the song
 * @param {string} img The image URL of the song
 * @param {number} duration The duration of the song in seconds
 */
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
    }).then(data => {
    }).catch((error) => {
        if (error instanceof TypeError) {
            console.debug("[DEBUG] Discord RPC disabled, no RPC server detected");
            RPCEnabled = false;
        }
    })
}