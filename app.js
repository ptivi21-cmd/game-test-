/* =========================================================
   VELLAR DIGITAL REPUBLIC
   Local Prototype
   Version 1.0
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {

        COLS: 40,
        ROWS: 25,

        TOTAL_PLOTS: 1000,

        LAND_PRICES: {
            1: 10,
            2: 20,
            4: 40
        },

        LAND_INCOME: 2,

        START_VEL: 2500,

        START_TREASURY: 10000,

        ECONOMY: 50,

        DEVELOPMENT: 1,

        TAX: 10,

        BANK_APY: 10,

        STORAGE_KEY: "vellar_complete_v1"

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = id => document.getElementById(id);

    const format = number => {

        return Math.floor(number)
            .toLocaleString("ru-RU");

    };

    const now = () => {

        return new Date()
            .toLocaleTimeString(
                "ru-RU",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    };


    /* =====================================================
       GAME STATE
    ===================================================== */

    let state = {

        citizen: {

            id: "#0001",

            name: "Founder",

            country: "Vellar",

            joined: new Date().toISOString()

        },

        vel: CONFIG.START_VEL,

        treasury: CONFIG.START_TREASURY,

        economy: CONFIG.ECONOMY,

        development: CONFIG.DEVELOPMENT,

        population: 1,

        tax: CONFIG.TAX,

        selectedPlot: null,

        ownedPlots: [],

        landIncome: 0,

        zoom: 100,

        bank: {

            balance: 0,

            interest: 0,

            lastUpdate: Date.now()

        },

        resources: {

            food: 0,

            metal: 0,

            goods: 0

        },

        playerBuildings: [],

        events: [],

        jobs: {

            farm: 0,

            factory: 0,

            mine: 0

        },

        dailyWork: {

            farm: 0,

            factory: 0,

            mine: 0

        },

        lastWorkDay:
            new Date().toDateString()

    };


    /* =====================================================
       STATE BUILDINGS
    ===================================================== */

    const stateBuildings = [

        {
            id: "cityhall",
            type: "cityhall",
            name: "City Hall",
            emoji: "🏛",
            x: 410,
            y: 255
        },

        /* MINES */

        {
            id: "mine1",
            type: "mine",
            name: "Mine #1",
            emoji: "⛏",
            x: 70,
            y: 75
        },

        {
            id: "mine2",
            type: "mine",
            name: "Mine #2",
            emoji: "⛏",
            x: 160,
            y: 430
        },

        {
            id: "mine3",
            type: "mine",
            name: "Mine #3",
            emoji: "⛏",
            x: 700,
            y: 70
        },

        {
            id: "mine4",
            type: "mine",
            name: "Mine #4",
            emoji: "⛏",
            x: 730,
            y: 460
        },

        /* FACTORIES */

        {
            id: "factory1",
            type: "factory",
            name: "Factory #1",
            emoji: "🏭",
            x: 270,
            y: 80
        },

        {
            id: "factory2",
            type: "factory",
            name: "Factory #2",
            emoji: "🏭",
            x: 330,
            y: 80
        },

        {
            id: "factory3",
            type: "factory",
            name: "Factory #3",
            emoji: "🏭",
            x: 580,
            y: 80
        },

        {
            id: "factory4",
            type: "factory",
            name: "Factory #4",
            emoji: "🏭",
            x: 640,
            y: 80
        },

        {
            id: "factory5",
            type: "factory",
            name: "Factory #5",
            emoji: "🏭",
            x: 80,
            y: 230
        },

        {
            id: "factory6",
            type: "factory",
            name: "Factory #6",
            emoji: "🏭",
            x: 140,
            y: 230
        },

        {
            id: "factory7",
            type: "factory",
            name: "Factory #7",
            emoji: "🏭",
            x: 690,
            y: 230
        },

        {
            id: "factory8",
            type: "factory",
            name: "Factory #8",
            emoji: "🏭",
            x: 750,
            y: 230
        },

        {
            id: "factory9",
            type: "factory",
            name: "Factory #9",
            emoji: "🏭",
            x: 260,
            y: 470
        },

        {
            id: "factory10",
            type: "factory",
            name: "Factory #10",
            emoji: "🏭",
            x: 600,
            y: 470
        },

        /* FARMS */

        {
            id: "farm1",
            type: "farm",
            name: "Farm #1",
            emoji: "🌾",
            x: 30,
            y: 145
        },

        {
            id: "farm2",
            type: "farm",
            name: "Farm #2",
            emoji: "🌾",
            x: 90,
            y: 145
        },

        {
            id: "farm3",
            type: "farm",
            name: "Farm #3",
            emoji: "🌾",
            x: 150,
            y: 145
        },

        {
            id: "farm4",
            type: "farm",
            name: "Farm #4",
            emoji: "🌾",
            x: 730,
            y: 145
        },

        {
            id: "farm5",
            type: "farm",
            name: "Farm #5",
            emoji: "🌾",
            x: 790,
            y: 145
        },

        {
            id: "farm6",
            type: "farm",
            name: "Farm #6",
            emoji: "🌾",
            x: 30,
            y: 370
        },

        {
            id: "farm7",
            type: "farm",
            name: "Farm #7",
            emoji: "🌾",
            x: 90,
            y: 370
        },

        {
            id: "farm8",
            type: "farm",
            name: "Farm #8",
            emoji: "🌾",
            x: 150,
            y: 370
        },

        {
            id: "farm9",
            type: "farm",
            name: "Farm #9",
            emoji: "🌾",
            x: 730,
            y: 370
        },

        {
            id: "farm10",
            type: "farm",
            name: "Farm #10",
            emoji: "🌾",
            x: 790,
            y: 370
        },

        {
            id: "farm11",
            type: "farm",
            name: "Farm #11",
            emoji: "🌾",
            x: 300,
            y: 530
        },

        {
            id: "farm12",
            type: "farm",
            name: "Farm #12",
            emoji: "🌾",
            x: 370,
            y: 530
        },

        {
            id: "farm13",
            type: "farm",
            name: "Farm #13",
            emoji: "🌾",
            x: 510,
            y: 530
        },

        {
            id: "farm14",
            type: "farm",
            name: "Farm #14",
            emoji: "🌾",
            x: 580,
            y: 530
        },

        {
            id: "farm15",
            type: "farm",
            name: "Farm #15",
            emoji: "🌾",
            x: 650,
            y: 530
        }

    ];


    /* =====================================================
       STORAGE
    ===================================================== */

    function save() {

        localStorage.setItem(
            CONFIG.STORAGE_KEY,
            JSON.stringify(state)
        );

    }


    function load() {

        const saved =
            localStorage.getItem(
                CONFIG.STORAGE_KEY
            );

        if (!saved) return;

        try {

            const parsed =
                JSON.parse(saved);

            state = {
                ...state,
                ...parsed,

                citizen: {
                    ...state.citizen,
                    ...(parsed.citizen || {})
                },

                bank: {
                    ...state.bank,
                    ...(parsed.bank || {})
                },

                resources: {
                    ...state.resources,
                    ...(parsed.resources || {})
                },

                jobs: {
                    ...state.jobs,
                    ...(parsed.jobs || {})
                },

                dailyWork: {
                    ...state.dailyWork,
                    ...(parsed.dailyWork || {})
                }

            };

        } catch (error) {

            console.error(
                "Ошибка загрузки:",
                error
            );

        }

    }


    /* =====================================================
       PLOTS
    ===================================================== */

    function createPlots() {

        const layer = $("plotLayer");

        layer.innerHTML = "";

        for (
            let i = 0;
            i < CONFIG.TOTAL_PLOTS;
            i++
        ) {

            const plot =
                document.createElement("button");

            plot.className = "plot";

            plot.type = "button";

            plot.dataset.plotId = i;

            plot.title =
                `Участок #${String(i + 1).padStart(4,"0")}`;

            if (
                state.ownedPlots.includes(i)
            ) {

                plot.classList.add("owned");

            }

            layer.appendChild(plot);

        }

    }


    /* =====================================================
       BUILDINGS
    ===================================================== */

    function renderBuildings() {

        const layer =
            $("buildingLayer");

        layer.innerHTML = "";


        stateBuildings.forEach(
            building => {

                const element =
                    document.createElement("div");

                element.className =
                    `building ${building.type}`;

                element.style.left =
                    `${building.x}px`;

                element.style.top =
                    `${building.y}px`;

                element.textContent =
                    building.emoji;

                element.title =
                    building.name;

                layer.appendChild(element);

            }
        );


        state.playerBuildings
            .forEach(
                building => {

                    const element =
                        document.createElement("div");

                    element.className =
                        "building player";

                    element.style.left =
                        `${building.x}px`;

                    element.style.top =
                        `${building.y}px`;

                    element.textContent =
                        building.emoji;

                    element.title =
                        building.name;

                    layer.appendChild(element);

                }
            );

    }


    /* =====================================================
       PLOT SELECTION
    ===================================================== */

    function selectPlot(id) {

        id = Number(id);

        state.selectedPlot = id;

        document
            .querySelectorAll(".plot.selected")
            .forEach(
                el =>
                    el.classList.remove("selected")
            );

        const plot =
            document.querySelector(
                `.plot[data-plot-id="${id}"]`
            );

        if (plot) {

            plot.classList.add("selected");

        }

        renderSelectedPlot();

    }


    function renderSelectedPlot() {

        const title =
            $("selectedTitle");

        const description =
            $("selectedDescription");

        const info =
            $("selectedInfo");

        const actions =
            $("landActions");


        if (
            state.selectedPlot === null
        ) {

            title.textContent =
                "Выберите участок";

            description.textContent =
                "Нажмите на участок территории, чтобы посмотреть информацию.";

            info.innerHTML = "";

            actions.innerHTML = "";

            return;

        }


        const id =
            state.selectedPlot;

        const owned =
            state.ownedPlots.includes(id);


        title.textContent =
            `Участок #${String(id + 1).padStart(4,"0")}`;

        description.textContent =
            owned
                ? "Этот участок принадлежит вам."
                : "Свободный участок территории Vellar.";


        info.innerHTML = `

            <div class="info-row">
                <span>Площадь</span>
                <strong>1 га</strong>
            </div>

            <div class="info-row">
                <span>Цена</span>
                <strong>$10</strong>
            </div>

            <div class="info-row">
                <span>Доход</span>
                <strong>2 VEL / час</strong>
            </div>

            <div class="info-row">
                <span>Статус</span>
                <strong>
                    ${owned ? "ВАШ" : "СВОБОДЕН"}
                </strong>
            </div>

        `;


        if (owned) {

            actions.innerHTML = `

                <button
                    class="action-button secondary"
                    data-action="plot-income"
                >
                    Получить информацию
                </button>

                <button
                    class="action-button danger"
                    data-action="sell-land"
                >
                    Продать участок
                </button>

            `;

        } else {

            actions.innerHTML = `

                <button
                    class="action-button"
                    data-action="buy-land"
                >
                    Купить 1 га — $10
                </button>

                <button
                    class="action-button secondary"
                    data-action="buy-2-land"
                >
                    Купить 2 га — $20
                </button>

                <button
                    class="action-button secondary"
                    data-action="buy-4-land"
                >
                    Купить 4 га — $40
                </button>

            `;

        }

    }


    /* =====================================================
       BUY LAND
    ===================================================== */

    function buyLand(amount) {

        const id =
            state.selectedPlot;

        if (id === null) {

            toast(
                "Сначала выберите участок"
            );

            return;

        }


        if (
            state.ownedPlots.includes(id)
        ) {

            toast(
                "Этот участок уже принадлежит вам"
            );

            return;

        }


        const price =
            CONFIG.LAND_PRICES[amount];


        /*
            В тестовой версии
            покупка земли идёт
            за тестовый USD-баланс.
        */

        if (
            !state.testCash
        ) {

            state.testCash = 100;

        }


        if (
            state.testCash < price
        ) {

            toast(
                `Недостаточно тестовых средств. Нужно $${price}.`
            );

            return;

        }


        state.testCash -= price;


        const plots = [];

        for (
            let i = 0;
            i < amount;
            i++
        ) {

            const next =
                id + i;

            if (
                next >= CONFIG.TOTAL_PLOTS
            ) break;

            if (
                !state.ownedPlots.includes(next)
            ) {

                plots.push(next);

            }

        }


        if (!plots.length) {

            toast(
                "Не удалось купить выбранную площадь."
            );

            return;

        }


        state.ownedPlots.push(
            ...plots
        );


        state.landIncome =
            state.ownedPlots.length *
            CONFIG.LAND_INCOME;


        addEvent(
            `Вы приобрели ${plots.length} га территории.`
        );


        save();

        createPlots();

        renderAll();

        selectPlot(id);

        toast(
            `Приобретено: ${plots.length} га`
        );

    }


    /* =====================================================
       SELL LAND
    ===================================================== */

    function sellLand() {

        const id =
            state.selectedPlot;

        if (id === null) return;


        const index =
            state.ownedPlots.indexOf(id);

        if (index === -1) return;


        state.ownedPlots.splice(
            index,
            1
        );


        if (!state.testCash) {
            state.testCash = 0;
        }


        state.testCash += 10;


        state.landIncome =
            state.ownedPlots.length *
            CONFIG.LAND_INCOME;


        addEvent(
            `Вы продали участок #${id + 1}.`
        );


        save();

        createPlots();

        renderAll();

        selectPlot(id);

        toast(
            "Участок продан за $10"
        );

    }


    /* =====================================================
       PASSIVE INCOME
    ===================================================== */

    function collectPassiveIncome() {

        const income =
            state.landIncome;


        if (
            income <= 0
        ) return;


        state.vel += income;

        state.treasury +=
            Math.floor(
                income *
                state.tax /
                100
            );


        addEvent(
            `Земля принесла ${income} VEL.`
        );

        save();

        renderAll();

    }


    /* =====================================================
       BANK
    ===================================================== */

    function updateBankInterest() {

        if (
            !state.bank.balance
        ) return;


        const nowTime =
            Date.now();

        const hours =
            (
                nowTime -
                state.bank.lastUpdate
            ) /
            3600000;


        if (hours <= 0) return;


        const interest =
            state.bank.balance *
            (
                CONFIG.BANK_APY /
                100
            ) *
            (
                hours /
                8760
            );


        state.bank.interest +=
            interest;

        state.bank.lastUpdate =
            nowTime;

    }


    function depositBank(amount) {

        amount =
            Number(amount);


        if (
            amount <= 0
        ) return;


        if (
            state.vel < amount
        ) {

            toast(
                "Недостаточно VEL"
            );

            return;

        }


        state.vel -= amount;

        state.bank.balance += amount;

        state.bank.lastUpdate =
            Date.now();


        addEvent(
            `В банк внесено ${format(amount)} VEL.`
        );


        save();

        renderAll();

    }


    function withdrawBank() {

        updateBankInterest();


        const total =
            state.bank.balance +
            state.bank.interest;


        if (
            total <= 0
        ) {

            toast(
                "На депозите ничего нет."
            );

            return;

        }


        state.vel += total;

        state.bank.balance = 0;

        state.bank.interest = 0;

        state.bank.lastUpdate =
            Date.now();


        addEvent(
            `Из банка получено ${format(total)} VEL.`
        );


        save();

        renderAll();

    }


    /* =====================================================
       WORK
    ===================================================== */

    function resetDailyWork() {

        const day =
            new Date().toDateString();


        if (
            state.lastWorkDay !== day
        ) {

            state.dailyWork = {

                farm: 0,

                factory: 0,

                mine: 0

            };

            state.lastWorkDay =
                day;

        }

    }


    const jobs = {

        farm: {

            name: "Ферма",

            salary: 25,

            icon: "🌾"

        },

        factory: {

            name: "Фабрика",

            salary: 40,

            icon: "🏭"

        },

        mine: {

            name: "Шахта",

            salary: 30,

            icon: "⛏"

        }

    };


    function doWork(type) {

        resetDailyWork();


        if (
            state.dailyWork[type] >= 100
        ) {

            toast(
                "Лимит 100 кликов на сегодня достигнут."
            );

            return;

        }


        state.dailyWork[type]++;


        if (
            state.dailyWork[type] === 100
        ) {

            const salary =
                jobs[type].salary;


            state.vel += salary;


            addEvent(
                `${jobs[type].name}: получена зарплата ${salary} VEL.`
            );


            toast(
                `Работа выполнена. +${salary} VEL`
            );

        }


        save();

        renderAll();

    }


    /* =====================================================
       MARKET
    ===================================================== */

    function sellResource(resource) {

        const prices = {

            food: 5,

            metal: 10,

            goods: 15

        };


        const names = {

            food: "Еда",

            metal: "Металл",

            goods: "Товары"

        };


        if (
            state.resources[resource] <= 0
        ) {

            toast(
                `У вас нет ресурса: ${names[resource]}`
            );

            return;

        }


        state.resources[resource]--;


        const revenue =
            prices[resource];


        state.vel += revenue;


        addEvent(
            `${names[resource]} проданы за ${revenue} VEL.`
        );


        save();

        renderAll();

    }


    /* =====================================================
       BUILDING
    ===================================================== */

    function buildBuilding(type) {

        const costs = {

            farm: 300,

            factory: 600,

            mine: 500

        };


        const data = {

            farm: {

                name: "Частная ферма",

                emoji: "🌾"

            },

            factory: {

                name: "Частная фабрика",

                emoji: "🏭"

            },

            mine: {

                name: "Частная шахта",

                emoji: "⛏"

            }

        };


        const cost =
            costs[type];


        if (
            state.vel < cost
        ) {

            toast(
                `Нужно ${cost} VEL`
            );

            return;

        }


        state.vel -= cost;


        const index =
            state.playerBuildings.length;


        const positions = [

            [200,120],

            [250,150],

            [600,150],

            [650,180],

            [200,400],

            [650,400],

            [350,450],

            [500,450]

        ];


        const position =
            positions[
                index %
                positions.length
            ];


        state.playerBuildings.push({

            type,

            name:
                `${data[type].name} #${index + 1}`,

            emoji:
                data[type].emoji,

            x:
                position[0],

            y:
                position[1]

        });


        state.development += 1;

        state.economy += 1;


        addEvent(
            `Построено предприятие: ${data[type].name}.`
        );


        save();

        renderBuildings();

        renderAll();

        toast(
            `${data[type].name} построена`
        );

    }


    /* =====================================================
       CITY HALL
    ===================================================== */

    function upgradeCity() {

        const cost =
            1000 *
            state.development;


        if (
            state.vel < cost
        ) {

            toast(
                `Нужно ${format(cost)} VEL`
            );

            return;

        }


        state.vel -= cost;

        state.development++;

        state.economy += 3;

        state.treasury += 250;


        addEvent(
            `City Hall улучшен до уровня ${state.development}.`
        );


        save();

        renderAll();

        toast(
            "Городская инфраструктура улучшена"
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    const randomEvents = [

        {
            text:
                "Рост производства",

            effect:
                () => {

                    state.economy += 2;

                }

        },

        {
            text:
                "Новый приток населения",

            effect:
                () => {

                    state.population++;

                }

        },

        {
            text:
                "Инвестиции в инфраструктуру",

            effect:
                () => {

                    state.development++;

                }

        },

        {
            text:
                "Снижение деловой активности",

            effect:
                () => {

                    state.economy =
                        Math.max(
                            1,
                            state.economy - 2
                        );

                }

        }

    ];


    function randomEvent() {

        const event =
            randomEvents[
                Math.floor(
                    Math.random() *
                    randomEvents.length
                )
            ];


        event.effect();


        addEvent(
            `Событие: ${event.text}`
        );


        save();

        renderAll();

    }


    /* =====================================================
       PANELS
    ===================================================== */

    function openPanel(panel) {

        switch(panel) {

            case "overview":

                showOverview();

                break;

            case "city":

                showCity();

                break;

            case "market":

                showMarket();

                break;

            case "bank":

                showBank();

                break;

            case "work":

                showWork();

                break;

            case "build":

                showBuild();

                break;

            case "events":

                showEvents();

                break;

        }

    }


    function showOverview() {

        openModal(`

            <div class="eyebrow">
                VELLAR
            </div>

            <h2>Республика Vellar</h2>

            <p>
                Ваша цифровая территория развивается
                через землю, производство, работу,
                рынок и государственные институты.
            </p>

            <div class="option-grid">

                <div class="option">

                    <div class="option-title">
                        ${format(state.ownedPlots.length)} га
                    </div>

                    <div class="option-description">
                        Ваша территория
                    </div>

                </div>

                <div class="option">

                    <div class="option-title">
                        ${format(state.landIncome)} VEL / час
                    </div>

                    <div class="option-description">
                        Пассивный доход от земли
                    </div>

                </div>

                <div class="option">

                    <div class="option-title">
                        ${state.population}
                    </div>

                    <div class="option-description">
                        Население Vellar
                    </div>

                </div>

            </div>

        `);

    }


    function showCity() {

        openModal(`

            <div class="eyebrow">
                GOVERNMENT
            </div>

            <h2>City Hall</h2>

            <p>
                Центральный административный центр Vellar.
            </p>

            <div class="option-grid">

                <div class="option">

                    <div class="option-title">
                        Казна
                    </div>

                    <div class="option-description">
                        ${format(state.treasury)} VEL
                    </div>

                </div>

                <div class="option">

                    <div class="option-title">
                        Экономика
                    </div>

                    <div class="option-description">
                        Индекс ${state.economy}
                    </div>

                </div>

                <div class="option">

                    <div class="option-title">
                        Развитие
                    </div>

                    <div class="option-description">
                        Уровень ${state.development}
                    </div>

                </div>

                <button
                    class="action-button"
                    data-action="upgrade-city"
                >
                    Улучшить City Hall
                </button>

            </div>

        `);

    }


    function showMarket() {

        openModal(`

            <div class="eyebrow">
                MARKET
            </div>

            <h2>Рынок Vellar</h2>

            <p>
                Ресурсы предприятий могут быть
                проданы государству.
            </p>

            <div class="option-grid">

                <div class="option">

                    <div class="option-title">
                        🌾 Еда
                    </div>

                    <div class="option-description">
                        ${state.resources.food}
                        шт. · 5 VEL
                    </div>

                    <button
                        class="action-button"
                        data-action="sell-food"
                    >
                        Продать
                    </button>

                </div>


                <div class="option">

                    <div class="option-title">
                        ⛏ Металл
                    </div>

                    <div class="option-description">
                        ${state.resources.metal}
                        шт. · 10 VEL
                    </div>

                    <button
                        class="action-button"
                        data-action="sell-metal"
                    >
                        Продать
                    </button>

                </div>


                <div class="option">

                    <div class="option-title">
                        🏭 Товары
                    </div>

                    <div class="option-description">
                        ${state.resources.goods}
                        шт. · 15 VEL
                    </div>

                    <button
                        class="action-button"
                        data-action="sell-goods"
                    >
                        Продать
                    </button>

                </div>

            </div>

        `);

    }


    function showBank() {

        updateBankInterest();


        openModal(`

            <div class="eyebrow">
                VELLAR BANK
            </div>

            <h2>Государственный банк</h2>

            <p>
                Текущая ставка:
                <strong>
                    ${CONFIG.BANK_APY}% APY
                </strong>
            </p>


            <div class="option-grid">

                <div class="option">

                    <div class="option-title">
                        Депозит
                    </div>

                    <div class="option-description">

                        Основной баланс:
                        ${format(state.bank.balance)}
                        VEL

                        <br>

                        Начислено:
                        ${state.bank.interest.toFixed(2)}
                        VEL

                    </div>

                </div>


                <button
                    class="action-button"
                    data-action="deposit-100"
                >
                    Положить 100 VEL
                </button>


                <button
                    class="action-button"
                    data-action="deposit-500"
                >
                    Положить 500 VEL
                </button>


                <button
                    class="action-button secondary"
                    data-action="withdraw-bank"
                >
                    Забрать депозит
                </button>

            </div>

        `);

    }


    function showWork() {

        resetDailyWork();


        openModal(`

            <div class="eyebrow">
                LABOR MARKET
            </div>

            <h2>Работа</h2>

            <p>
                Игроки могут работать на предприятиях.
                Для выполнения смены необходимо
                сделать 100 кликов.
            </p>

            <div class="option-grid">


                <div class="option">

                    <div class="option-title">
                        🌾 Ферма — 25 VEL
                    </div>

                    <div class="option-description">

                        Прогресс:
                        ${state.dailyWork.farm}/100

                    </div>

                    <button
                        class="action-button"
                        data-action="work-farm"
                    >
                        Сделать клик
                    </button>

                </div>


                <div class="option">

                    <div class="option-title">
                        🏭 Фабрика — 40 VEL
                    </div>

                    <div class="option-description">

                        Прогресс:
                        ${state.dailyWork.factory}/100

                    </div>

                    <button
                        class="action-button"
                        data-action="work-factory"
                    >
                        Сделать клик
                    </button>

                </div>


                <div class="option">

                    <div class="option-title">
                        ⛏ Шахта — 30 VEL
                    </div>

                    <div class="option-description">

                        Прогресс:
                        ${state.dailyWork.mine}/100

                    </div>

                    <button
                        class="action-button"
                        data-action="work-mine"
                    >
                        Сделать клик
                    </button>

                </div>

            </div>

        `);

    }


    function showBuild() {

        openModal(`

            <div class="eyebrow">
                DEVELOPMENT
            </div>

            <h2>Строительство</h2>

            <p>
                Предприятия покупаются за VEL.
                Они создают экономическую активность
                и рабочие места.
            </p>

            <div class="option-grid">


                <div class="option">

                    <div class="option-title">
                        🌾 Ферма
                    </div>

                    <div class="option-description">
                        Стоимость: 300 VEL
                    </div>

                    <button
                        class="action-button"
                        data-action="build-farm"
                    >
                        Построить
                    </button>

                </div>


                <div class="option">

                    <div class="option-title">
                        🏭 Фабрика
                    </div>

                    <div class="option-description">
                        Стоимость: 600 VEL
                    </div>

                    <button
                        class="action-button"
                        data-action="build-factory"
                    >
                        Построить
                    </button>

                </div>


                <div class="option">

                    <div class="option-title">
                        ⛏ Шахта
                    </div>

                    <div class="option-description">
                        Стоимость: 500 VEL
                    </div>

                    <button
                        class="action-button"
                        data-action="build-mine"
                    >
                        Построить
                    </button>

                </div>

            </div>

        `);

    }


    function showEvents() {

        openModal(`

            <div class="eyebrow">
                EVENTS
            </div>

            <h2>События Vellar</h2>

            <p>
                Экономические события влияют
                на развитие государства.
            </p>

            <button
                class="action-button"
                data-action="random-event"
            >
                Создать тестовое событие
            </button>

            <div
                style="
                    margin-top:20px;
                    color:#7d8999;
                    font-size:11px;
                "
            >

                Последние события:

            </div>

            <div style="margin-top:10px">

                ${
                    state.events
                    .slice(0,10)
                    .map(
                        e =>
                            `<div class="activity">
                                ${e.time} — ${e.text}
                            </div>`
                    )
                    .join("")
                }

            </div>

        `);

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openModal(content) {

        $("modalContent").innerHTML =
            content;

        $("modalOverlay")
            .classList.add("visible");

    }


    function closeModal() {

        $("modalOverlay")
            .classList.remove("visible");

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function toast(message) {

        const container =
            $("toastContainer");


        const element =
            document.createElement("div");

        element.className =
            "toast";

        element.textContent =
            message;


        container.appendChild(
            element
        );


        setTimeout(
            () => {

                element.remove();

            },
            3000
        );

    }


    /* =====================================================
       EVENTS LOG
    ===================================================== */

    function addEvent(text) {

        state.events.unshift({

            time: now(),

            text

        });


        if (
            state.events.length > 50
        ) {

            state.events =
                state.events.slice(0,50);

        }

        renderActivity();

    }


    function renderActivity() {

        const log =
            $("activityLog");


        if (!state.events.length) {

            log.innerHTML = `
                <div class="activity">
                    Пока нет событий.
                </div>
            `;

            return;

        }


        log.innerHTML =
            state.events
                .slice(0,8)
                .map(
                    event => `

                        <div class="activity">

                            <span class="activity-time">
                                ${event.time}
                            </span>

                            <br>

                            ${event.text}

                        </div>

                    `
                )
                .join("");

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderAll() {

        updateBankInterest();

        resetDailyWork();


        state.landIncome =
            state.ownedPlots.length *
            CONFIG.LAND_INCOME;


        $("velBalance").textContent =
            format(state.vel);


        $("velIncome").textContent =
            `${format(state.landIncome)}/h`;


        $("economyValue").textContent =
            state.economy;


        $("citizenId").textContent =
            state.citizen.id;


        $("populationValue").textContent =
            state.population;


        $("landValue").textContent =
            `${state.ownedPlots.length} / 1000 га`;


        $("treasuryValue").textContent =
            `${format(state.treasury)} VEL`;


        $("taxValue").textContent =
            `${state.tax}%`;


        $("developmentValue").textContent =
            state.development;


        $("overviewLand").textContent =
            state.ownedPlots.length;


        $("overviewIncome").textContent =
            format(state.landIncome);


        $("overviewEconomy").textContent =
            state.economy;


        $("overviewDevelopment").textContent =
            state.development;


        $("zoomValue").textContent =
            `${state.zoom}%`;


        $("map").style.transform =
            `scale(${state.zoom / 100})`;


        renderActivity();

        renderSelectedPlot();

    }


    /* =====================================================
       NAVIGATION EVENTS
    ===================================================== */

    document
        .querySelectorAll(".nav-button")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".nav-button"
                            )
                            .forEach(
                                b =>
                                    b.classList.remove(
                                        "active"
                                    )
                            );

                        button.classList.add(
                            "active"
                        );


                        openPanel(
                            button.dataset.panel
                        );

                    }
                );

            }
        );


    /* =====================================================
       MAP CLICK EVENT
    ===================================================== */

    $("plotLayer")
        .addEventListener(
            "click",
            event => {

                const plot =
                    event.target.closest(
                        ".plot"
                    );

                if (!plot) return;

                selectPlot(
                    plot.dataset.plotId
                );

            }
        );


    /* =====================================================
       ACTION DELEGATION
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const action =
                event.target.closest(
                    "[data-action]"
                );


            if (!action) return;


            const type =
                action.dataset.action;


            switch(type) {

                case "buy-land":

                    buyLand(1);

                    break;


                case "buy-2-land":

                    buyLand(2);

                    break;


                case "buy-4-land":

                    buyLand(4);

                    break;


                case "sell-land":

                    sellLand();

                    break;


                case "plot-income":

                    toast(
                        `Доход участка: ${CONFIG.LAND_INCOME} VEL/час`
                    );

                    break;


                case "deposit-100":

                    depositBank(100);

                    break;


                case "deposit-500":

                    depositBank(500);

                    break;


                case "withdraw-bank":

                    withdrawBank();

                    break;


                case "work-farm":

                    doWork("farm");

                    break;


                case "work-factory":

                    doWork("factory");

                    break;


                case "work-mine":

                    doWork("mine");

                    break;


                case "sell-food":

                    sellResource("food");

                    break;


                case "sell-metal":

                    sellResource("metal");

                    break;


                case "sell-goods":

                    sellResource("goods");

                    break;


                case "build-farm":

                    buildBuilding("farm");

                    break;


                case "build-factory":

                    buildBuilding("factory");

                    break;


                case "build-mine":

                    buildBuilding("mine");

                    break;


                case "upgrade-city":

                    upgradeCity();

                    break;


                case "random-event":

                    randomEvent();

                    break;

            }

        }
    );


    /* =====================================================
       MODAL EVENTS
    ===================================================== */

    $("closeModal")
        .addEventListener(
            "click",
            closeModal
        );


    $("modalOverlay")
        .addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("modalOverlay")
                ) {

                    closeModal();

                }

            }
        );


    /* =====================================================
       ZOOM
    ===================================================== */

    $("zoomIn")
        .addEventListener(
            "click",
            () => {

                state.zoom =
                    Math.min(
                        140,
                        state.zoom + 10
                    );

                renderAll();

            }
        );


    $("zoomOut")
        .addEventListener(
            "click",
            () => {

                state.zoom =
                    Math.max(
                        70,
                        state.zoom - 10
                    );

                renderAll();

            }
        );


    /* =====================================================
       RESET
    ===================================================== */

    $("resetGame")
        .addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Сбросить весь тестовый прогресс Vellar?"
                    );


                if (!confirmed) return;


                localStorage.removeItem(
                    CONFIG.STORAGE_KEY
                );


                location.reload();

            }
        );


    /* =====================================================
       GAME LOOP
    ===================================================== */

    setInterval(
        () => {

            collectPassiveIncome();

        },
        60 * 60 * 1000
    );


    /*
        Для теста доход обновляем также
        при открытии страницы.
    */

    setInterval(
        () => {

            updateBankInterest();

            save();

        },
        10000
    );


    /* =====================================================
       START
    ===================================================== */

    load();

    createPlots();

    renderBuildings();

    renderAll();

    selectPlot(null);

    addEvent(
        "Vellar запущен. Добро пожаловать, Founder."
    );

});
