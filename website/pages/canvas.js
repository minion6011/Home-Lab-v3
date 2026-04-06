/* --- Variables --- */
const domEl = {
    canvasObj: document.getElementById("canvas-el"),

    uploadObj: document.getElementById("uploadObj"),
    selColorObj: document.getElementById("selectedColor"),
    selectImgObj: document.getElementById("selectImg"),

    selectBtnObj: document.getElementById("selectBtn"),
    cancelBtnObj: document.getElementById("cancelBtn"),
    undoBtnObj: document.getElementById("undoBtn"),
    newpageBtn: document.getElementById("newpageBtn"),

    uploadBtn: document.getElementById("uploadBtn"),
    downloadBtn: document.getElementById("downloadBtn"),

    eraseCursor: document.getElementById("eraseCursor")
};

/* --- Functions --- */
let ctx = domEl.canvasObj.getContext("2d");

let isPressed = false;
let isErasing = false;
let lastX = 0; let lastY = 0;
let lines = []; // []<list>
let currentLines = []; // []<dict>


document.addEventListener("DOMContentLoaded", () => {
    domEl.selectImgObj.style.filter = `invert(${calcY(domEl.selColorObj.value) >= 190 ? 1 : 0})`;
    canvasResize();

    ["dragover", "dragleave"].forEach(eventName => {
        window.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
});


function getPointerPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (event.touches && event.touches.length > 0) { // Mobile
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
    } else { // PC
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    };

    return [x, y];
};

function canvasResize() {
    const dpr = window.devicePixelRatio || 1;

    const rect = domEl.canvasObj.getBoundingClientRect();

    domEl.canvasObj.width = rect.width * dpr;
    domEl.canvasObj.height = rect.height * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawAllLines();
}
window.addEventListener("resize", canvasResize);


["mousedown", "touchstart"].forEach(eventName => {
    domEl.canvasObj.addEventListener(eventName, (e) => {
        isPressed = true;
        [lastX, lastY] = getPointerPosition(domEl.canvasObj, e);
    });
});
["mouseup", "touchend"].forEach(eventName => {
    domEl.canvasObj.addEventListener(eventName, (e) => {
        lines.push(currentLines);
        currentLines = [];

        isPressed = false;
    });
});

// Draw, Erase
// Moving [i2] - Click [i2]
["mousemove", "touchmove", "mousedown", "touchstart"].forEach(eventName => {
    domEl.canvasObj.addEventListener(eventName, (e) => {
        if (!isPressed) return;

        const [x, y] = getPointerPosition(domEl.canvasObj, e);
        if (isErasing) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 20; // Width in px
        } else {
            ctx.strokeStyle = domEl.selColorObj.value;
            ctx.lineWidth = 1.25;
        };
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        currentLines.push(
            {
               x1: lastX, y1: lastY,
               x2: x, y2: y,
               color:  ctx.strokeStyle,
               width: ctx.lineWidth
            }
        );

        lastX = x;
        lastY = y;
    });
});

// Erase <cursor>
["mousemove", "touchmove"].forEach(eventName => {
    document.addEventListener(eventName, (e) => {
        if (e.touches && e.touches.length > 0) { // Mobile
            domEl.eraseCursor.style.left = e.touches[0].clientX + 'px';
            domEl.eraseCursor.style.top = e.touches[0].clientY + 'px';
        } else { // PC
            domEl.eraseCursor.style.left = e.clientX + 'px';
            domEl.eraseCursor.style.top = e.clientY + 'px';
        };
    });
});

document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key == "z") 
        undoAction();
});
domEl.undoBtnObj.addEventListener("click", undoAction);
function undoAction() {
    if (lines.length > 0) {
        lines.pop();
        drawAllLines();
    };
};

domEl.newpageBtn.addEventListener("click", () => {
    lines.length = 0; currentLines.length = 0;
    ctx.clearRect(0, 0, domEl.canvasObj.width, domEl.canvasObj.height);
});

function drawAllLines() {
    ctx.clearRect(0, 0, domEl.canvasObj.width, domEl.canvasObj.height); // Clear canva
    for (const lineList of lines) { 
        for (const line of lineList) {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
            ctx.stroke();
        }
  }
};

function calcY(hex) { // Y = Brightness
    if (!hex.startsWith("#"))
        return 0 // error
    hex = hex.replace("#","");
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    const y = (0.299 * r + 0.587 * g + 0.114 * b);
    return y;
}

domEl.selColorObj.addEventListener("input", () => {
    const y = calcY(domEl.selColorObj.value);
    domEl.selectImgObj.style.filter = `invert(${y >= 190 ? 1 : 0})`;
});

domEl.selectBtnObj.addEventListener("click", () => {
    isErasing = false;
    changeTrigger();
});
domEl.cancelBtnObj.addEventListener("click", () => {
    isErasing = true;
    changeTrigger();
});
function changeTrigger() {
    domEl.selectBtnObj.classList.toggle("on", !isErasing);
    domEl.cancelBtnObj.classList.toggle("on", isErasing);

    domEl.eraseCursor.classList.toggle("active", isErasing);
}


function downloadFile() {
    if (lines.length > 0) {
        let element = document.createElement('a');
        element.style.display = 'none';

        const value = JSON.stringify(lines, null, 0);
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(value));
        element.setAttribute('download', "canvas.csd"); // .csd Canva Save Data
        
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}
domEl.downloadBtn.addEventListener("click", downloadFile)

window.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    const dt = e.dataTransfer;
    const file = dt.files[0];
    loadFile(file);
});
domEl.uploadBtn.addEventListener("click", () => {
    uploadObj.click();
});
domEl.uploadObj.addEventListener("change", (e) => {
    const file = e.target.files[0];
    loadFile(file);
});
function loadFile(file) {
    if (!file || !file.name.endsWith(".csd"))
        return;
    const reader = new FileReader();
    reader.onload = function(e) {
        lines = JSON.parse(e.target.result);
        drawAllLines();
    };
    reader.readAsText(file);
};