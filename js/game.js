const Game = {
  state: null,
  tickInterval: null,
  speed: 1,

  init() {
    const s = localStorage.getItem('moonbase_v2');
    if (s) {
      try {
        this.state = JSON.parse(s);
        document.getElementById('btn-continue')?.classList.remove('hidden');
      } catch(e) { this.state = null; }
    }
  },

  createNewGame(factionId) {
    const faction = FACTIONS.find(f => f.id === factionId);
    const levels = {};
    Object.keys(BUILDINGS).forEach(id => levels[id] = 0);

    this.state = {
      version: '2.0',
      playerId: 'p_' + Date.now(),
      faction,
      day: 1,
      lastTick: Date.now(),
      resources: { regolith: 500, ice: 300, helium: 50, energy: 0, oxygen: 100, food: 80 },
      capacity: { regolith: 10000, ice: 10000, helium: 5000 },
      levels,
      population: 6,
      popCap: 10,
      moral: 75,
      queue: null, // { buildingId, startTime, duration }
      currentMoon: null,
      moons: generateEarthMoons(),
      governors: { earth: null, mars: null, jupiter: null },
      log: []
    };
    this.save();
    this.log('Empire founded — ' + faction.name);
  },

  save() {
    if (this.state) {
      this.state.lastTick = Date.now();
      localStorage.setItem('moonbase_v2', JSON.stringify(this.state));
    }
  },

  // --- Production formulas (OGame-like) ---
  levelProd(base, factor, level) {
    if (level <= 0) return 0;
    return Math.floor(base * level * Math.pow(factor, level));
  },

  levelCost(baseCost, factor, level) {
    const mult = Math.pow(factor, level);
    const c = {};
    for (const [k, v] of Object.entries(baseCost)) c[k] = Math.floor(v * mult);
    return c;
  },

  levelEnergyNeed(base, factor, level) {
    if (level <= 0) return 0;
    return Math.floor(base * level * Math.pow(factor, level));
  },

  getEnergyProd() {
    const s = this.state;
    const mod = s.faction.mod.energy;
    let e = this.levelProd(BUILDINGS.solar.baseProd, BUILDINGS.solar.prodFactor, s.levels.solar || 0);
    e += this.levelProd(BUILDINGS.reactor.baseProd, BUILDINGS.reactor.prodFactor, s.levels.reactor || 0);
    return Math.floor(e * mod);
  },

  getEnergyNeed() {
    let need = 0;
    for (const [id, def] of Object.entries(BUILDINGS)) {
      if (def.cat === 'energy') continue;
      need += this.levelEnergyNeed(def.baseEnergy, def.energyFactor, this.state.levels[id] || 0);
    }
    return need;
  },

  getEnergyFactor() {
    const prod = this.getEnergyProd();
    const need = this.getEnergyNeed();
    if (need <= 0) return 1;
    return Math.min(1, prod / need);
  },

  getProduction() {
    const s = this.state;
    const ef = this.getEnergyFactor();
    const mm = s.faction.mod.mine;
    return {
      regolith: Math.floor(this.levelProd(BUILDINGS.regolith_mine.baseProd, BUILDINGS.regolith_mine.prodFactor, s.levels.regolith_mine || 0) * ef * mm),
      ice: Math.floor(this.levelProd(BUILDINGS.ice_mine.baseProd, BUILDINGS.ice_mine.prodFactor, s.levels.ice_mine || 0) * ef * mm),
      helium: Math.floor(this.levelProd(BUILDINGS.helium_synth.baseProd, BUILDINGS.helium_synth.prodFactor, s.levels.helium_synth || 0) * ef * mm),
      oxygen: Math.floor(this.levelProd(BUILDINGS.oxygen.baseProd, BUILDINGS.oxygen.prodFactor, s.levels.oxygen || 0)),
      food: Math.floor(this.levelProd(BUILDINGS.hydro.baseProd, BUILDINGS.hydro.prodFactor, s.levels.hydro || 0)),
      energy: this.getEnergyProd()
    };
  },

  updateCapacity() {
    const lvl = this.state.levels.storage || 0;
    const base = 10000;
    const cap = Math.floor(base * Math.pow(1.6, lvl));
    this.state.capacity = { regolith: cap, ice: cap, helium: Math.floor(cap * 0.5) };
    const hab = this.state.levels.habitat || 0;
    this.state.popCap = 10 + hab * 4;
  },

  canAfford(cost) {
    for (const [k, v] of Object.entries(cost)) {
      if ((this.state.resources[k] || 0) < v) return false;
    }
    return true;
  },

  pay(cost) {
    for (const [k, v] of Object.entries(cost)) this.state.resources[k] -= v;
  },

  canUpgrade(id) {
    const def = BUILDINGS[id];
    if (!def) return false;
    const lvl = this.state.levels[id] || 0;
    if (lvl >= def.maxLevel) return false;
    if (this.state.queue) return false;
    if (def.requires) {
      for (const [reqId, reqLvl] of Object.entries(def.requires)) {
        if ((this.state.levels[reqId] || 0) < reqLvl) return false;
      }
    }
    const cost = this.levelCost(def.baseCost, def.costFactor, lvl);
    return this.canAfford(cost);
  },

  getBuildTime(id) {
    const def = BUILDINGS[id];
    const lvl = this.state.levels[id] || 0;
    const cost = this.levelCost(def.baseCost, def.costFactor, lvl);
    const totalRes = (cost.regolith || 0) + (cost.ice || 0) + (cost.helium || 0);
    const robots = this.state.levels.robotics || 0;
    const baseTime = Math.max(5, Math.floor(totalRes / 40)); // seconds
    const reduction = Math.pow(0.9, robots) * this.state.faction.mod.build;
    return Math.max(3, Math.floor(baseTime * reduction));
  },

  startUpgrade(id) {
    if (!this.canUpgrade(id)) return false;
    const def = BUILDINGS[id];
    const lvl = this.state.levels[id] || 0;
    const cost = this.levelCost(def.baseCost, def.costFactor, lvl);
    this.pay(cost);
    const duration = this.getBuildTime(id);
    this.state.queue = {
      buildingId: id,
      levelTo: lvl + 1,
      startTime: Date.now(),
      duration: duration * 1000
    };
    this.log(`Upgrading ${def.name} to level ${lvl + 1}`);
    this.save();
    return true;
  },

  claimMoon(moonId) {
    const moon = this.state.moons.find(m => m.id === moonId);
    if (!moon || moon.owner) return false;
    moon.owner = this.state.playerId;
    this.state.currentMoon = moon;
    // Starting levels
    this.state.levels.dome = 1;
    this.state.levels.solar = 1;
    this.state.levels.regolith_mine = 1;
    this.state.levels.habitat = 1;
    this.state.levels.oxygen = 1;
    this.updateCapacity();
    this.updateGovernor('earth');
    this.log('Moon claimed: ' + moon.name);
    this.save();
    return true;
  },

  updateGovernor(planetId) {
    const moons = this.state.moons.filter(m => m.planet === planetId);
    const counts = {};
    moons.forEach(m => { if (m.owner) counts[m.owner] = (counts[m.owner] || 0) + 1; });
    let max = 0, winner = null;
    for (const [o, c] of Object.entries(counts)) { if (c > max) { max = c; winner = o; } }
    this.state.governors[planetId] = max > moons.length / 2 ? winner : null;
  },

  // Apply offline + tick production
  applyProduction(dtSeconds) {
    const prod = this.getProduction();
    const hours = dtSeconds / 3600;
    const add = (key, amount) => {
      const cap = this.state.capacity[key] || 999999;
      this.state.resources[key] = Math.min(cap, (this.state.resources[key] || 0) + amount);
    };
    add('regolith', prod.regolith * hours);
    add('ice', prod.ice * hours);
    add('helium', prod.helium * hours);
    this.state.resources.oxygen = Math.min(500, (this.state.resources.oxygen || 0) + prod.oxygen * hours);
    this.state.resources.food = Math.min(500, (this.state.resources.food || 0) + prod.food * hours);

    // Population consumption
    const pop = this.state.population;
    this.state.resources.oxygen = Math.max(0, this.state.resources.oxygen - pop * 0.5 * hours);
    this.state.resources.food = Math.max(0, this.state.resources.food - pop * 0.4 * hours);

    // Reactor helium drain
    const reactLvl = this.state.levels.reactor || 0;
    if (reactLvl > 0) {
      this.state.resources.helium = Math.max(0, this.state.resources.helium - reactLvl * 2 * hours);
    }
  },

  processQueue() {
    if (!this.state.queue) return false;
    const q = this.state.queue;
    const elapsed = Date.now() - q.startTime;
    if (elapsed >= q.duration) {
      this.state.levels[q.buildingId] = q.levelTo;
      this.log(`Completed: ${BUILDINGS[q.buildingId].name} level ${q.levelTo}`);
      this.state.queue = null;
      this.updateCapacity();
      return true;
    }
    return false;
  },

  tick() {
    if (!this.state?.currentMoon) return;
    const now = Date.now();
    const dt = Math.min(3600, (now - (this.state.lastTick || now)) / 1000); // max 1h catchup per tick
    this.state.lastTick = now;

    this.applyProduction(dt * this.speed);
    const finished = this.processQueue();

    // Population growth
    if (this.state.resources.oxygen > 20 && this.state.resources.food > 20 && this.state.population < this.state.popCap && Math.random() < 0.02) {
      this.state.population++;
      this.log('New colonist arrived');
    }

    this.state.day = Math.floor((now - (this.state.created || now)) / 86400000) + 1;
    if (!this.state.created) this.state.created = now;

    this.save();
    UI.refresh();
    if (finished) UI.renderBuildings();
  },

  startLoop() {
    // Catch up offline production (max 8 hours)
    if (this.state?.lastTick) {
      const offline = Math.min(28800, (Date.now() - this.state.lastTick) / 1000);
      if (offline > 30) {
        this.applyProduction(offline);
        this.processQueue();
        this.log(`Offline production applied (${Math.floor(offline/60)} min)`);
      }
    }
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => { if (this.speed !== 0) this.tick(); }, 1000);
  },

  log(msg) {
    if (!this.state) return;
    this.state.log.unshift(`[D${this.state.day}] ${msg}`);
    if (this.state.log.length > 30) this.state.log.pop();
  }
};

Game.init();
