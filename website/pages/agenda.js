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
const checkListTodo = document.getElementById("check-list")
const TodoAddButton = document.getElementById("todo-button")
const TodoAddInput = document.getElementById("todo-input")
// --- Functions

async function switchTodo(element) {
    let dict = {type: "switch", index: element.children[0].value, state: ""}
    if (element.children[1].checked) {dict.state = "checked"}

    let req = await fetch("/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dict),
    });
    if (req.status != 200) {
        throw new Error("Switching a To-Do returns a non-200 status code");
    }
    
}
async function deleteTodo(element) {
    let req = await fetch("/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "remove", index: element.parentElement.children[0].children[0].value}),
    });
    if (req.status == 200) {
        for (let i = 0; i < checkListTodo.children.length; i++) {
            if (i > Number(element.parentElement.children[0].children[0].value))
                checkListTodo.children[i].children[0].children[0].value = Number(checkListTodo.children[i].children[0].children[0].value) - 1
        }
        checkListTodo.removeChild(element.parentElement)
    }
    else throw new Error("Deleting a To-Do returns a non-200 status code");
}
async function addTodo() {
    let req = await fetch("/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "add", text: TodoAddInput.value}),
    });
    if (req.status == 200) {
        let mainDiv = document.createElement("div"); mainDiv.className = "to_do-elements";
        mainDiv.innerHTML = `
        <label onclick="switchTodo(this)" class="to_do-container">
            <input id="todoIndex" type="hidden" value="0">
            <input id="todoState" type="checkbox">
            <p id="todoText" class="text">${TodoAddInput.value}</p>
            <span class="checkmark"></span>
        </label>
        <span onclick="deleteTodo(this)" class="close">&#x2715;</span>
        `
        for (let i = 0; i < checkListTodo.children.length; i++) {
            checkListTodo.children[i].children[0].children[0].value = Number(checkListTodo.children[i].children[0].children[0].value) + 1
        }
        checkListTodo.insertBefore(mainDiv, checkListTodo.firstChild)
        TodoAddInput.value = "";
        TodoAddButton.disabled = true;
    }
    else throw new Error("Adding a To-Do returns a non-200 status code");
}