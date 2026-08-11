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
        document.getElementById('btn-continue')?.classList.remove('hidden');
      } catch (e) { this.state = null; }
    }
  },

  createNewGame(factionId) {
    const faction = FACTIONS.find(f => f.id === factionId);
    this.state = {
      version: '1.2',
      playerId: 'player_' + Date.now(),
      faction,
      day: 1, tick: 0,
      resources: { regolith: 80, ice: 40, metal: 25, rare: 0, energy: 20, oxygen: 100, food: 80 },
      storageCap: 200,
      population: 6, popCap: 6, moral: 75,
      buildings: [],
      grid: Array(6).fill(null).map(() => Array(8).fill(null)),
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

  claimMoon(moonId) {
    const moon = this.state.moons.find(m => m.id === moonId);
    if (!moon || moon.owner) return false;
    moon.owner = this.state.playerId;
    this.state.currentMoon = moon;
    this.placeBuilding('dome', 3, 2, true);
    this.state.population = 6; this.state.popCap = 6;
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

  placeBuilding(buildingId, x, y, free = false) {
    let def = null;
    for (const cat of Object.values(BUILDINGS)) {
      def = cat.find(b => b.id === buildingId);
      if (def) break;
    }
    if (!def) return false;
    if (this.state.buildings.filter(b => b.id === buildingId).length >= def.max) return false;
    if (this.state.grid[y][x] !== null) return false;
    if (!free) {
      if (!this.canAfford(def.cost)) return false;
      this.pay(def.cost);
    }
    this.state.grid[y][x] = buildingId;
    this.state.buildings.push({ id: buildingId, x, y, level: 1 });
    if (def.effect.popCap) this.state.popCap += def.effect.popCap;
    if (def.effect.storage) this.state.storageCap += def.effect.storage;
    this.log(`Built: ${def.name}`);
    this.save();
    return true;
  },

  startLoop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => { if (this.speed !== 0) this.tick(); }, 2000 / this.speed);
  },

  stopLoop() {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
  },

  tick() {
    if (!this.state?.currentMoon) return;
    const mods = this.state.faction.modifiers;
    let oxy = 0, food = 0, energy = 0, reg = 0, ice = 0, metal = 0;

    this.state.buildings.forEach(b => {
      let def = null;
      for (const cat of Object.values(BUILDINGS)) { def = cat.find(d => d.id === b.id); if (def) break; }
      if (!def?.effect) return;
      if (def.effect.oxygen) oxy += def.effect.oxygen * mods.oxygen;
      if (def.effect.food) food += def.effect.food * mods.food;
      if (def.effect.energy) energy += def.effect.energy * mods.energy;
      if (def.effect.regolith) reg += def.effect.regolith * mods.mining;
      if (def.effect.ice) ice += def.effect.ice * mods.mining;
      if (def.effect.metal) metal += def.effect.metal * mods.mining;
    });

    const add = (k, v) => { this.state.resources[k] = Math.min(this.state.storageCap, (this.state.resources[k] || 0) + v); };
    add('oxygen', oxy); add('food', food); add('energy', energy);
    add('regolith', reg); add('ice', ice); add('metal', metal);

    const pop = this.state.population;
    this.state.resources.oxygen = Math.max(0, this.state.resources.oxygen - pop * 0.8);
    this.state.resources.food = Math.max(0, this.state.resources.food - pop * 0.6);
    this.state.resources.energy = Math.max(0, this.state.resources.energy - this.state.buildings.length * 0.5);

    let mc = 0;
    if (this.state.resources.oxygen < pop * 2) mc -= 3;
    if (this.state.resources.food < pop * 1.5) mc -= 2;
    if (this.state.resources.oxygen > 50 && this.state.resources.food > 40) mc += 1;
    this.state.moral = Math.max(0, Math.min(100, this.state.moral + mc));

    if (this.state.resources.oxygen <= 0 || this.state.resources.food <= 0) {
      if (this.state.population > 0) {
        this.state.population--;
        this.log('⚠ Colonist died from shortage');
      }
    } else if (this.state.moral > 60 && this.state.population < this.state.popCap && Math.random() < 0.15 * mods.popGrowth) {
      this.state.population++;
      this.log('👤 New colonist arrived');
    }

    this.state.tick++;
    if (this.state.tick % 5 === 0) this.state.day++;
    if (this.state.population <= 0) {
      this.log('💀 Colony lost.');
      this.speed = 0; this.stopLoop();
    }
    this.save();
    UI.updateAll();
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

  countBuilding(id) {
    return this.state.buildings.filter(b => b.id === id).length;
  }
};

Game.init();
