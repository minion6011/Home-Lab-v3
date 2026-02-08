/* --- Variables --- */
let optionsSelect = [false, false]; // struct 0(input!=null), 1(select!=defaultoption)
const domEl = {
    customSelect: document.getElementById("select-options"),
    selectedOption: document.getElementById("selected-value"),
    selectedNumber: document.getElementById("selected-number"),
    selectedDesc: document.getElementById("selected-description"),
    buttonAddPay: document.getElementById("payment-button"),
    paymentsTable: document.getElementById("payments-table"),

    balanceTot: document.getElementById("balance"),
    lossTot: document.getElementById("loss"),
    profitTot: document.getElementById("profit"),
    tableLength: document.getElementById("table-length")
}
const endpoints = {
    payments: "/payments"
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

// Custom Select
document.addEventListener('click', (event) => {
    if (!domEl.customSelect.classList.contains("hidden") && !domEl.customSelect.contains(event.target)) {
        OpenCloseCsSelect()
    }
});
function OpenCloseCsSelect() {
    domEl.customSelect.classList.toggle("hidden", !domEl.customSelect.classList.contains("hidden"));
}
function SelectOption(event) {
    let e = event || window.event;
    let target = e.target || e.srcElement;
    if (target.matches("li")) {
        domEl.selectedOption.innerHTML = target.innerHTML.slice(2);
        optionsSelect[1] = true; CheckAddPayment();
        OpenCloseCsSelect();
    }
}

function CheckAddPayment() {
    domEl.buttonAddPay.disabled = optionsSelect[0] + optionsSelect[1] != 2
}

async function AddPayment() {
    optionsSelect = [false, false]; domEl.buttonAddPay.disabled = true;
    let dict = {"type":"add"};
    dict["profit"] = dict["loss"] = 0;
    dict[domEl.selectedOption.innerText.toLowerCase()] = Math.abs( Math.round(Number(domEl.selectedNumber.value) * 100) / 100)
    dict["description"] = domEl.selectedDesc.value.trim() || "//";
    // Request
    let req = await fetch(endpoints.payments, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dict),
    });
    if (req.status == 200) {
        domEl.tableLength.innerText = Number(domEl.tableLength.innerText) + 1;
        let json = JSON.parse(await req.text());
        AddPaymentHTML(dict["profit"], dict["loss"], dict["description"], json.date, json.id)
    }
    else throw new Error("Adding a payment returns a non-200 status code");
}
function AddPaymentHTML(profit, loss, description, date, id) {
    // Update Financial Report
    domEl.balanceTot.innerText = Math.round((Number(domEl.balanceTot.innerText) + (profit - loss)) * 100) / 100; 
    domEl.lossTot.innerText = "-" + Math.round((Number(domEl.lossTot.innerText.slice(1)) + loss) * 100) / 100;
    domEl.profitTot.innerText = "+" + Math.round((Number(domEl.profitTot.innerText.slice(1)) + profit) * 100) / 100;
    // Add Table element
    trElement = document.createElement("tr"); trElement.className = "payment-tr";
    trElement.innerHTML = `
    <input id="index" type="hidden" value="${id}">
    <th><code>${date}</code></th>
    <th class="profit">+${profit}</th>
    <th class="loss">-${loss}</th>
    <th mobile="0"><span onclick="event.stopPropagation()">${description}</span></th>
    `;
    domEl.paymentsTable.children[0].insertBefore(trElement, domEl.paymentsTable.children[0].children[1]);
    // x+1 on other index
    let ls = domEl.paymentsTable.children[0].children;
    for (let i = 2; i < ls.length; i++) {
        ls[i].children[0].value = Number(ls[i].children[0].value) + 1
    };
    // Resets Values
    domEl.selectedOption.innerText = "Select Operation Type";
    domEl.selectedNumber.value = "";
    domEl.selectedDesc.value = "";
}

async function FunctionCell(event) {
    let e = event || window.event;
    let target = e.target.parentNode || e.srcElement.parentNode;
    if (target.matches("tr") && target.className == "payment-tr") {
        let ls = domEl.paymentsTable.children[0].children;
        let index = target.children[0].value
        // Request
        let req = await fetch(endpoints.payments, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({"type": "remove", "index": index}),
        });
        if (req.status == 200) {
            domEl.tableLength.innerText = Number(domEl.tableLength.innerText) - 1;
            // Update Financial Report
            let loss = target.children[3].innerText.slice(1);
            let profit = target.children[2].innerText.slice(1);
            domEl.lossTot.innerText = "-" + Math.round( (Number(domEl.lossTot.innerText.slice(1)) - loss)*100 ) / 100;
            domEl.profitTot.innerText = "+" + Math.round( (Number(domEl.profitTot.innerText.slice(1)) - profit)*100 ) / 100;
            domEl.balanceTot.innerText = Math.round((Number(domEl.profitTot.innerText.slice(1)) - Number(domEl.lossTot.innerText.slice(1))) * 100) / 100; 
            target.remove();
        };
    }
}

async function ResetTable() {
    let req = await fetch(endpoints.payments, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({"type": "reset"}),
    });
    if (req.status == 200) {
        let lsN = (domEl.paymentsTable.children[0].children).length;
        for (let i = 1; i < lsN; i++) {
            domEl.paymentsTable.children[0].children[1].remove()
        }
        domEl.tableLength.innerText = "0";
        domEl.balanceTot.innerText = "0"; domEl.lossTot.innerText = "-0"; domEl.profitTot.innerText = "+0";
    }
}