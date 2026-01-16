/* --- Variables --- */
const domEl = {
    checkListTodo: document.getElementById("check-list"),
    TodoAddButton: document.getElementById("todo-button"),
    TodoAddInput: document.getElementById("todo-input"),

    checkListNotes: document.getElementById("notes-list"),
    NotesAddButton: document.getElementById("notes-button"),
    NotesAddInput: document.getElementById("notes-input")
}
const endpoints = {
    todo: "/todo",
    note: "/note"
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
    };
});
// Iframe Check
if (window.self === window.top) {
    document.documentElement.classList.add("not-iframe");
};
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

// Todo
async function switchTodo(element) {
    let dict = {type: "switch", index: element.children[0].value, state: ""}
    if (element.children[1].checked) {dict.state = "checked"};

    let req = await fetch(endpoints.todo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dict),
    });
    if (req.status != 200) {
        throw new Error("Switching a To-Do returns a non-200 status code");
    }
    
}
async function deleteTodo(element) {
    let req = await fetch(endpoints.todo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "remove", index: element.parentElement.children[0].children[0].value}),
    });
    if (req.status == 200) {
        for (let i = 0; i < domEl.checkListTodo.children.length; i++) {
            if (i > Number(element.parentElement.children[0].children[0].value))
                domEl.checkListTodo.children[i].children[0].children[0].value = Number(domEl.checkListTodo.children[i].children[0].children[0].value) - 1;
        };
        domEl.checkListTodo.removeChild(element.parentElement);
    }
    else throw new Error("Deleting a To-Do returns a non-200 status code");
}
async function addTodo() {
    let req = await fetch(endpoints.todo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "add", text: domEl.TodoAddInput.value}),
    });
    if (req.status == 200) {
        let mainDiv = document.createElement("div"); mainDiv.className = "to_do-elements";
        mainDiv.innerHTML = `
        <label onclick="switchTodo(this)" class="to_do-container">
            <input id="todoIndex" type="hidden" value="0">
            <input id="todoState" type="checkbox">
            <p id="todoText" class="text">${domEl.TodoAddInput.value}</p>
            <span class="checkmark"></span>
        </label>
        <span onclick="deleteTodo(this)" class="close">&#x2715;</span>
        `;
        for (let i = 0; i < domEl.checkListTodo.children.length; i++) {
            domEl.checkListTodo.children[i].children[0].children[0].value = Number(domEl.checkListTodo.children[i].children[0].children[0].value) + 1;
        };
        domEl.checkListTodo.insertBefore(mainDiv, domEl.checkListTodo.firstChild);
        domEl.TodoAddInput.value = "";
        domEl.TodoAddButton.disabled = true;
    }
    else throw new Error("Adding a To-Do returns a non-200 status code");
}

// Notes
async function addNote() {
    let req = await fetch(endpoints.note, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "add", text: domEl.NotesAddInput.value}),
    });
    if (req.status == 200) {
        let mainDiv = document.createElement("div"); mainDiv.className = "note";
        mainDiv.innerHTML = `
        <input type="hidden" value="0">
        <span>${domEl.NotesAddInput.value}</span>
        <span onclick="removeNote(this)" class="close">&#x2715;</span>
        `;
        for (let i = 0; i < domEl.checkListNotes.children.length; i++) {
            domEl.checkListNotes.children[i].children[0].value = Number(domEl.checkListNotes.children[i].children[0].value) + 1;
        };
        domEl.checkListNotes.insertBefore(mainDiv, domEl.checkListNotes.firstChild);
        domEl.NotesAddInput.value = "";
        domEl.NotesAddButton.disabled = true;
    }
    else throw new Error("Adding a Note returns a non-200 status code");
}

async function removeNote(element) {
    let req = await fetch(endpoints.note, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({type: "remove", index: element.parentElement.children[0].value}),
    });
    if (req.status == 200) {

        for (let i = 0; i < domEl.checkListNotes.children.length; i++) {
            if (i > Number(element.parentElement.children[0].value)) {
                domEl.checkListNotes.children[i].children[0].value = Number(domEl.checkListNotes.children[i].children[0].value) - 1;
            };
        };
        domEl.checkListNotes.removeChild(element.parentElement)
    }
    else throw new Error("Adding a Note returns a non-200 status code");
}