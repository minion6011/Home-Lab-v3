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
    optionsSelect[1] = true; CheckAddPayment();
    let e = event || window.event;
    let target = e.target || e.srcElement;
    if (target.matches("li")) selectedOption.innerHTML = target.innerHTML.slice(2);
}

function CheckAddPayment() {
    buttonAddPay.disabled = optionsSelect[0] + optionsSelect[1] != 2
}

async function AddPayment() {
    optionsSelect = [false, false]; buttonAddPay.disabled = true;
    let dict = {"type":"add"};
    dict["profit"] = dict["loss"] = 0;
    dict[selectedOption.innerText.toLowerCase()] = Number(selectedNumber.value)
    dict["description"] = selectedDesc.value;
    // Request
    let req = await fetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dict),
    });
    if (req.status == 200) {
        let json = JSON.parse(await req.text());
        AddPaymentHTML(dict["profit"], dict["loss"], dict["description"], json.date)
    }
    else throw new Error("Adding a payment returns a non-200 status code");
}
function AddPaymentHTML(profit, loss, description, date) {
    // Update Financial Report
    balanceTot.innerText = parseFloat(balanceTot.innerText) + (profit - loss); 
    lossTot.innerText = "-" + (Number(lossTot.innerText.slice(1)) + loss);
    profitTot.innerText = "+" + (Number(profitTot.innerText.slice(1)) + profit);
    // Add Table element
    trElement = document.createElement("tr");
    trElement.innerHTML = `
    <th><code>${date}</code></th>
    <th class="profit">+${profit}</th>
    <th class="loss">-${loss}</th>
    <th mobile="0">${description}</th>
    `;
    paymentsTable.children[0].insertBefore(trElement, paymentsTable.children[0].children[1]);
    // Resets Values
    selectedOption.innerText = "Select Operation Type";
    selectedNumber.value = "";
    selectedDesc.value = "";
}