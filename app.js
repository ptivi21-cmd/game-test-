(() => {
  "use strict";

  /*
    VELLAR LOCAL GAME ENGINE
    -------------------------
    Локальная версия игры.
    Все игровые данные сохраняются в localStorage.
    Позже localStorage можно заменить на API/backend.
  */

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

    initialTestCash: 100,
    initialVEL: 2500,

    startingEconomy: 62,

    taxRate: 0.10,
    bankAPY: 0.10,

    storageKey: "vellar_local_v2"
  };


  // =========================================================
  // BUILDINGS
  // =========================================================

  const BUILDINGS = {

    cityhall: {
      name: "City Hall",
      icon: "🏛",
      type: "state",
      cost: 0
    },

    mine: {
      name: "Mine",
      icon: "⛏",
      type: "state",
      cost: 0,
      count: 4
    },

    factory: {
      name: "Factory",
      icon: "🏭",
      type: "state",
      cost: 0,
      count: 10
    },

    farm: {
      name: "Farm",
      icon: "🌾",
      type: "state",
      cost: 0,
      count: 15
    },

    house: {
      name: "Residence",
      icon: "⌂",
      type: "player",
      cost: 120
    },

    warehouse: {
      name: "Warehouse",
      icon: "▣",
      type: "player",
      cost: 220
    },

    solar: {
      name: "Solar Plant",
      icon: "☀",
      type: "player",
      cost: 300
    },

    shopping: {
      name: "Shopping Center",
      icon: "◆",
      type: "player",
      cost: 500
    },

    research: {
      name: "Research Center",
      icon: "✦",
      type: "player",
      cost: 800
    }

  };


  // =========================================================
  // RESOURCES
  // =========================================================

  const RESOURCE_DEFS = {

    gold: {
      name: "Gold",
      icon: "◆",
      value: 18
    },

    iron: {
      name: "Iron",
      icon: "⬟",
      value: 8
    },

    oil: {
      name: "Oil",
      icon: "◉",
      value: 11
    },

    wood: {
      name: "Wood",
      icon: "▰",
      value: 5
    },

    food: {
      name: "Food",
      icon: "✦",
      value: 4
    },

    energy: {
      name: "Energy",
      icon: "ϟ",
      value: 7
    },

    crystal: {
      name: "Crystal",
      icon: "◇",
      value: 25
    },

    ore: {
      name: "Rare Ore",
      icon: "⬢",
      value: 30
    }

  };


  // =========================================================
  // EVENTS
  // =========================================================

  const EVENTS = [

    {
      title: "Trade corridor opened",
      text: "Regional logistics improved.",
      economy: 3
    },

    {
      title: "Industrial demand",
      text: "Factories are operating above baseline.",
      economy: 2
    },

    {
      title: "Harvest season",
      text: "Farms receive a temporary production boost.",
      economy: 1
    },

    {
      title: "Market volatility",
      text: "Resource prices are moving sharply.",
      economy: -2
    },

    {
      title: "Infrastructure works",
      text: "Development received a public investment.",
      economy: 2
    }

  ];


  // =========================================================
  // DOM
  // =========================================================

  const $ = (id) => document.getElementById(id);

  const plotLayer = $("plotLayer");
  const buildingLayer = $("buildingLayer");


  // =========================================================
  // DEFAULT STATE
  // =========================================================

  const defaultState = () => ({

    citizen: true,

    citizenName: "Founder",

    citizenId: "0001",

    balanceVEL: CONFIG.initialVEL,

    testCash: CONFIG.initialTestCash,

    ownedPlots: [],

    selectedPlot: null,

    economy: CONFIG.startingEconomy,

    development: 18,

    population: 1,

    taxRate: CONFIG.taxRate,

    bank: {

      deposited: 0,

      lastInterest: Date.now()

    },

    resources: {

      gold: 12,

      iron: 38,

      oil: 22,

      wood: 60,

      food: 45,

      energy: 30,

      crystal: 5,

      ore: 4

    },

    jobs: {

      farm: {
        clicks: 0,
        done: false
      },

      factory: {
        clicks: 0,
        done: false
      },

      mine: {
        clicks: 0,
        done: false
      }

    },

    built: {},

    stateBuildings: {},

    lastUpdate: Date.now(),

    lastDay: new Date().toDateString(),

    eventLog: [
      "Republic systems online."
    ]

  });


  // =========================================================
  // GLOBAL GAME STATE
  // =========================================================

  let state = loadState();

  let zoom = 1;

  let plotsVisible = true;

  let currentPanel = "overview";

  let toastTimer = null;


  // =========================================================
  // LOAD / SAVE
  // =========================================================

  function loadState() {

    try {

      const raw = localStorage.getItem(CONFIG.storageKey);

      if (!raw) {

        return defaultState();

      }

      const saved = JSON.parse(raw);

      return merge(defaultState(), saved);

    }

    catch (e) {

      console.warn("Save load failed", e);

      return defaultState();

    }

  }


  function merge(base, saved) {

    const result = {
      ...base,
      ...saved
    };

    result.bank = {
      ...base.bank,
      ...(saved.bank || {})
    };

    result.resources = {
      ...base.resources,
      ...(saved.resources || {})
    };

    result.jobs = {
      ...base.jobs,
      ...(saved.jobs || {})
    };

    result.built = saved.built || {};

    result.stateBuildings = saved.stateBuildings || {};

    result.ownedPlots = Array.isArray(saved.ownedPlots)
      ? saved.ownedPlots
      : [];

    result.eventLog = Array.isArray(saved.eventLog)
      ? saved.eventLog
      : base.eventLog;

    return result;

  }


  function saveState() {

    localStorage.setItem(
      CONFIG.storageKey,
      JSON.stringify(state)
    );

  }


  // =========================================================
  // RESET
  // =========================================================

  function resetState() {

    if (
      !confirm(
        "Reset the local Vellar test? All local progress will be deleted."
      )
    ) {

      return;

    }

    state = defaultState();

    saveState();

    setupStateBuildings();

    renderAll();

    showToast("Local test reset.");

  }


  // =========================================================
  // FORMAT
  // =========================================================

  function format(n, digits = 0) {

    return Number(n || 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }
    );

  }


  // =========================================================
  // LAND
  // =========================================================

  function ownedCount() {

    return state.ownedPlots.length;

  }


  function incomePerHour() {

    return (
      ownedCount() * CONFIG.landIncomePerHa
      +
      playerIncomeBonus()
    );

  }


  function playerIncomeBonus() {

    let bonus = 0;

    Object.values(state.built).forEach(type => {

      if (type === "solar") {

        bonus += 1;

      }

      if (type === "research") {

        bonus += 3;

      }

      if (type === "shopping") {

        bonus += 2;

      }

    });

    return bonus;

  }


  // =========================================================
  // PASSIVE INCOME
  // =========================================================

  function accrue() {

    const now = Date.now();

    const deltaHours = Math.max(
      0,
      Math.min(
        (now - state.lastUpdate) / 3600000,
        24
      )
    );


    if (deltaHours > 0) {

      state.balanceVEL +=
        incomePerHour() *
        deltaHours;

    }


    // BANK INTEREST

    const bankHours = Math.max(
      0,
      Math.min(
        (now - state.bank.lastInterest) / 3600000,
        24 * 30
      )
    );


    if (
      state.bank.deposited > 0 &&
      bankHours > 0
    ) {

      state.balanceVEL +=
        state.bank.deposited *
        CONFIG.bankAPY *
        bankHours /
        8760;

      state.bank.lastInterest = now;

    }


    state.lastUpdate = now;


    // DAILY JOB RESET

    const today = new Date().toDateString();

    if (today !== state.lastDay) {

      Object.values(state.jobs).forEach(job => {

        job.clicks = 0;

        job.done = false;

      });

      state.lastDay = today;

    }

  }


  // =========================================================
  // RENDER ALL
  // =========================================================

  function renderAll() {

    accrue();

    renderTop();

    renderResources();

    renderPlots();

    renderBuildings();

    renderPanel();

    saveState();

  }


  // =========================================================
  // TOP BAR
  // =========================================================

  function renderTop() {

    $("velBalance").textContent =
      format(state.balanceVEL, 1);

    $("velIncome").textContent =
      format(incomePerHour(), 1);

    $("economyValue").textContent =
      `${Math.round(state.economy)}%`;

    $("cashValue").textContent =
      format(state.testCash, 0);

    $("citizenName").textContent =
      state.citizenName;

    $("citizenId").textContent =
      `#${state.citizenId}`;

    $("ownedCount").textContent =
      ownedCount();

    $("landIncome").textContent =
      format(incomePerHour(), 1);

    $("selectedPlot").textContent =
      state.selectedPlot !== null
        ? `#${String(state.selectedPlot + 1).padStart(4, "0")}`
        : "None";

    $("zoomReadout").textContent =
      `${Math.round(zoom * 100)}%`;

  }


  // =========================================================
  // RESOURCES
  // =========================================================

  function renderResources() {

    $("resourceRow").innerHTML =
      Object.entries(RESOURCE_DEFS)
        .map(([key, r]) => `

          <div class="resource">

            <div class="resource-top">

              <span class="resource-icon">
                ${r.icon}
              </span>

              <b>
                ${r.name}
              </b>

              <span class="resource-value">
                ${format(state.resources[key])}
              </span>

            </div>

            <small>
              market ${r.value} VEL
            </small>

          </div>

        `)
        .join("");

  }


  // =========================================================
  // MAP PLOTS
  // =========================================================

  function renderPlots() {

    const owned =
      new Set(state.ownedPlots);

    const statePlots =
      new Set(
        Object.keys(state.stateBuildings)
          .map(Number)
      );


    // CREATE 1000 PLOTS ONLY ONCE

    if (!plotLayer.dataset.ready) {

      plotLayer.innerHTML = "";

      for (
        let i = 0;
        i < CONFIG.totalPlots;
        i++
      ) {

        const btn =
          document.createElement("button");

        btn.className = "plot";

        btn.type = "button";

        btn.dataset.index = i;

        btn.innerHTML =
          `<span class="plot-num">
            ${i + 1}
          </span>`;

        btn.addEventListener(
          "click",
          () => selectPlot(i)
        );

        plotLayer.appendChild(btn);

      }

      plotLayer.dataset.ready = "1";

    }


    [...plotLayer.children]
      .forEach((el, i) => {

        el.className = "plot";


        if (!plotsVisible) {

          el.classList.add(
            "hidden-grid"
          );

        }


        if (owned.has(i)) {

          el.classList.add("owned");

        }


        if (statePlots.has(i)) {

          el.classList.add("state");

        }


        if (state.selectedPlot === i) {

          el.classList.add("selected");

        }


        if (!statePlots.has(i)) {

          el.classList.add(
            "buildable"
          );

        }

      });


    plotLayer.classList.toggle(
      "show-plots",
      plotsVisible
    );

  }


  // =========================================================
  // MAP BUILDINGS
  // =========================================================

  function renderBuildings() {

    buildingLayer.innerHTML = "";


    const stateEntries =
      Object.entries(
        state.stateBuildings
      );

    const builtEntries =
      Object.entries(
        state.built
      );


    [
      ...stateEntries,
      ...builtEntries
    ]
      .forEach(([index, type]) => {

        const i = Number(index);

        const def = BUILDINGS[type];

        if (!def) return;


        const col =
          i % CONFIG.cols;

        const row =
          Math.floor(
            i / CONFIG.cols
          );


        const x =
          ((col + 0.5) /
            CONFIG.cols) *
          100;

        const y =
          ((row + 0.5) /
            CONFIG.rows) *
          100;


        const el =
          document.createElement("div");

        el.className =
          `map-building ${
            type === "cityhall"
              ? "cityhall"
              : ""
          }`;

        el.style.left =
          `${x}%`;

        el.style.top =
          `${y}%`;

        el.innerHTML = `

          <span>
            ${def.icon}
          </span>

          <small>
            ${def.name}
          </small>

        `;

        buildingLayer.appendChild(el);

      });

  }


  // =========================================================
  // STATE BUILDINGS
  // =========================================================

  function setupStateBuildings() {

    if (
      Object.keys(
        state.stateBuildings
      ).length
    ) {

      return;

    }


    const place = (
      index,
      type
    ) => {

      state.stateBuildings[index] =
        type;

    };


    // CITY HALL

    place(
      498,
      "cityhall"
    );


    // 4 MINES

    const mines = [
      47,
      78,
      911,
      949
    ];


    // 10 FACTORIES

    const factories = [
      332,
      347,
      362,
      377,
      392,
      607,
      622,
      637,
      652,
      667
    ];


    // 15 FARMS

    const farms = [
      125,
      142,
      159,
      176,
      193,
      806,
      823,
      840,
      857,
      874,
      925,
      942,
      959,
      976,
      993
    ];


    mines.forEach(
      i => place(i, "mine")
    );

    factories.forEach(
      i => place(i, "factory")
    );

    farms.forEach(
      i => place(i, "farm")
    );

  }


  // =========================================================
  // SELECT PLOT
  // =========================================================

  function selectPlot(index) {

    state.selectedPlot =
      index;


    const type =
      state.stateBuildings[index];


    if (type) {

      openPanel("city");

      showToast(
        `${BUILDINGS[type].name} — state property.`
      );

    }

    else {

      openPanel("overview");

    }


    renderAll();

  }


  // =========================================================
  // FIND LAND BUNDLE
  // =========================================================

  function getBundle(
    start,
    size
  ) {

    const occupied =
      new Set([
        ...state.ownedPlots,

        ...Object.keys(
          state.stateBuildings
        ).map(Number),

        ...Object.keys(
          state.built
        ).map(Number)
      ]);


    const result = [];


    const startCol =
      start % CONFIG.cols;

    const startRow =
      Math.floor(
        start / CONFIG.cols
      );


    const candidates = [

      [0, 0],

      [1, 0],
      [-1, 0],

      [0, 1],
      [0, -1],

      [2, 0],
      [-2, 0],

      [0, 2],
      [0, -2],

      [1, 1],
      [1, -1],

      [-1, 1],
      [-1, -1]

    ];


    for (
      const [dx, dy]
      of candidates
    ) {

      const col =
        startCol + dx;

      const row =
        startRow + dy;


      if (
        col < 0 ||
        col >= CONFIG.cols ||
        row < 0 ||
        row >= CONFIG.rows
      ) {

        continue;

      }


      const index =
        row * CONFIG.cols +
        col;


      if (
        !occupied.has(index)
      ) {

        result.push(index);

      }


      if (
        result.length === size
      ) {

        break;

      }

    }


    // FALLBACK

    if (
      result.length < size
    ) {

      for (
        let i = 0;
        i < CONFIG.totalPlots &&
        result.length < size;
        i++
      ) {

        if (
          !occupied.has(i) &&
          !result.includes(i)
        ) {

          result.push(i);

        }

      }

    }


    return result.slice(
      0,
      size
    );

  }


  // =========================================================
  // BUY LAND
  // =========================================================

  function buyLand(size) {

    const price =
      CONFIG.landPrices[size];


    if (
      state.testCash < price
    ) {

      showToast(
        `Not enough test land funds. Need $${price}.`
      );

      return;

    }


    const start =
      state.selectedPlot ??
      findFirstFreePlot();


    const bundle =
      getBundle(
        start,
        size
      );


    if (
      bundle.length !== size
    ) {

      showToast(
        "Not enough free adjacent plots."
      );

      return;

    }


    state.testCash -= price;


    state.ownedPlots.push(
      ...bundle
    );


    state.selectedPlot =
      bundle[0];


    state.development +=
      size * 0.4;


    state.economy +=
      size * 0.15;


    logEvent(
      `Acquired ${size} hectare${
        size > 1 ? "s" : ""
      }.`
    );


    showToast(
      `Purchased ${size} ha for $${price}.`
    );


    renderAll();

  }


  // =========================================================
  // FIND FIRST FREE
  // =========================================================

  function findFirstFreePlot() {

    const occupied =
      new Set([
        ...state.ownedPlots,

        ...Object.keys(
          state.stateBuildings
        ).map(Number),

        ...Object.keys(
          state.built
        ).map(Number)
      ]);


    for (
      let i = 0;
      i < CONFIG.totalPlots;
      i++
    ) {

      if (
        !occupied.has(i)
      ) {

        return i;

      }

    }


    return 0;

  }


  // =========================================================
  // MARKET
  // =========================================================

  function sellResource(key) {

    const amount =
      Math.floor(
        state.resources[key]
      );


    if (amount <= 0) {

      showToast(
        `No ${RESOURCE_DEFS[key].name} available.`
      );

      return;

    }


    const gross =
      amount *
      RESOURCE_DEFS[key].value;


    const tax =
      gross *
      state.taxRate;


    const net =
      gross - tax;


    state.resources[key] = 0;


    state.balanceVEL +=
      net;


    state.economy =
      Math.min(
        100,
        state.economy + 0.5
      );


    logEvent(
      `Sold ${amount} ${RESOURCE_DEFS[key].name} for ${format(net)} VEL.`
    );


    renderAll();


    showToast(
      `+${format(net)} VEL from ${RESOURCE_DEFS[key].name}.`
    );

  }


  // =========================================================
  // WORK
  // =========================================================

  function work(type) {

    const job =
      state.jobs[type];


    if (job.done) {

      showToast(
        "This shift is already completed today."
      );

      return;

    }


    job.clicks += 1;


    if (
      job.clicks >= 100
    ) {

      job.clicks = 100;

      job.done = true;


      const salary =
        type === "farm"
          ? 25
          : type === "factory"
            ? 40
            : 30;


      state.balanceVEL +=
        salary;


      state.population +=
        1;


      state.economy =
        Math.min(
          100,
          state.economy + 0.4
        );


      logEvent(
        `Completed ${type} shift. Salary +${salary} VEL.`
      );


      showToast(
        `Shift complete. +${salary} VEL.`
      );

    }


    renderAll();

  }


  // =========================================================
  // BANK DEPOSIT
  // =========================================================

  function bankDeposit() {

    const amount =
      Math.floor(
        Math.min(
          state.balanceVEL,
          500
        )
      );


    if (amount < 1) {

      showToast(
        "You need VEL to deposit."
      );

      return;

    }


    state.balanceVEL -=
      amount;


    state.bank.deposited +=
      amount;


    state.bank.lastInterest =
      Date.now();


    showToast(
      `Deposited ${amount} VEL.`
    );


    renderAll();

  }


  // =========================================================
  // BANK WITHDRAW
  // =========================================================

  function bankWithdraw() {

    if (
      state.bank.deposited <= 0
    ) {

      showToast(
        "Bank balance is empty."
      );

      return;

    }


    const amount =
      state.bank.deposited;


    state.bank.deposited = 0;


    state.balanceVEL +=
      amount;


    showToast(
      `Withdrawn ${format(amount)} VEL.`
    );


    renderAll();

  }


  // =========================================================
  // BUILD
  // =========================================================

  function build(type) {

    const def =
      BUILDINGS[type];


    if (
      !def ||
      def.type !== "player"
    ) {

      return;

    }


    const plot =
      state.selectedPlot;


    if (
      plot === null
    ) {

      showToast(
        "Select an owned plot first."
      );

      return;

    }


    if (
      !state.ownedPlots.includes(
        plot
      )
    ) {

      showToast(
        "You can only build on land you own."
      );

      return;

    }


    if (
      state.built[plot]
    ) {

      showToast(
        "This plot already has a building."
      );

      return;

    }


    if (
      state.balanceVEL <
      def.cost
    ) {

      showToast(
        `Need ${def.cost} VEL.`
      );

      return;

    }


    state.balanceVEL -=
      def.cost;


    state.built[plot] =
      type;


    state.development +=
      1.5;


    state.economy =
      Math.min(
        100,
        state.economy + 1
      );


    logEvent(
      `${def.name} constructed on plot #${String(plot + 1).padStart(4, "0")}.`
    );


    showToast(
      `${def.name} built.`
    );


    renderAll();

  }


  // =========================================================
  // CITY HALL UPGRADE
  // =========================================================

  function upgradeCity() {

    const cost =
      Math.round(
        400 +
        state.development * 8
      );


    if (
      state.balanceVEL < cost
    ) {

      showToast(
        `City Hall upgrade needs ${cost} VEL.`
      );

      return;

    }


    state.balanceVEL -=
      cost;


    state.development =
      Math.min(
        100,
        state.development + 5
      );


    state.economy =
      Math.min(
        100,
        state.economy + 3
      );


    logEvent(
      "City Hall upgraded."
    );


    showToast(
      "City Hall development +5."
    );


    renderAll();

  }


  // =========================================================
  // RANDOM EVENT
  // =========================================================

  function triggerEvent() {

    const e =
      EVENTS[
        Math.floor(
          Math.random() *
          EVENTS.length
        )
      ];


    state.economy =
      Math.max(
        0,
        Math.min(
          100,
          state.economy +
          e.economy
        )
      );


    if (
      e.economy > 0
    ) {

      state.balanceVEL +=
        20;

    }


    logEvent(
      `${e.title}: ${e.text}`
    );


    showToast(
      e.title
    );


    renderAll();

  }


  // =========================================================
  // EVENT LOG
  // =========================================================

  function logEvent(text) {

    state.eventLog.unshift(
      text
    );


    state.eventLog =
      state.eventLog.slice(
        0,
        8
      );

  }


  // =========================================================
  // PANELS
  // =========================================================

  function openPanel(panel) {

    currentPanel =
      panel;


    document
      .querySelectorAll(
        ".nav-btn[data-panel]"
      )
      .forEach(btn => {

        btn.classList.toggle(
          "active",
          btn.dataset.panel ===
          panel
        );

      });


    renderPanel();

  }


  function renderPanel() {

    const titles = {

      overview:
        "Republic Overview",

      city:
        "City Hall",

      market:
        "Market",

      bank:
        "Vellar Bank",

      work:
        "Work Center",

      events:
        "Events",

      build:
        "Construction"

    };


    $("panelTitle").textContent =
      titles[currentPanel] ||
      "Republic Overview";


    const renderers = {

      overview:
        overviewPanel,

      city:
        cityPanel,

      market:
        marketPanel,

      bank:
        bankPanel,

      work:
        workPanel,

      events:
        eventsPanel,

      build:
        buildPanel

    };


    $("panelContent").innerHTML =
      (
        renderers[currentPanel] ||
        overviewPanel
      )();


    bindPanelActions();

  }


  // =========================================================
  // OVERVIEW PANEL
  // =========================================================

  function overviewPanel() {

    const plot =
      state.selectedPlot;


    const stateBuilding =
      plot !== null
        ? state.stateBuildings[plot]
        : null;


    const playerBuilding =
      plot !== null
        ? state.built[plot]
        : null;


    let plotCard = `

      <div class="card">

        <div class="card-title">

          <span>
            Territory
          </span>

          <span class="eyebrow">
            1000 HA
          </span>

        </div>


        <div class="value-big">

          ${ownedCount()}

          <small
            style="
              font-size:10px;
              color:var(--muted)
            "
          >
            ha owned
          </small>

        </div>


        <div class="card-sub">

          Every owned hectare produces
          ${CONFIG.landIncomePerHa}
          VEL/hour.

          Land income is calculated
          locally and saved in your browser.

        </div>


        <div class="land-options">

          ${[1, 2, 4]
            .map(
              size => `

                <button
                  class="land-option buy-size"
                  data-size="${size}"
                >

                  <b>
                    ${size}
                  </b>

                  <span>
                    hectare${size > 1 ? "s" : ""}
                  </span>

                  <strong>
                    $${CONFIG.landPrices[size]}
                  </strong>

                </button>

              `
            )
            .join("")}

        </div>

      </div>

    `;


    if (
      plot !== null
    ) {

      const status =
        stateBuilding
          ? "State property"
          : playerBuilding
            ? BUILDINGS[playerBuilding].name
            : state.ownedPlots.includes(plot)
              ? "Your land"
              : "Free";


      plotCard += `

        <div class="card">

          <div class="card-title">

            <span>
              Plot #${String(
                plot + 1
              ).padStart(4, "0")}
            </span>

            <span>
              ${status}
            </span>

          </div>


          <div
            class="data-grid"
            style="margin-top:9px"
          >

            <div class="data-cell">

              <span>
                AREA
              </span>

              <strong>
                1 ha
              </strong>

            </div>


            <div class="data-cell">

              <span>
                INCOME
              </span>

              <strong>
                +2 VEL/h
              </strong>

            </div>


            <div class="data-cell">

              <span>
                OWNER
              </span>

              <strong>

                ${
                  stateBuilding
                    ? "REPUBLIC"
                    : state.ownedPlots.includes(plot)
                      ? "YOU"
                      : "FREE"
                }

              </strong>

            </div>


            <div class="data-cell">

              <span>
                BUILDING
              </span>

              <strong>
                ${status}
              </strong>

            </div>

          </div>


          ${
            !stateBuilding &&
            !state.ownedPlots.includes(plot)

              ? `

                <button
                  class="action gold buy-size"
                  data-size="1"
                >

                  <strong>
                    Acquire this hectare — $10
                  </strong>

                  <small>
                    Uses local test funds.
                    No real payment.
                  </small>

                </button>

              `

              : ""
          }

        </div>

      `;

    }


    return (

      plotCard +

      `

        <div class="card">

          <div class="card-title">

            <span>
              State indicators
            </span>

            <span>
              ${Math.round(
                state.economy
              )}%
            </span>

          </div>


          <div class="card-sub">

            Economic development

          </div>


          <div class="progress">

            <i
              style="
                width:${state.economy}%
              "
            ></i>

          </div>


          <div
            class="data-grid"
            style="margin-top:10px"
          >

            <div class="data-cell">

              <span>
                DEVELOPMENT
              </span>

              <strong>
                ${Math.round(
                  state.development
                )}%
              </strong>

            </div>


            <div class="data-cell">

              <span>
                POPULATION
              </span>

              <strong>
                ${format(
                  state.population
                )}
              </strong>

            </div>

          </div>

        </div>


        <button
          class="action"
          data-open="city"
        >

          <strong>
            Open City Hall
          </strong>

          <small>
            Manage the republic and infrastructure.
          </small>

        </button>


        <button
          class="action"
          data-open="market"
        >

          <strong>
            Open Market
          </strong>

          <small>
            Sell produced resources for VEL.
          </small>

        </button>

      `

    );

  }


  // =========================================================
  // CITY HALL
  // =========================================================

  function cityPanel() {

    const buildingCounts = {

      mine: 0,

      factory: 0,

      farm: 0

    };


    Object.values(
      state.stateBuildings
    )
      .forEach(type => {

        if (
          buildingCounts[type] !==
          undefined
        ) {

          buildingCounts[type]++;

        }

      });


    return `

      <div class="card">

        <div class="card-title">

          <span>
            Vellar Administration
          </span>

          <span class="eyebrow">
            CAPITAL
          </span>

        </div>


        <div
          class="data-grid"
          style="margin-top:9px"
        >

          <div class="data-cell">

            <span>
              TREASURY
            </span>

            <strong>
              ${format(
                state.balanceVEL
              )} VEL
            </strong>

          </div>


          <div class="data-cell">

            <span>
              TAX
            </span>

            <strong>
              ${Math.round(
                state.taxRate * 100
              )}%
            </strong>

          </div>


          <div class="data-cell">

            <span>
              POPULATION
            </span>

            <strong>
              ${format(
                state.population
              )}
            </strong>

          </div>


          <div class="data-cell">

            <span>
              DEVELOPMENT
            </span>

            <strong>
              ${Math.round(
                state.development
              )}%
            </strong>

          </div>

        </div>

      </div>


      <div class="card">

        <div class="card-title">

          <span>
            State enterprises
          </span>

        </div>


        <div
          class="data-grid"
          style="margin-top:9px"
        >

          <div class="data-cell">

            <span>
              MINES
            </span>

            <strong>
              ${buildingCounts.mine}/4
            </strong>

          </div>


          <div class="data-cell">

            <span>
              FACTORIES
            </span>

            <strong>
              ${buildingCounts.factory}/10
            </strong>

          </div>


          <div class="data-cell">

            <span>
              FARMS
            </span>

            <strong>
              ${buildingCounts.farm}/15
            </strong>

          </div>


          <div class="data-cell">

            <span>
              LAND
            </span>

            <strong>
              ${ownedCount()}/1000 ha
            </strong>

          </div>

        </div>

      </div>


      <div class="card">

        <div class="card-title">

          <span>
            City Hall upgrade
          </span>

        </div>


        <div class="card-sub">

          Upgrade development and
          increase the economic index.

        </div>


        <button
          class="action gold"
          id="upgradeCity"
        >

          <strong>
            Upgrade City Hall
          </strong>

          <small>
            Current development:
            ${Math.round(
              state.development
            )}%
          </small>

        </button>

      </div>


      <div class="asset-preview"></div>

    `;

  }


  // =========================================================
  // MARKET PANEL
  // =========================================================

  function marketPanel() {

    return `

      <div class="card">

        <div class="card-title">

          <span>
            Resource Exchange
          </span>

          <span class="eyebrow">
            VEL MARKET
          </span>

        </div>


        <div class="card-sub">

          Sell your stored resources.

          A ${Math.round(
            state.taxRate * 100
          )}% state tax is applied to sales.

        </div>

      </div>


      ${
        Object.entries(
          RESOURCE_DEFS
        )
        .map(
          ([key, r]) => `

            <div class="card">

              <div class="card-title">

                <span>
                  ${r.icon} ${r.name}
                </span>

                <span>
                  ${format(
                    state.resources[key]
                  )}
                </span>

              </div>


              <div class="card-sub">

                Unit value:
                ${r.value} VEL

              </div>


              <button
                class="action"
                data-sell="${key}"
              >

                <strong>

                  Sell all —
                  ${format(
                    Math.floor(
                      state.resources[key]
                    ) *
                    r.value *
                    (1 - state.taxRate)
                  )}
                  VEL net

                </strong>

              </button>

            </div>

          `
        )
        .join("")
      }

    `;

  }


  // =========================================================
  // BANK PANEL
  // =========================================================

  function bankPanel() {

    const bank =
      state.bank.deposited;


    const hourly =
      bank *
      CONFIG.bankAPY /
      8760;


    return `

      <div class="card">

        <div class="card-title">

          <span>
            Vellar Bank
          </span>

          <span class="eyebrow">
            ${Math.round(
              CONFIG.bankAPY * 100
            )}% APY
          </span>

        </div>


        <div class="value-big">

          ${format(
            bank,
            1
          )}

          VEL

        </div>


        <div class="card-sub">

          Deposited balance.

          Prototype interest accrues
          locally over real time.

        </div>


        <div
          class="data-grid"
          style="margin-top:10px"
        >

          <div class="data-cell">

            <span>
              HOURLY RATE
            </span>

            <strong>
              +${format(
                hourly,
                4
              )} VEL
            </strong>

          </div>


          <div class="data-cell">

            <span>
              AVAILABLE
            </span>

            <strong>
              ${format(
                state.balanceVEL,
                1
              )} VEL
            </strong>

          </div>

        </div>


        <button
          class="action gold"
          id="bankDeposit"
        >

          <strong>
            Deposit 500 VEL
          </strong>

          <small>
            Interest starts immediately.
          </small>

        </button>


        <button
          class="action"
          id="bankWithdraw"
        >

          <strong>
            Withdraw full deposit
          </strong>

          <small>
            Returns principal to your VEL balance.
          </small>

        </button>

      </div>


      <div class="card">

        <div class="card-title">

          <span>
            Loan system
          </span>

          <span class="eyebrow">
            LATER
          </span>

        </div>


        <div class="card-sub">

          SA-backed loans will be connected
          to the backend in the financial phase.

          This local version intentionally
          does not simulate real collateral.

        </div>

      </div>

    `;

  }


  // =========================================================
  // WORK PANEL
  // =========================================================

  function workPanel() {

    const labels = {

      farm: "Farm",

      factory: "Factory",

      mine: "Mine"

    };


    const salaries = {

      farm: 25,

      factory: 40,

      mine: 30

    };


    return `

      <div class="card">

        <div class="card-title">

          <span>
            Daily Work
          </span>

          <span class="eyebrow">
            100 CLICKS
          </span>

        </div>


        <div class="card-sub">

          Complete one shift to receive
          the prototype salary.

          Progress resets each day.

        </div>

      </div>


      ${
        Object.keys(
          state.jobs
        )
        .map(type => {

          const job =
            state.jobs[type];


          const pct =
            Math.min(
              100,
              job.clicks
            );


          return `

            <div class="card">

              <div class="card-title">

                <span>
                  ${labels[type]}
                </span>

                <span>
                  +${salaries[type]} VEL
                </span>

              </div>


              <div class="progress">

                <i
                  style="
                    width:${pct}%
                  "
                ></i>

              </div>


              <div class="card-sub">

                ${job.clicks}/100 clicks

                ${
                  job.done
                    ? " — completed"
                    : ""
                }

              </div>


              <button
                class="action"
                data-work="${type}"
                ${job.done ? "disabled" : ""}
              >

                <strong>

                  ${
                    job.done
                      ? "Shift complete"
                      : "WORK / CLICK"
                  }

                </strong>


                <small>
                  Complete the daily shift.
                </small>

              </button>

            </div>

          `;

        })
        .join("")
      }

    `;

  }


  // =========================================================
  // EVENTS PANEL
  // =========================================================

  function eventsPanel() {

    return `

      <div class="card">

        <div class="card-title">

          <span>
            State Events
          </span>

          <span class="eyebrow">
            LIVE
          </span>

        </div>


        <div class="card-sub">

          Random events modify the local
          economic index.

          Later these will come from
          the server.

        </div>


        <button
          class="action gold"
          id="randomEvent"
        >

          <strong>
            Trigger test event
          </strong>

          <small>
            Development testing only.
          </small>

        </button>

      </div>


      ${
        state.eventLog
          .map(
            (e, i) => `

              <div class="card">

                <div class="card-title">

                  <span>
                    ${
                      i === 0
                        ? "LATEST"
                        : "LOG"
                    }
                  </span>

                  <span>
                    ${i + 1}
                  </span>

                </div>


                <div class="card-sub">

                  ${e}

                </div>

              </div>

            `
          )
          .join("")
      }

    `;

  }


  // =========================================================
  // BUILD PANEL
  // =========================================================

  function buildPanel() {

    const types = [

      "house",

      "warehouse",

      "solar",

      "shopping",

      "research"

    ];


    return `

      <div class="card">

        <div class="card-title">

          <span>
            Construction
          </span>

          <span class="eyebrow">
            PLAYER LAND
          </span>

        </div>


        <div class="card-sub">

          Select one of your owned plots
          on the map, then construct
          a building.

          Buildings cost VEL and modify
          development.

        </div>


        <div
          class="card-sub"
          style="margin-top:8px"
        >

          Selected:

          <strong>

            ${
              state.selectedPlot !== null

                ? "#" +
                  String(
                    state.selectedPlot + 1
                  ).padStart(
                    4,
                    "0"
                  )

                : "none"
            }

          </strong>

        </div>

      </div>


      ${
        types
          .map(type => {

            const b =
              BUILDINGS[type];


            return `

              <button
                class="action"
                data-build="${type}"
              >

                <strong>

                  ${b.icon}
                  ${b.name}
                  —
                  ${b.cost}
                  VEL

                </strong>


                <small>

                  ${
                    type === "house"

                      ? "+population"

                      : type === "solar"

                        ? "+1 VEL/h"

                        : type === "research"

                          ? "+3 VEL/h"

                          : "increases development"
                  }

                </small>

              </button>

            `;

          })
          .join("")
      }

    `;

  }


  // =========================================================
  // PANEL EVENTS
  // =========================================================

  function bindPanelActions() {

    document
      .querySelectorAll(
        ".buy-size"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () =>
            buyLand(
              Number(
                btn.dataset.size
              )
            )
        );

      });


    document
      .querySelectorAll(
        "[data-open]"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () =>
            openPanel(
              btn.dataset.open
            )
        );

      });


    document
      .querySelectorAll(
        "[data-sell]"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () =>
            sellResource(
              btn.dataset.sell
            )
        );

      });


    document
      .querySelectorAll(
        "[data-work]"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () =>
            work(
              btn.dataset.work
            )
        );

      });


    document
      .querySelectorAll(
        "[data-build]"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () =>
            build(
              btn.dataset.build
            )
        );

      });


    $("upgradeCity")
      ?.addEventListener(
        "click",
        upgradeCity
      );


    $("bankDeposit")
      ?.addEventListener(
        "click",
        bankDeposit
      );


    $("bankWithdraw")
      ?.addEventListener(
        "click",
        bankWithdraw
      );


    $("randomEvent")
      ?.addEventListener(
        "click",
        triggerEvent
      );

  }


  // =========================================================
  // TOAST
  // =========================================================

  function showToast(text) {

    const toast =
      $("toast");


    toast.textContent =
      text;


    toast.classList.add(
      "show"
    );


    clearTimeout(
      toastTimer
    );


    toastTimer =
      setTimeout(
        () =>
          toast.classList.remove(
            "show"
          ),
        2600
      );

  }


  // =========================================================
  // MODAL
  // =========================================================

  function openModal(html) {

    $("modalContent").innerHTML =
      html;


    $("modalBackdrop")
      .classList.add(
        "open"
      );

  }


  function closeModal() {

    $("modalBackdrop")
      .classList.remove(
        "open"
      );

  }


  // =========================================================
  // BUY LAND MODAL
  // =========================================================

  function openBuyLandModal() {

    openModal(`

      <div class="eyebrow">
        LAND OFFICE
      </div>


      <h3>
        Acquire Vellar Territory
      </h3>


      <p>

        This is a local test purchase.

        No real money is charged.

        The test wallet starts with
        $${CONFIG.initialTestCash}.

      </p>


      <div class="modal-grid">

        ${[1, 2, 4]
          .map(
            size => `

              <button
                class="action gold buy-size-modal"
                data-size="${size}"
              >

                <strong>

                  ${size}
                  hectare${size > 1 ? "s" : ""}
                  —
                  $${CONFIG.landPrices[size]}

                </strong>


                <small>

                  +
                  ${
                    size *
                    CONFIG.landIncomePerHa
                  }
                  VEL/hour

                </small>

              </button>

            `
          )
          .join("")}

      </div>

    `);


    document
      .querySelectorAll(
        ".buy-size-modal"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () => {

            buyLand(
              Number(
                btn.dataset.size
              )
            );

            closeModal();

          }
        );

      });

  }


  // =========================================================
  // ZOOM
  // =========================================================

  function setZoom(next) {

    zoom =
      Math.max(
        0.8,
        Math.min(
          2.2,
          next
        )
      );


    $("mapWorld").style.transform =
      `scale(${zoom})`;


    $("zoomReadout").textContent =
      `${Math.round(
        zoom * 100
      )}%`;

  }


  // =========================================================
  // NAVIGATION
  // =========================================================

  document
    .querySelectorAll(
      ".nav-btn[data-panel]"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () =>
          openPanel(
            btn.dataset.panel
          )
      );

    });


  // =========================================================
  // CLOSE PANEL
  // =========================================================

  $("closePanel")
    .addEventListener(
      "click",
      () =>
        openPanel(
          "overview"
        )
    );


  // =========================================================
  // BUY LAND BUTTON
  // =========================================================

  $("buyLandTop")
    .addEventListener(
      "click",
      openBuyLandModal
    );


  // =========================================================
  // MODAL CLOSE
  // =========================================================

  $("modalClose")
    .addEventListener(
      "click",
      closeModal
    );


  $("modalBackdrop")
    .addEventListener(
      "click",
      (e) => {

        if (
          e.target ===
          $("modalBackdrop")
        ) {

          closeModal();

        }

      }
    );


  // =========================================================
  // MAP ZOOM BUTTONS
  // =========================================================

  $("zoomIn")
    .addEventListener(
      "click",
      () =>
        setZoom(
          zoom + 0.1
        )
    );


  $("zoomOut")
    .addEventListener(
      "click",
      () =>
        setZoom(
          zoom - 0.1
        )
    );


  $("centerMap")
    .addEventListener(
      "click",
      () =>
        setZoom(1)
    );


  // =========================================================
  // SHOW / HIDE PLOTS
  // =========================================================

  $("togglePlots")
    .addEventListener(
      "click",
      () => {

        plotsVisible =
          !plotsVisible;


        renderPlots();

      }
    );


  // =========================================================
  // SAVE
  // =========================================================

  $("saveBtn")
    .addEventListener(
      "click",
      () => {

        accrue();

        saveState();

        showToast(
          "Local game saved."
        );

      }
    );


  // =========================================================
  // RESET
  // =========================================================

  $("resetBtn")
    .addEventListener(
      "click",
      resetState
    );


  // =========================================================
  // MAP WHEEL ZOOM
  // =========================================================

  $("mapViewport")
    .addEventListener(
      "wheel",
      (e) => {

        if (!e.ctrlKey) {

          return;

        }


        e.preventDefault();


        setZoom(
          zoom +
          (
            e.deltaY < 0
              ? 0.08
              : -0.08
          )
        );

      },
      {
        passive: false
      }
    );


  // =========================================================
  // INITIALIZE
  // =========================================================

  setupStateBuildings();

  saveState();

  renderAll();


  // =========================================================
  // GAME LOOP
  // =========================================================

  setInterval(
    () => {

      accrue();

      renderTop();

      renderPanel();

      $("tickerText").textContent =
        state.eventLog[0] ||
        "Republic systems online.";

      saveState();

    },
    5000
  );


})();
