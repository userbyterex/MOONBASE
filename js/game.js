const Game = {
  state: null,
  tickInterval: null,
  speed: 1,
  selectedMoonId: null,
  selectedBuilding: null,

  init() {
    const saved = localStorage.getItem('moonbase_save');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        if (!this.state.version || this.state.version < '1.4') {
          // soft reset grid if old format
          this.state.grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
          this.state.buildings = this.state.buildings || [];
          this.state.version = '1.4';
        }
        document.getElementById('btn-continue')?.classList.remove('hidden');
      } catch (e) { this.state = null; }
    }
  },

  createNewGame(factionId) {
    const faction = FACTIONS.find(f => f.id === factionId);
    this.state = {
      version: '1.4',
      playerId: 'player_' + Date.now(),
      faction,
      day: 1, tick: 0,
      resources: { regolith: 80, ice: 40, metal: 25, rare: 0, energy: 20, oxygen: 100, food: 80 },
      storageCap: 200,
      population: 6, popCap: 6, moral: 75,
      buildings: [],
      grid: Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null)),
      currentMoon: null,
      moons: generateEarthMoons(),
      governors: { earth: null, mars: null, jupiter: null },
      log: []
    };
    this.save();
    this.log('Colony founded under ' + faction.name);
  },

  save() {
    if (this.state) localStorage.setItem('moonbase_save', JSON.stringify(this.state));
  },

  getDomeLevel() {
    return this.state.buildings.filter(b => b.id === 'dome' && b.complete).length;
  },

  claimMoon(moonId) {
    const moon = this.state.moons.find(m => m.id === moonId);
    if (!moon || moon.owner) return false;
    moon.owner = this.state.playerId;
    this.state.currentMoon = moon;
    // Start with a free completed dome
    this.placeBuilding('dome', 2, 1, true, true);
    this.state.population = 6;
    this.state.popCap = 6;
    this.updateGovernor('earth');
    this.log(`Moon claimed: ${moon.name}`);
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

  canAfford(cost) {
    for (const [r, a] of Object.entries(cost)) if ((this.state.resources[r] || 0) < a) return false;
    return true;
  },

  pay(cost) {
    for (const [r, a] of Object.entries(cost)) this.state.resources[r] -= a;
  },

  placeBuilding(buildingId, x, y, free = false, instant = false) {
    let def = null;
    for (const cat of Object.values(BUILDINGS)) {
      def = cat.find(b => b.id === buildingId);
      if (def) break;
    }
    if (!def) return false;
    if (y < 0 || y >= GRID_ROWS || x < 0 || x >= GRID_COLS) return false;

    const completed = this.state.buildings.filter(b => b.id === buildingId && b.complete).length;
    if (completed + this.state.buildings.filter(b => b.id === buildingId && !b.complete).length >= def.max) return false;
    if (this.state.grid[y][x] !== null) return false;

    // Check if slot is unlocked by dome level
    const unlocked = slotsUnlocked(this.getDomeLevel());
    const slotIndex = y * GRID_COLS + x;
    if (slotIndex >= unlocked && !instant) return false;

    if (!free) {
      if (!this.canAfford(def.cost)) return false;
      this.pay(def.cost);
    }

    this.state.grid[y][x] = buildingId;
    const b = {
      id: buildingId,
      x, y,
      level: 1,
      complete: instant,
      progress: instant ? 1 : 0,
      buildTime: def.buildTime || 3
    };
    this.state.buildings.push(b);

    if (instant && def.effect) {
      if (def.effect.popCap) this.state.popCap += def.effect.popCap;
      if (def.effect.storage) this.state.storageCap += def.effect.storage;
    }

    this.log(instant ? `Deployed: ${def.name}` : `Constructing: ${def.name}`);
    this.save();
    return true;
  },

  startLoop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => { if (this.speed !== 0) this.tick(); }, 900 / Math.max(this.speed, 0.5));
  },

  stopLoop() {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
  },

  tick() {
    if (!this.state?.currentMoon) return;

    // Advance construction
    let anyBuilt = false;
    this.state.buildings.forEach(b => {
      if (b.complete) return;
      b.progress += (1 / (b.buildTime * 4)); // ~buildTime seconds at speed 1
      if (b.progress >= 1) {
        b.progress = 1;
        b.complete = true;
        anyBuilt = true;
        const def = this.getBuildingDef(b.id);
        if (def?.effect) {
          if (def.effect.popCap) this.state.popCap += def.effect.popCap;
          if (def.effect.storage) this.state.storageCap += def.effect.storage;
        }
        this.log(`Completed: ${def ? def.name : b.id}`);
      }
    });

    const mods = this.state.faction.modifiers;
    let oxy = 0, food = 0, energy = 0, reg = 0, ice = 0, metal = 0;

    this.state.buildings.filter(b => b.complete).forEach(b => {
      let def = this.getBuildingDef(b.id);
      if (!def?.effect) return;
      if (def.effect.oxygen) oxy += def.effect.oxygen * mods.oxygen;
      if (def.effect.food) food += def.effect.food * mods.food;
      if (def.effect.energy) energy += def.effect.energy * mods.energy;
      if (def.effect.regolith) reg += def.effect.regolith * mods.mining;
      if (def.effect.ice) ice += def.effect.ice * mods.mining;
      if (def.effect.metal) metal += def.effect.metal * mods.mining;
    });

    const add = (k, v) => { this.state.resources[k] = Math.min(this.state.storageCap, (this.state.resources[k] || 0) + v); };
    add('oxygen', oxy * 0.45); add('food', food * 0.45); add('energy', energy * 0.45);
    add('regolith', reg * 0.45); add('ice', ice * 0.45); add('metal', metal * 0.45);

    const pop = this.state.population;
    this.state.resources.oxygen = Math.max(0, this.state.resources.oxygen - pop * 0.35);
    this.state.resources.food = Math.max(0, this.state.resources.food - pop * 0.28);
    this.state.resources.energy = Math.max(0, this.state.resources.energy - this.state.buildings.filter(b => b.complete).length * 0.2);

    let mc = 0;
    if (this.state.resources.oxygen < pop * 2) mc -= 2;
    if (this.state.resources.food < pop * 1.5) mc -= 1.5;
    if (this.state.resources.oxygen > 50 && this.state.resources.food > 40) mc += 0.8;
    this.state.moral = Math.max(0, Math.min(100, this.state.moral + mc));

    if (this.state.resources.oxygen <= 0 || this.state.resources.food <= 0) {
      if (this.state.population > 0 && Math.random() < 0.3) {
        this.state.population--;
        this.log('⚠ Colonist died from shortage');
      }
    } else if (this.state.moral > 60 && this.state.population < this.state.popCap && Math.random() < 0.08 * mods.popGrowth) {
      this.state.population++;
      this.log('👤 New colonist arrived');
    }

    this.state.tick++;
    if (this.state.tick % 8 === 0) this.state.day++;

    if (this.state.population <= 0) {
      this.log('💀 Colony lost.');
      this.speed = 0; this.stopLoop();
    }

    this.save();
    UI.updateAll();
    if (anyBuilt) UI.renderColony();
    else UI.updateConstructionBars();
  },

  log(msg) {
    if (!this.state) return;
    this.state.log.unshift(`[D${this.state.day}] ${msg}`);
    if (this.state.log.length > 40) this.state.log.pop();
  },

  getBuildingDef(id) {
    for (const cat of Object.values(BUILDINGS)) {
      const f = cat.find(b => b.id === id);
      if (f) return f;
    }
    return null;
  },

  countBuilding(id, onlyComplete = false) {
    return this.state.buildings.filter(b => b.id === id && (!onlyComplete || b.complete)).length;
  }
};

Game.init();
