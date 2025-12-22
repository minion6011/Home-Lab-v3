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
let optionsSelect = [false, false]; // struct 0(input!=null), 1(select!=defaultoption)
const customSelect = document.getElementById("select-options");
const selectedOption = document.getElementById("selected-value");
const selectedNumber = document.getElementById("selected-number");
const selectedDesc = document.getElementById("selected-description");
const buttonAddPay = document.getElementById("payment-button");
const paymentsTable = document.getElementById("payments-table");

const balanceTot = document.getElementById("balance");
const lossTot = document.getElementById("loss");
const profitTot = document.getElementById("profit");
const tableLength = document.getElementById("table-length");
// --- Functions

// Custom Select
document.addEventListener('click', (event) => {
    if (!customSelect.classList.contains("hidden") && !customSelect.contains(event.target)) {
        OpenCloseCsSelect()
    }
});
function OpenCloseCsSelect() {
    customSelect.classList.toggle("hidden", !customSelect.classList.contains("hidden"));
}
function SelectOption(event) {
    let e = event || window.event;
    let target = e.target || e.srcElement;
    if (target.matches("li")) {
        selectedOption.innerHTML = target.innerHTML.slice(2);
        optionsSelect[1] = true; CheckAddPayment();
        OpenCloseCsSelect();
    }
}

function CheckAddPayment() {
    buttonAddPay.disabled = optionsSelect[0] + optionsSelect[1] != 2
}

async function AddPayment() {
    optionsSelect = [false, false]; buttonAddPay.disabled = true;
    let dict = {"type":"add"};
    dict["profit"] = dict["loss"] = 0;
    dict[selectedOption.innerText.toLowerCase()] = Number(selectedNumber.value)
    dict["description"] = selectedDesc.value.trim() || "//";
    // Request
    let req = await fetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dict),
    });
    if (req.status == 200) {
        tableLength.innerText = Number(tableLength.innerText) + 1;
        let json = JSON.parse(await req.text());
        AddPaymentHTML(dict["profit"], dict["loss"], dict["description"], json.date)
    }
    else throw new Error("Adding a payment returns a non-200 status code");
}
function AddPaymentHTML(profit, loss, description, date) {
    // Update Financial Report
    balanceTot.innerText = Math.round((Number(balanceTot.innerText) + (profit - loss)) * 100) / 100; 
    lossTot.innerText = "-" + (Number(lossTot.innerText.slice(1)) + loss);
    profitTot.innerText = "+" + (Number(profitTot.innerText.slice(1)) + profit);
    // Add Table element
    trElement = document.createElement("tr"); trElement.className = "payment-tr";
    trElement.innerHTML = `
    <input id="index" type="hidden" value="0">
    <th><code>${date}</code></th>
    <th class="profit">+${profit}</th>
    <th class="loss">-${loss}</th>
    <th mobile="0">${description}</th>
    `;
    paymentsTable.children[0].insertBefore(trElement, paymentsTable.children[0].children[1]);
    // x+1 on other index
    let ls = paymentsTable.children[0].children;
    for (let i = 2; i < ls.length; i++) {
        ls[i].children[0].value = Number(ls[i].children[0].value) + 1
    };
    // Resets Values
    selectedOption.innerText = "Select Operation Type";
    selectedNumber.value = "";
    selectedDesc.value = "";
}

async function FunctionCell(event) {
    let e = event || window.event;
    let target = e.target.parentNode || e.srcElement.parentNode;
    if (target.matches("tr") && target.className == "payment-tr") {
        let ls = paymentsTable.children[0].children;
        let index = Number(target.children[0].value)
        // Request
        let req = await fetch("/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({"type": "remove", "index": index}),
        });
        if (req.status == 200) {
            tableLength.innerText = Number(tableLength.innerText) - 1;
            // Update Financial Report
            let loss = target.children[3].innerText.slice(1);
            let profit = target.children[2].innerText.slice(1);
            lossTot.innerText = "-" + (Number(lossTot.innerText.slice(1)) - loss);
            profitTot.innerText = "+" + (Number(profitTot.innerText.slice(1)) - profit);
            balanceTot.innerText = Math.round((Number(profitTot.innerText.slice(1)) - Number(lossTot.innerText.slice(1))) * 100) / 100; 
            // x-1 form y
            ls[index+1].remove()
            for (let i = index+1; i < ls.length; i++) {
                ls[i].children[0].value = Number(ls[i].children[0].value) - 1
            }
        };
    }
}

async function ResetTable() {
    let req = await fetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({"type": "reset"}),
    });
    if (req.status == 200) {
        let lsN = (paymentsTable.children[0].children).length;
        for (let i = 1; i < lsN; i++) {
            paymentsTable.children[0].children[1].remove()
        }
        tableLength.innerText = "0";
        balanceTot.innerText = "0"; lossTot.innerText = "0"; profitTot.innerText = "0";
    }
}