/* --- Variables --- */
const domEl = {
    dropdownType: document.getElementById("select-type"),
    compressButton: document.getElementById("compress-button"),
    clearButton: document.getElementById("clear-button"),
    videoFile: document.getElementById("video-file"),
    videoImg: document.getElementById("video-img"),
    divCompressed: document.getElementById("compressed-container"),
    divUncompressed: document.getElementById("uncompressed-show"),
    videoUncompressed: document.getElementById("show-video"),
    videoCompressed: document.getElementById("video-compressed"),
    dropdownCodec: document.getElementById("codec"),
    crtInput: document.getElementById("crf"),
    bitrateInput: document.getElementById("bitrate"),
}

const endpoints = {
    compression: "/compress"
}

/* --- Functions --- */
domEl.dropdownType.addEventListener('change', () => {
    if (domEl.dropdownType.value == "audio") {
        domEl.dropdownCodec.innerHTML = `
        <option value="aac">AAC</option>
        <option value="wavpack">WavPack</option>
        <option value="flac">FLAC</option>
        `
        domEl.crtInput.disabled = true;
        domEl.crtInput.value = 0;
    }
    else if (domEl.dropdownType.value == "video") {
        domEl.dropdownCodec.innerHTML = `
        <option value="libx265">H.265 (GPL)</option>
        <option value="libx264">H.264 (GPL)</option>
        <option value="libopenh264">H.264 (No GPL)</option>
        `
        domEl.crtInput.disabled = false;
        domEl.crtInput.value = 24;
    }
})

domEl.videoFile.addEventListener('change', () => {
    const file = domEl.videoFile.files[0];
    if (file == undefined) return
    const reader = new FileReader();
    reader.onload = (e) => {
        domEl.videoUncompressed.src = e.target.result;
        const media = new Audio(e.target.result);
        media.onloadedmetadata = () => {
            domEl.bitrateInput.value = Math.round( ( (file.size*8) / media.duration ) / 1000 ) + "k"
        }
    };
    reader.readAsDataURL(file);
    domEl.divUncompressed.style.display = "block";
    domEl.compressButton.disabled = false;
});

function compressFile() {
    domEl.clearButton.disabled = domEl.compressButton.disabled = domEl.videoImg.dataset.disabled = true;
    // Request
    const formData = new FormData();
    formData.append("codec", domEl.dropdownCodec.value);
    formData.append("crf", domEl.crtInput.value);
    formData.append("bitrate", domEl.bitrateInput.value);
    formData.append("file", domEl.videoFile.files[0]);
    fetch(endpoints.compression, {
        headers: {"Content-Type": domEl.videoFile.files[0].contentType},
            mode: "no-cors",
            method: "POST",
            files: domEl.videoFile.files[0],
            body: formData,
        }
    ).then((response) => {
        if (response.ok) {
            response.json().then((data) => {
                domEl.videoCompressed.src = data.outfile
                domEl.videoCompressed.load()
                domEl.divCompressed.style.display = "block";
            })
        }
        domEl.clearButton.disabled = domEl.compressButton.disabled = domEl.videoImg.dataset.disabled = false;
    });
}

async function clearVideos() {
    let req = await fetch(endpoints.compression, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({action: "clear"}),
    });
    if (req.status == 200) {
        domEl.divCompressed.style.display = domEl.divUncompressed.style.display = "none";
        domEl.videoCompressed.src = domEl.videoUncompressed.src =  "";
    }
}
