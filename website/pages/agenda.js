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
// Todo
async function switchTodo(element) {
    element.children[1].checked = !element.children[1].checked;
    let dict = {type: "switch", index: element.children[0].value, state: ''}
    if (element.children[1].checked) {dict.state = 'checked'};

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
        let json = JSON.parse(await req.text());
        let mainDiv = document.createElement("div"); mainDiv.className = "to_do-elements";
        // New To-Do Element
        mainDiv.innerHTML = `
        <label onclick="switchTodo(this)" class="to_do-container">
            <input id="todoIndex" type="hidden" value="${json.id}">
            <input id="todoState" type="checkbox">
            <p id="todoText" class="text"></p>
            <span class="checkmark"></span>
        </label>
        <span onclick="deleteTodo(this)" class="close">&#x2715;</span>
        `;
        mainDiv.children[0].children[2].innerText = domEl.TodoAddInput.value;

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
        let json = JSON.parse(await req.text());
        let mainDiv = document.createElement("div"); mainDiv.className = "note";
        // New Note Element
        mainDiv.innerHTML = `
        <input type="hidden" value="${json.id}">
        <span></span>
        <span onclick="removeNote(this)" class="close">&#x2715;</span>
        `;
        mainDiv.children[1].innerText = domEl.NotesAddInput.value
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
