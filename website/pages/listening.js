const playerAudio = document.getElementById("playerAudio");

const playerTitle = document.getElementById("songTitle");

const controllBtn = document.getElementById("controll-btn");

const playerRange = document.getElementById("playerRange");
const playerCurr = document.getElementById("cur-duration");
const playerMax = document.getElementById("max-duration");

const shareId = document.getElementById("shareId").value;
// loadedmetadata
const endpoints = {
    data: `/listening/${shareId}/data`,
    stream: `/listening/${shareId}/stream`
}

const RefreshTimeMs = 10000;

let currentTrackUrl = ""

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

function playSong(wasPlaying, title, startTime) {
    playerTitle.innerText = title;

    playerAudio.src = endpoints.stream;
    playerAudio.load();

    playerRange.value = 0;

    playerAudio.currentTime = (Date.now()/1000) - startTime;

    if (wasPlaying || navigator.getAutoplayPolicy("mediaelement") == "allowed") {
        playerAudio.play().catch(() => {});
    }
}

function playerUpdateUI() {
    playerRange.style.setProperty('--range-progress-width', `${(playerRange.value - playerRange.min) / (playerRange.max - playerRange.min) * 100}%`);
}
playerAudio.addEventListener("play", btnCheck);
playerAudio.addEventListener("pause", btnCheck);

playerAudio.addEventListener('timeupdate', () => {
    if (playerAudio.duration) {
        playerRange.value = playerAudio.currentTime;
        playerUpdateUI();
        playerCurr.innerHTML = formatTime(playerAudio.currentTime);
    }
});
playerAudio.addEventListener('loadedmetadata', () => {
    playerRange.max = playerAudio.duration;
    playerMax.innerHTML = formatTime(playerAudio.duration);
});

function setDefault() {
    playerRange.value = 0;
    playerCurr.innerHTML = "0:00";
    playerMax.innerHTML = "0:00";
    playerTitle.innerText = "No song";
    controllBtn.disabled = true;
}

async function controllLoop() {
    try {
        const res = await fetch(endpoints.data, { cache: "no-store" });
        if (!res.ok) {
            if (res.status == 410 || res.status == 404) {
                setDefault();
                return;
            }
            if (res.status == 400) {
                window.location.href = "/";
                return;
            }
        }
        const json = await res.json();

        if (!json.songdata || !json.timestamp) {
            setDefault();
            return;
        }

        const url = json.songdata[5]
        const title = json.songdata[0]
        const startTime = json.timestamp;
        if (url != currentTrackUrl) {
            if (controllBtn.disabled)
                controllBtn.disabled = false;
            currentTrackUrl = url;
            playSong(!playerAudio.paused, title, startTime);
            return;
        }
        return;
    } catch (e) {}
}

controllBtn.addEventListener("click", () => {
    if (playerAudio.paused)
        playerAudio.play();
    else
        playerAudio.pause();
})

function btnCheck() {
    controllBtn.innerText = playerAudio.paused ? "▶︎" : "❚❚";
}

controllLoop()
setInterval(controllLoop, RefreshTimeMs);

