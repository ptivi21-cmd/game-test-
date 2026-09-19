"use strict";

/*
=========================================================
VELLAR
DIGITAL REPUBLIC
LOCAL GAME PROTOTYPE

Версия: 1.0
=========================================================
*/


document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {

        cols: 40,
        rows: 25,

        totalPlots: 1000,

        landPrices: {
            1: 10,
            2: 20,
            4: 40
        },

        landIncomePerHa: 2,

        jobs: {
            farm: {
                salary: 25,
                clicks: 100
            },

            factory: {
                salary: 40,
                clicks: 100
            },

            mine: {
                salary: 30,
                clicks: 100
            }
        },

        buildings: {
            farm: {
                price: 1000,
                image: "assets/farm.png"
            },

            factory: {
                price: 2500,
                image: "assets/factory.png"
            },

            mine: {
                price: 5000,
                image: "assets/mine.png"
            }
        },

        bankAPY: 10,

        storageKey: "vellar_game_v1"

    };


    /* =====================================================
       STATE
    ===================================================== */

    let state = loadState();

    let zoom = 1;

    let selectedPlot = null;


    /* =====================================================
       DOM
    ===================================================== */

    const $ = id => document.getElementById(id);

    const plotGrid = $("plotGrid");

    const buildingLayer = $("buildingLayer");

    const map = $("map");

    const landModal = $("landModal");

    const buildModal = $("buildModal");

    const toast = $("toast");

    const toastText = $("toastText");


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    createPlots();

    renderBuildings();

    updateUI();

    setupEvents();

    startGameLoop();


    /* =====================================================
       DEFAULT STATE
    ===================================================== */

    function createDefaultState() {

        return {

            citizen: {

                id: "#0001",

                name: "Founder"

            },


            vel: 2500,

            cash: 100,


            ownedPlots: [],


            buildings: [],


            resources: {

                food: 0,

                ore: 0,

                goods: 0

            },


            bank: {

                balance: 0,

                lastInterest: Date.now()

            },


            population: 1,

            development: 1,

            economy: 62,

            treasury: 0,


            work: {

                clicks: 0,

                job: null,

                lastReset: getDayKey()

            },


            events: [

                {

                    text: "Республика Vellar создана.",

                    time: Date.now()

                }

            ],


            lastIncome: Date.now()

        };

    }


    /* =====================================================
       LOAD / SAVE
    ===================================================== */

    function loadState() {

        try {

            const saved =
                localStorage.getItem(
                    CONFIG.storageKey
                );

            if (!saved) {

                return createDefaultState();

            }

            const parsed = JSON.parse(saved);

            return {

                ...createDefaultState(),

                ...parsed,

                citizen: {
                    ...createDefaultState().citizen,
                    ...(parsed.citizen || {})
                },

                resources: {
                    ...createDefaultState().resources,
                    ...(parsed.resources || {})
                },

                bank: {
                    ...createDefaultState().bank,
                    ...(parsed.bank || {})
                },

                work: {
                    ...createDefaultState().work,
                    ...(parsed.work || {})
                }

            };

        } catch (error) {

            console.error(
                "Vellar save error:",
                error
            );

            return createDefaultState();

        }

    }


    function saveState() {

        localStorage.setItem(

            CONFIG.storageKey,

            JSON.stringify(state)

        );

    }


    /* =====================================================
       CREATE 1000 PLOTS
    ===================================================== */

    function createPlots() {

        plotGrid.innerHTML = "";

        for (
            let i = 0;
            i < CONFIG.totalPlots;
            i++
        ) {

            const plot =
                document.createElement("div");

            plot.className = "plot";

            plot.dataset.plotId = i;

            const owned =
                state.ownedPlots.find(
                    p => p.id === i
                );

            if (owned) {

                plot.classList.add("owned");

            }

            plotGrid.appendChild(plot);

        }

    }


    /* =====================================================
       BUILDINGS
    ===================================================== */

    function renderBuildings() {

        buildingLayer.innerHTML = "";

        /*
        Центрируем государственные здания.
        */

        const centerBuilding =
            document.createElement("img");

        centerBuilding.className =
            "building";

        centerBuilding.src =
            "assets/city-hall.png";

        centerBuilding.style.left =
            "50%";

        centerBuilding.style.top =
            "50%";

        centerBuilding.title =
            "Vellar City Hall";

        buildingLayer.appendChild(
            centerBuilding
        );


        /*
        Игровые здания
        */

        state.buildings.forEach(
            building => {

                const img =
                    document.createElement("img");

                img.className =
                    "building";

                img.src =
                    CONFIG.buildings[
                        building.type
                    ].image;

                img.style.left =
                    building.x + "%";

                img.style.top =
                    building.y + "%";

                img.title =
                    building.type.toUpperCase();

                buildingLayer.appendChild(img);

            }
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {


        /*
        NAVIGATION
        */

        document
            .querySelectorAll(".nav-button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const panel =
                            button.dataset.panel;

                        switchPanel(panel);

                    }
                );

            });


        /*
        MAP CLICK
        */

        plotGrid.addEventListener(
            "click",
            event => {

                const plot =
                    event.target.closest(".plot");

                if (!plot) return;

                const id =
                    Number(
                        plot.dataset.plotId
                    );

                selectPlot(id);

            }
        );


        /*
        ZOOM
        */

        $("zoomIn").addEventListener(
            "click",
            () => {

                zoom =
                    Math.min(
                        1.8,
                        zoom + .1
                    );

                updateZoom();

            }
        );


        $("zoomOut").addEventListener(
            "click",
            () => {

                zoom =
                    Math.max(
                        .7,
                        zoom - .1
                    );

                updateZoom();

            }
        );


        /*
        CLOSE LAND MODAL
        */

        $("closeLandModal")
            .addEventListener(
                "click",
                () => {

                    closeModal(
                        landModal
                    );

                }
            );


        /*
        CLOSE BUILD MODAL
        */

        $("closeBuildModal")
            .addEventListener(
                "click",
                () => {

                    closeModal(
                        buildModal
                    );

                }
            );


        /*
        BUILDING
        */

        document
            .querySelectorAll(".build-option")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        build(
                            button.dataset.build
                        );

                    }
                );

            });


        /*
        MARKET
        */

        document
            .querySelectorAll("[data-sell]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        sellResource(
                            button.dataset.sell
                        );

                    }
                );

            });


        /*
        WORK
        */

        document
            .querySelectorAll("[data-job]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        work(
                            button.dataset.job
                        );

                    }
                );

            });


        /*
        BANK
        */

        $("depositButton")
            .addEventListener(
                "click",
                deposit
            );


        $("withdrawButton")
            .addEventListener(
                "click",
                withdraw
            );


        /*
        CITY
        */

        $("upgradeCity")
            .addEventListener(
                "click",
                upgradeCity
            );


        /*
        CLOSE MODALS BY BACKGROUND
        */

        [landModal, buildModal]
            .forEach(modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target === modal
                        ) {

                            closeModal(modal);

                        }

                    }
                );

            });

    }


    /* =====================================================
       PANEL SWITCH
    ===================================================== */

    function switchPanel(panel) {

        document
            .querySelectorAll(".nav-button")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.panel === panel
                );

            });


        document
            .querySelectorAll(".panel-content")
            .forEach(content => {

                content.classList.toggle(
                    "active",
                    content.dataset.content === panel
                );

            });

    }


    /* =====================================================
       SELECT LAND
    ===================================================== */

    function selectPlot(id) {

        selectedPlot = id;


        document
            .querySelectorAll(".plot")
            .forEach(plot => {

                plot.classList.toggle(
                    "selected",
                    Number(plot.dataset.plotId) === id
                );

            });


        const owned =
            state.ownedPlots.find(
                p => p.id === id
            );


        renderLandPanel(
            id,
            owned
        );

    }


    /* =====================================================
       LAND PANEL
    ===================================================== */

    function renderLandPanel(
        id,
        owned
    ) {

        const container =
            $("selectedLand");


        if (owned) {

            const income =
                owned.area *
                CONFIG.landIncomePerHa;


            container.innerHTML = `

                <div class="land-card">

                    <div>

                        <div class="land-number">
                            #${String(id + 1).padStart(4, "0")}
                        </div>

                        <div style="
                            color:#4fd18b;
                            font-size:10px;
                            margin-top:5px;
                        ">
                            OWNED LAND
                        </div>

                    </div>


                    <div class="land-info">

                        <div class="land-info-item">

                            <span>AREA</span>

                            <strong>
                                ${owned.area} HA
                            </strong>

                        </div>


                        <div class="land-info-item">

                            <span>INCOME</span>

                            <strong>
                                +${income} VEL/H
                            </strong>

                        </div>

                    </div>


                    <button
                        id="openBuild"
                        class="main-button"
                    >
                        BUILD
                    </button>

                </div>

            `;


            $("openBuild")
                .addEventListener(
                    "click",
                    () => {

                        buildModal
                            .classList.remove(
                                "hidden"
                            );

                    }
                );


        } else {

            container.innerHTML = `

                <div class="land-card">

                    <div>

                        <div class="land-number">
                            #${String(id + 1).padStart(4, "0")}
                        </div>

                        <div style="
                            color:#7d8594;
                            font-size:10px;
                            margin-top:5px;
                        ">
                            FREE TERRITORY
                        </div>

                    </div>


                    <div class="land-info">

                        <div class="land-info-item">

                            <span>1 HA</span>

                            <strong>$10</strong>

                        </div>


                        <div class="land-info-item">

                            <span>2 HA</span>

                            <strong>$20</strong>

                        </div>


                        <div class="land-info-item">

                            <span>4 HA</span>

                            <strong>$40</strong>

                        </div>


                        <div class="land-info-item">

                            <span>INCOME</span>

                            <strong>2 VEL/H</strong>

                        </div>

                    </div>


                    <button
                        class="main-button"
                        data-buy-land="1"
                    >
                        BUY 1 HA — $10
                    </button>


                    <button
                        class="secondary-button"
                        data-buy-land="2"
                    >
                        BUY 2 HA — $20
                    </button>


                    <button
                        class="secondary-button"
                        data-buy-land="4"
                    >
                        BUY 4 HA — $40
                    </button>

                </div>

            `;


            container
                .querySelectorAll(
                    "[data-buy-land]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            buyLand(
                                id,
                                Number(
                                    button.dataset.buyLand
                                )
                            );

                        }
                    );

                });

        }

    }


    /* =====================================================
       BUY LAND
    ===================================================== */

    function buyLand(
        id,
        area
    ) {

        const price =
            CONFIG.landPrices[area];


        if (
            state.ownedPlots.some(
                plot => plot.id === id
            )
        ) {

            notify(
                "Этот участок уже принадлежит вам."
            );

            return;

        }


        if (state.cash < price) {

            notify(
                `Недостаточно денег. Нужно $${price}.`
            );

            return;

        }


        state.cash -= price;


        state.ownedPlots.push({

            id: id,

            area: area,

            purchasedAt: Date.now()

        });


        state.treasury += price;


        addEvent(
            `Гражданин приобрёл ${area} га земли за $${price}.`
        );


        saveState();

        createPlots();

        selectPlot(id);

        updateUI();

        notify(
            `Участок #${id + 1} приобретён.`
        );

    }


    /* =====================================================
       PASSIVE LAND INCOME
    ===================================================== */

    function calculateLandIncome() {

        return state.ownedPlots.reduce(
            (total, plot) => {

                return total +
                    plot.area *
                    CONFIG.landIncomePerHa;

            },
            0
        );

    }


    function generateIncome() {

        const now = Date.now();

        const elapsed =
            now - state.lastIncome;


        if (elapsed < 3600000) {

            return;

        }


        const hours =
            Math.floor(
                elapsed / 3600000
            );


        const incomePerHour =
            calculateLandIncome();


        if (incomePerHour > 0) {

            const income =
                incomePerHour *
                hours;


            state.vel += income;


            addEvent(
                `Земля принесла +${income} VEL.`
            );

        }


        state.lastIncome = now;

        saveState();

    }


    /* =====================================================
       WORK
    ===================================================== */

    function work(jobType) {

        resetDailyWork();


        const job =
            CONFIG.jobs[jobType];


        if (!job) return;


        if (
            state.work.clicks >=
            job.clicks
        ) {

            notify(
                "Сегодня лимит работы уже выполнен."
            );

            return;

        }


        state.work.job =
            jobType;


        state.work.clicks++;


        if (
            state.work.clicks >=
            job.clicks
        ) {

            state.vel += job.salary;


            state.treasury +=
                Math.floor(
                    job.salary * .10
                );


            state.population +=
                Math.random() > .8
                    ? 1
                    : 0;


            state.economy =
                Math.min(
                    100,
                    state.economy + .3
                );


            addEvent(
                `${jobType.toUpperCase()}: гражданин получил ${job.salary} VEL.`
            );


            notify(
                `Рабочая смена завершена. +${job.salary} VEL`
            );

        }


        saveState();

        updateUI();

    }


    /* =====================================================
       RESET DAILY WORK
    ===================================================== */

    function resetDailyWork() {

        const today =
            getDayKey();


        if (
            state.work.lastReset !==
            today
        ) {

            state.work.clicks = 0;

            state.work.job = null;

            state.work.lastReset =
                today;

            saveState();

        }

    }


    /* =====================================================
       RESOURCES
    ===================================================== */

    function produceResources() {

        state.buildings.forEach(
            building => {

                if (
                    building.type === "farm"
                ) {

                    state.resources.food += .05;

                }


                if (
                    building.type === "mine"
                ) {

                    state.resources.ore += .04;

                }


                if (
                    building.type === "factory"
                ) {

                    state.resources.goods += .03;

                }

            }
        );

    }


    /* =====================================================
       SELL RESOURCE
    ===================================================== */

    function sellResource(type) {

        const prices = {

            food: 2,

            ore: 4,

            goods: 7

        };


        const amount =
            Math.floor(
                state.resources[type]
            );


        if (amount <= 0) {

            notify(
                "Недостаточно ресурсов."
            );

            return;

        }


        const revenue =
            amount *
            prices[type];


        state.resources[type] -= amount;

        state.treasury +=
            Math.floor(
                revenue * .1
            );

        state.vel +=
            Math.floor(
                revenue * .9
            );


        state.economy =
            Math.min(
                100,
                state.economy + .2
            );


        addEvent(
            `Продано ${amount} ед. ресурса за ${revenue} VEL.`
        );


        saveState();

        updateUI();

    }


    /* =====================================================
       BANK
    ===================================================== */

    function deposit() {

        const amount =
            Number(
                $("bankAmount").value
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            notify(
                "Введите корректную сумму."
            );

            return;

        }


        if (
            state.vel < amount
        ) {

            notify(
                "Недостаточно VEL."
            );

            return;

        }


        state.vel -= amount;

        state.bank.balance +=
            amount;


        state.bank.lastInterest =
            Date.now();


        saveState();

        updateUI();

        notify(
            `В банк внесено ${amount} VEL.`
        );

    }


    function withdraw() {

        const amount =
            Number(
                $("bankAmount").value
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            notify(
                "Введите корректную сумму."
            );

            return;

        }


        if (
            state.bank.balance <
            amount
        ) {

            notify(
                "Недостаточно средств на депозите."
            );

            return;

        }


        state.bank.balance -=
            amount;

        state.vel +=
            amount;


        saveState();

        updateUI();

        notify(
            `Выведено ${amount} VEL.`
        );

    }


    function processBankInterest() {

        const now =
            Date.now();


        const elapsed =
            now -
            state.bank.lastInterest;


        if (
            elapsed <
            3600000
        ) {

            return;

        }


        const hours =
            Math.floor(
                elapsed / 3600000
            );


        if (
            state.bank.balance > 0
        ) {

            const hourlyRate =
                CONFIG.bankAPY /
                100 /
                8760;


            const interest =
                state.bank.balance *
                hourlyRate *
                hours;


            state.bank.balance +=
                interest;

        }


        state.bank.lastInterest =
            now;


        saveState();

    }


    /* =====================================================
       CITY HALL
    ===================================================== */

    function upgradeCity() {

        const cost =
            1000 +
            state.development *
            1000;


        if (
            state.vel < cost
        ) {

            notify(
                `Нужно ${cost} VEL.`
            );

            return;

        }


        state.vel -= cost;

        state.development++;

        state.economy =
            Math.min(
                100,
                state.economy + 5
            );


        addEvent(
            `City Hall улучшен до уровня ${state.development}.`
        );


        saveState();

        updateUI();

        notify(
            "City Hall улучшен."
        );

    }


    /* =====================================================
       BUILD
    ===================================================== */

    function build(type) {

        if (
            selectedPlot === null
        ) {

            notify(
                "Сначала выберите участок."
            );

            return;

        }


        const owned =
            state.ownedPlots.find(
                plot =>
                    plot.id === selectedPlot
            );


        if (!owned) {

            notify(
                "Строить можно только на своей земле."
            );

            return;

        }


        if (
            state.buildings.some(
                b =>
                    b.plotId ===
                    selectedPlot
            )
        ) {

            notify(
                "На этом участке уже есть здание."
            );

            return;

        }


        const building =
            CONFIG.buildings[type];


        if (!building) return;


        if (
            state.vel <
            building.price
        ) {

            notify(
                `Нужно ${building.price} VEL.`
            );

            return;

        }


        state.vel -=
            building.price;


        const row =
            Math.floor(
                selectedPlot /
                CONFIG.cols
            );


        const col =
            selectedPlot %
            CONFIG.cols;


        const x =
            ((col + .5) /
                CONFIG.cols) *
            100;


        const y =
            ((row + .5) /
                CONFIG.rows) *
            100;


        state.buildings.push({

            id:
                Date.now(),

            type:

                type,

            plotId:

                selectedPlot,

            x:

                x,

            y:

                y

        });


        state.development++;

        state.economy =
            Math.min(
                100,
                state.economy + 1
            );


        addEvent(
            `Построено здание: ${type.toUpperCase()}.`
        );


        saveState();

        renderBuildings();

        closeModal(
            buildModal
        );

        updateUI();

        notify(
            `${type.toUpperCase()} построен.`
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function addEvent(text) {

        state.events.unshift({

            text: text,

            time: Date.now()

        });


        state.events =
            state.events.slice(
                0,
                20
            );

    }


    function renderEvents() {

        const container =
            $("eventList");


        container.innerHTML = "";


        state.events.forEach(
            event => {

                const element =
                    document.createElement(
                        "div"
                    );

                element.className =
                    "event";


                element.innerHTML = `

                    <div>
                        ${escapeHtml(event.text)}
                    </div>

                    <div class="event-time">
                        ${formatTime(event.time)}
                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );

    }


    /* =====================================================
       UI UPDATE
    ===================================================== */

    function updateUI() {

        resetDailyWork();

        generateIncome();

        processBankInterest();

        produceResources();


        $("velBalance").textContent =
            formatNumber(
                Math.floor(
                    state.vel
                )
            );


        $("velIncome").textContent =
            `${calculateLandIncome()} VEL/h`;


        $("economyValue").textContent =
            Math.floor(
                state.economy
            );


        $("citizenId").textContent =
            state.citizen.id;


        $("population").textContent =
            state.population;


        $("populationText").textContent =
            state.population;


        $("developmentText").textContent =
            state.development;


        $("treasuryText").textContent =
            `${Math.floor(
                state.treasury
            )} VEL`;


        $("foodAmount").textContent =
            Math.floor(
                state.resources.food
            );


        $("oreAmount").textContent =
            Math.floor(
                state.resources.ore
            );


        $("goodsAmount").textContent =
            Math.floor(
                state.resources.goods
            );


        $("bankBalance").textContent =
            `${Math.floor(
                state.bank.balance
            )} VEL`;


        $("bankApr").textContent =
            `${CONFIG.bankAPY}%`;


        $("workClicks").textContent =
            state.work.clicks;


        const progress =
            Math.min(
                100,
                state.work.clicks
            );


        $("workProgress")
            .style.width =
            `${progress}%`;


        renderEvents();


        if (
            selectedPlot !== null
        ) {

            const owned =
                state.ownedPlots.find(
                    p =>
                        p.id ===
                        selectedPlot
                );


            renderLandPanel(
                selectedPlot,
                owned
            );

        }


        saveState();

    }


    /* =====================================================
       ZOOM
    ===================================================== */

    function updateZoom() {

        map.style.transform =
            `translate(-50%, -50%) scale(${zoom})`;


        $("zoomValue").textContent =
            `${Math.round(
                zoom * 100
            )}%`;

    }


    /* =====================================================
       MODALS
    ===================================================== */

    function closeModal(modal) {

        modal.classList.add(
            "hidden"
        );

    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer = null;


    function notify(message) {

        toastText.textContent =
            message;


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                2200
            );

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function getDayKey() {

        const date =
            new Date();


        return [
            date.getFullYear(),

            date.getMonth(),

            date.getDate()

        ].join("-");

    }


    function formatNumber(number) {

        return Number(
            number
        ).toLocaleString(
            "ru-RU"
        );

    }


    function formatTime(timestamp) {

        return new Date(
            timestamp
        ).toLocaleTimeString(
            "ru-RU",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function escapeHtml(text) {

        return String(text)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       GAME LOOP
    ===================================================== */

    function startGameLoop() {

        setInterval(
            () => {

                generateIncome();

                processBankInterest();

                produceResources();

                updateUI();

            },
            10000
        );

    }


    /*
    ========================================================
    DEBUG
    ========================================================
    */

    window.VELLAR = {

        state,

        reset: () => {

            localStorage.removeItem(
                CONFIG.storageKey
            );

            location.reload();

        },

        addVEL: amount => {

            state.vel +=
                Number(amount);

            saveState();

            updateUI();

        }

    };


});
