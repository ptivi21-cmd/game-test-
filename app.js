/* =========================================================
   VELLAR — FRONTEND PROTOTYPE
   =========================================================

   IMPORTANT:
   This file is only the visual/test version.

   Later:
   Browser
       ↓
   Vellar API
       ↓
   PostgreSQL
       ↓
   Server-side economy

   Never trust browser-side balances in the production version.
   ========================================================= */


/* ================= CONFIG ================= */

const CONFIG = {

    totalLand: 1000,

    landPrices: {
        1: 10,
        2: 20,
        4: 40
    },

    landIncome: {
        1: 2,
        2: 4,
        4: 8
    },

    citizenshipPrice: 5,

    bankAPY: 10,

    stateTax: 10,

    startingVEL: 0

};


/* ================= GAME STATE ================= */

let state = {

    citizen: false,

    citizenId: null,

    balance: CONFIG.startingVEL,

    ownedLand: 0,

    incomePerHour: 0,

    economy: 50,

    population: 1,

    development: 0,

    buildings: [],

    ownedTiles: [],

    lastUpdate: Date.now()

};


/* ================= SAVE ================= */

function saveGame() {

    state.lastUpdate = Date.now();

    localStorage.setItem(
        "vellar_game",
        JSON.stringify(state)
    );

}


/* ================= LOAD ================= */

function loadGame() {

    const saved = localStorage.getItem("vellar_game");

    if (!saved) {

        return;

    }

    try {

        const parsed = JSON.parse(saved);

        state = {
            ...state,
            ...parsed
        };

    } catch (error) {

        console.error(
            "Vellar save corrupted",
            error
        );

    }

}


/* ================= OFFLINE INCOME ================= */

function calculateOfflineIncome() {

    if (!state.citizen) {

        return;

    }

    const now = Date.now();

    const elapsed =
        (now - state.lastUpdate) / 3600000;

    if (elapsed <= 0) {

        return;

    }

    const income =
        elapsed * state.incomePerHour;

    if (income > 0) {

        state.balance += income;

    }

}


/* ================= FORMAT ================= */

function formatNumber(number) {

    return Math.floor(number)
        .toLocaleString("en-US");

}


/* ================= UI ================= */

function updateUI() {

    document.getElementById("balance").textContent =
        `${formatNumber(state.balance)} VEL`;

    document.getElementById("income").textContent =
        `+${state.incomePerHour.toFixed(1)} VEL/H`;

    document.getElementById("economy").textContent =
        state.economy.toFixed(1);

    document.getElementById("ownedLand").textContent =
        `${state.ownedLand} HA OWNED`;

    document.getElementById("citizenId").textContent =
        state.citizen
            ? `#${state.citizenId}`
            : "NOT REGISTERED";

    document.getElementById("developmentValue").textContent =
        `${state.development.toFixed(1)}%`;

    document.getElementById("population").textContent =
        state.population;

    document.getElementById("developmentBar").style.width =
        `${Math.min(state.development, 100)}%`;

    document.getElementById("populationBar").style.width =
        `${Math.min(state.population, 100)}%`;

}


/* ================= MAP ================= */

function createMap() {

    const map = document.getElementById("mapGrid");

    map.innerHTML = "";

    for (let i = 1; i <= CONFIG.totalLand; i++) {

        const tile = document.createElement("div");

        tile.className = "tile";

        tile.dataset.id = i;

        if (state.ownedTiles.includes(i)) {

            tile.classList.add("owned");

        }

        if (state.buildings.some(
            building => building.tile === i
        )) {

            tile.classList.add("building");

        }

        tile.addEventListener(
            "click",
            () => {

                inspectTile(i);

            }
        );

        map.appendChild(tile);

    }

}


/* ================= TILE ================= */

function inspectTile(id) {

    const owned =
        state.ownedTiles.includes(id);

    const building =
        state.buildings.find(
            item => item.tile === id
        );

    let html = "";

    if (owned) {

        html = `

            <div class="eyebrow">
                TERRITORY
            </div>

            <div class="modal-title">
                SECTOR ${String(id).padStart(4, "0")}
            </div>

            <div class="modal-subtitle">
                This hectare belongs to Citizen #${state.citizenId}.
            </div>

            <div class="buy-option">

                <strong>STATUS</strong>

                <span>OWNED</span>

            </div>

            <div style="height:10px"></div>

            <div class="buy-option">

                <strong>INCOME</strong>

                <span>
                    +${getTileIncome(id)} VEL/H
                </span>

            </div>

            ${
                building
                ?
                `
                <div style="height:10px"></div>

                <div class="buy-option">

                    <strong>DEVELOPMENT</strong>

                    <span>${building.type}</span>

                </div>
                `
                :
                ""
            }

        `;

    } else {

        html = `

            <div class="eyebrow">
                TERRITORY
            </div>

            <div class="modal-title">
                SECTOR ${String(id).padStart(4, "0")}
            </div>

            <div class="modal-subtitle">
                This hectare is currently free and available
                for acquisition through the Vellar Market.
            </div>

            <div class="modal-options">

                <button
                    class="buy-option"
                    onclick="buyLand(1)"
                >

                    <strong>
                        1 HECTARE
                    </strong>

                    <span>
                        $10
                    </span>

                </button>

                <button
                    class="buy-option"
                    onclick="buyLand(2)"
                >

                    <strong>
                        2 HECTARES
                    </strong>

                    <span>
                        $20
                    </span>

                </button>

                <button
                    class="buy-option"
                    onclick="buyLand(4)"
                >

                    <strong>
                        4 HECTARES
                    </strong>

                    <span>
                        $40
                    </span>

                </button>

            </div>

        `;

    }

    openModal(html);

}


/* ================= TILE INCOME ================= */

function getTileIncome(id) {

    const index =
        state.ownedTiles.indexOf(id);

    if (index === -1) {

        return 0;

    }

    /*
       Prototype assumes 1 hectare = 2 VEL/H.
    */

    return 2;

}


/* ================= CITIZENSHIP ================= */

function becomeCitizen() {

    if (state.citizen) {

        notify(
            "Already a citizen",
            "You are already registered in Vellar."
        );

        return;

    }

    const id =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    state.citizen = true;

    state.citizenId = id;

    state.balance = 0;

    state.population = 2;

    state.economy += 2;

    saveGame();

    updateUI();

    closeModal();

    notify(
        "Welcome to Vellar",
        `Citizen #${id} has been registered.`
    );

}


/* ================= LAND ================= */

function buyLand(size) {

    if (!state.citizen) {

        openCitizenship();

        return;

    }

    if (
        state.ownedLand + size >
        CONFIG.totalLand
    ) {

        notify(
            "Unavailable",
            "Not enough free territory."
        );

        return;

    }

    /*
       Prototype purchase.

       Real version:
       payment → server → verification → database
    */

    const price =
        CONFIG.landPrices[size];

    const freeTiles = [];

    for (
        let i = 1;
        i <= CONFIG.totalLand;
        i++
    ) {

        if (!state.ownedTiles.includes(i)) {

            freeTiles.push(i);

        }

    }

    const selected =
        freeTiles.slice(0, size);

    selected.forEach(
        tile => state.ownedTiles.push(tile)
    );

    state.ownedLand += size;

    state.incomePerHour +=
        CONFIG.landIncome[size];

    state.development +=
        size * 0.8;

    state.economy +=
        size * 0.3;

    saveGame();

    updateUI();

    createMap();

    closeModal();

    notify(
        "Territory acquired",
        `${size} hectare${size > 1 ? "s" : ""} added to your republic.`
    );

}


/* ================= CITIZENSHIP MODAL ================= */

function openCitizenship() {

    const html = `

        <div class="eyebrow">
            VELLAR CITIZENSHIP
        </div>

        <div class="modal-title">
            BECOME A CITIZEN
        </div>

        <div class="modal-subtitle">

            Join the Digital Republic of Vellar.
            Receive a unique Citizen ID and gain access
            to the territory, economy and future state systems.

        </div>

        <div class="buy-option">

            <strong>
                CITIZENSHIP
            </strong>

            <span>
                $5
            </span>

        </div>

        <div style="height:12px"></div>

        <button
            class="buy-option"
            onclick="becomeCitizen()"
        >

            <strong>
                BECOME CITIZEN
            </strong>

            <span>
                →
            </span>

        </button>

    `;

    openModal(html);

}


/* ================= MARKET ================= */

function openMarket() {

    if (!state.citizen) {

        openCitizenship();

        return;

    }

    const html = `

        <div class="eyebrow">
            VELLAR MARKET
        </div>

        <div class="modal-title">
            ACQUIRE TERRITORY
        </div>

        <div class="modal-subtitle">
            Purchase digital territory inside the
            1,000 hectare Vellar republic.
        </div>

        <div class="modal-options">

            <button
                class="buy-option"
                onclick="buyLand(1)"
            >

                <strong>
                    1 HA
                </strong>

                <span>
                    $10
                </span>

            </button>

            <button
                class="buy-option"
                onclick="buyLand(2)"
            >

                <strong>
                    2 HA
                </strong>

                <span>
                    $20
                </span>

            </button>

            <button
                class="buy-option"
                onclick="buyLand(4)"
            >

                <strong>
                    4 HA
                </strong>

                <span>
                    $40
                </span>

            </button>

        </div>

    `;

    openModal(html);

}


/* ================= BANK ================= */

function openBank() {

    const html = `

        <div class="eyebrow">
            VELLAR NATIONAL BANK
        </div>

        <div class="modal-title">
            BANK
        </div>

        <div class="modal-subtitle">
            The Vellar banking system will allow citizens
            to deposit VEL, receive interest and later use
            SA as collateral for secured loans.
        </div>

        <div class="buy-option">

            <strong>
                DEPOSIT APY
            </strong>

            <span>
                ${CONFIG.bankAPY}%
            </span>

        </div>

        <div style="height:10px"></div>

        <div class="buy-option">

            <strong>
                YOUR BALANCE
            </strong>

            <span>
                ${formatNumber(state.balance)} VEL
            </span>

        </div>

        <div style="height:18px"></div>

        <div class="eyebrow">
            COMING SOON
        </div>

        <div class="modal-subtitle">
            Deposits, loans, SA collateral,
            repayment and liquidation mechanics.
        </div>

    `;

    openModal(html);

}


/* ================= WORK ================= */

function openWork() {

    const html = `

        <div class="eyebrow">
            VELLAR LABOR MARKET
        </div>

        <div class="modal-title">
            WORK
        </div>

        <div class="modal-subtitle">
            Enterprises will create jobs for citizens.
            Employees will complete daily work requirements
            and receive VEL salaries.
        </div>

        <div class="modal-options">

            <div class="buy-option">

                <strong>
                    FARM
                </strong>

                <span>
                    25 VEL / DAY
                </span>

            </div>

            <div class="buy-option">

                <strong>
                    FACTORY
                </strong>

                <span>
                    40 VEL / DAY
                </span>

            </div>

            <div class="buy-option">

                <strong>
                    MINE
                </strong>

                <span>
                    30 VEL / DAY
                </span>

            </div>

        </div>

        <div style="height:18px"></div>

        <div class="eyebrow">
            REQUIREMENT
        </div>

        <div class="modal-subtitle">
            100 work actions per day.
        </div>

    `;

    openModal(html);

}


/* ================= CITY HALL ================= */

function openCityHall() {

    const html = `

        <div class="eyebrow">
            REPUBLIC OF VELLAR
        </div>

        <div class="modal-title">
            CITY HALL
        </div>

        <div class="modal-subtitle">
            Central administration of the Digital Republic.
            From here the state economy, enterprises,
            territory and infrastructure will be developed.
        </div>

        <div class="modal-options">

            <div class="buy-option">

                <strong>
                    TREASURY
                </strong>

                <span>
                    0 VEL
                </span>

            </div>

            <div class="buy-option">

                <strong>
                    POPULATION
                </strong>

                <span>
                    ${state.population}
                </span>

            </div>

            <div class="buy-option">

                <strong>
                    TERRITORY DEVELOPED
                </strong>

                <span>
                    ${state.development.toFixed(1)}%
                </span>

            </div>

            <div class="buy-option">

                <strong>
                    STATE TAX
                </strong>

                <span>
                    ${CONFIG.stateTax}%
                </span>

            </div>

        </div>

        <div style="height:18px"></div>

        <div class="eyebrow">
            DEVELOPMENT
        </div>

        <div class="modal-subtitle">
            Mines: 4<br>
            Production facilities: 10<br>
            Farms: 15
        </div>

    `;

    openModal(html);

}


/* ================= EVENTS ================= */

function openEvents() {

    const html = `

        <div class="eyebrow">
            VELLAR
        </div>

        <div class="modal-title">
            EVENTS
        </div>

        <div class="modal-subtitle">
            Dynamic events will affect production,
            employment, resources, market conditions
            and the state economy.
        </div>

        <div class="buy-option">

            <strong>
                CURRENT EVENT
            </strong>

            <span>
                STABLE
            </span>

        </div>

    `;

    openModal(html);

}


/* ================= MODAL ================= */

function openModal(content) {

    document.getElementById(
        "modalContent"
    ).innerHTML = content;

    document.getElementById(
        "modal"
    ).classList.remove("hidden");

}


function closeModal() {

    document.getElementById(
        "modal"
    ).classList.add("hidden");

}


document.getElementById(
    "modalClose"
).addEventListener(
    "click",
    closeModal
);


document.querySelector(
    ".modal-backdrop"
).addEventListener(
    "click",
    closeModal
);


/* ================= NAVIGATION ================= */

document.querySelectorAll(
    "[data-panel]"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const panel =
                    button.dataset.panel;

                document.querySelectorAll(
                    ".menu-button"
                ).forEach(
                    item => item.classList.remove("active")
                );

                const matching =
                    document.querySelector(
                        `.menu-button[data-panel="${panel}"]`
                    );

                if (matching) {

                    matching.classList.add("active");

                }

                switch (panel) {

                    case "market":
                        openMarket();
                        break;

                    case "bank":
                        openBank();
                        break;

                    case "work":
                        openWork();
                        break;

                    case "cityhall":
                        openCityHall();
                        break;

                    case "events":
                        openEvents();
                        break;

                }

            }
        );

    }
);


/* ================= NOTIFICATION ================= */

let notificationTimer = null;

function notify(title, text) {

    const box =
        document.getElementById("notification");

    document.getElementById(
        "notificationTitle"
    ).textContent = title;

    document.getElementById(
        "notificationText"
    ).textContent = text;

    box.classList.add("show");

    clearTimeout(notificationTimer);

    notificationTimer =
        setTimeout(
            () => box.classList.remove("show"),
            3500
        );

}


/* ================= GAME LOOP ================= */

function gameLoop() {

    if (!state.citizen) {

        return;

    }

    const now = Date.now();

    const elapsed =
        (now - state.lastUpdate) / 3600000;

    if (elapsed > 0) {

        state.balance +=
            elapsed * state.incomePerHour;

        state.lastUpdate = now;

        saveGame();

        updateUI();

    }

}


/* ================= INITIALIZATION ================= */

function init() {

    loadGame();

    calculateOfflineIncome();

    createMap();

    updateUI();

    /*
       If this is a completely new player,
       show citizenship screen.
    */

    if (!state.citizen) {

        setTimeout(
            openCitizenship,
            700
        );

    }

}


/* ================= START ================= */

init();

setInterval(
    gameLoop,
    5000
);
