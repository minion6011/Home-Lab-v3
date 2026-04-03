/* --- Variables --- */
const domEl = {
    canvasObj: document.getElementById("canvas-el"),
    selColorObj: document.getElementById("selectedColor")
}

const endpoints = {
    default: "/default"
}

/* --- Functions --- */
ctx = domEl.canvasObj.getContext("2d");

let isPressed = false;
let lastX = 0; let lastY = 0;


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
        isPressed = false;
    });
});
["mousemove", "touchmove"].forEach(eventName => {
    domEl.canvasObj.addEventListener(eventName, (e) => {
        if (!isPressed) return;

        const [x, y] = getPointerPosition(domEl.canvasObj, e);

        ctx.strokeStyle = domEl.selColorObj.value;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastX = x;
        lastY = y;
    });
});
