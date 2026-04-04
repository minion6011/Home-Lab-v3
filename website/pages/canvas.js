/* --- Variables --- */
const domEl = {
    canvasObj: document.getElementById("canvas-el"),

    selColorObj: document.getElementById("selectedColor"),
    cancelBtnObj: document.getElementById("cancellBtn")
}

const endpoints = {
    default: "/default"
}

/* --- Functions --- */
let ctx = domEl.canvasObj.getContext("2d");

let isPressed = false;
let isErasing = false;
let lastX = 0; let lastY = 0;
let lines = [] // []<list>
let currentLines = [] // []<dict>

ctx.lineCap = "round";
ctx.lineJoin = "round";

function getPointerPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (event.touches && event.touches.length > 0) { // Mobile
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
    } else { // PC
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    }

    return [x, y];
}

function canvasResize() {
    domEl.canvasObj.width = domEl.canvasObj.offsetWidth;
    domEl.canvasObj.height = domEl.canvasObj.offsetHeight;
    drawAllLines() // testing
}
window.addEventListener("resize", canvasResize);
canvasResize(); // First page Load size fix


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

["mousemove", "touchmove"].forEach(eventName => {
    domEl.canvasObj.addEventListener(eventName, (e) => {
        if (!isPressed) return;

        const [x, y] = getPointerPosition(domEl.canvasObj, e);
        if (isErasing) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 10;
        } else {
            ctx.strokeStyle = domEl.selColorObj.value;
            ctx.lineWidth = 1;
        }
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
        )

        lastX = x;
        lastY = y;
    });
});


window.addEventListener("keydown", undoAction);
function undoAction(e) {
    if ((e.ctrlKey || e.metaKey) && e.key == "z") {
        if (lines.length > 0) {
            lines.pop()
            drawAllLines();
        }
    }
}
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
}


domEl.selColorObj.addEventListener("click", () => {
    isErasing = false;
    // add change style...
})

domEl.cancelBtnObj.addEventListener("click", () => {
    isErasing = true;
    // add change style...
})