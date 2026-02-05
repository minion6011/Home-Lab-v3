/* --- Variables --- */
const domEl = {
    compressButton: document.getElementById("compress-button"),
    videoCompressedContainer: document.getElementById("compressed-container"),
    videoCompressed: document.getElementById("video-compressed"),
    videoFile: document.getElementById("video-file"),
    videoImg: document.getElementById("video-img"),
    divUncompressed: document.getElementById("uncompressed-show"),
    videoUncompressed: document.getElementById("show-video"),
    dropdownCodec: document.getElementById("codec"),
    crtInput: document.getElementById("crf")
}

const endpoints = {
    compression: "/compress"
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

window.addEventListener("storage", (event) => {
    if (event.newValue === "light") {
        document.body.classList.add("light");
    }
    else if (event.newValue === "dark"){
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
domEl.videoFile.addEventListener('change', () => {
    const file = domEl.videoFile.files[0];
    if (file == undefined) return
    const reader = new FileReader();
    reader.onload = (e) => domEl.videoUncompressed.src = e.target.result;
    reader.readAsDataURL(file);
    domEl.videoUncompressed.style.display = "block";
    domEl.divUncompressed.style.display = "block";
    domEl.compressButton.disabled = false;
});

function compressFile() {
    domEl.compressButton.disabled = domEl.videoImg.dataset.disabled = true;
    // Request
    const formData = new FormData();
    formData.append("codec", domEl.dropdownCodec.value);
    formData.append("crf", domEl.crtInput.value);
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
            domEl.videoCompressed.load()
            domEl.videoCompressedContainer.style.display = "block";
        }
        domEl.compressButton.disabled = domEl.videoImg.dataset.disabled = false;
    });
}