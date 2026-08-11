// ===================== GAME STATE & LOGIC =====================

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
      } catch (e) {
        this.state = null;
      }
    }
  },

  createNewGame(factionId) {
    const faction = FACTIONS.find(f => f.id === factionId);
    const moons = generateEarthMoons();

    this.state = {
      version: '1.0',
      playerId: 'player_' + Date.now(),
      faction: faction,
      day: 1,
      tick: 0,
      resources: {
        regolith: 80,
        ice: 40,
        metal: 25,
        rare: 0,
        energy: 20,
        oxygen: 100,
        food: 80
      },
      storageCap: 200,
      population: 6,
      popCap: 6,
      moral: 75,
      buildings: [],
      grid: Array(6).fill(null).map(() => Array(8).fill(null)),
      currentMoon: null,
      moons: moons,
      governors: { earth: null, mars: null, jupiter: null },
      log: []
    };

    this.save();
    this.log('New colony founded. Faction: ' + faction.name);
  },

  save() {
    if (!this.state) return;
    localStorage.setItem('moonbase_save', JSON.stringify(this.state));
  },

  claimMoon(moonId) {
    const moon = this.state.moons.find(m => m.id === moonId);
    if (!moon || moon.owner) return false;

    moon.owner = this.state.playerId;
    moon.claimedAt = Date.now();
    this.state.currentMoon = moon;

    this.placeBuilding('dome', 3, 2, true);
    this.state.population = 6;
    this.state.popCap = 6;

    this.updateGovernor('earth');
    this.log(`Moon claimed: ${moon.name}`);
    this.save();
    return true;
  },

  updateGovernor(planetId) {
    const planetMoons = this.state.moons.filter(m => m.planet === planetId);
    const counts = {};
    planetMoons.forEach(m => {
      if (m.owner) counts[m.owner] = (counts[m.owner] || 0) + 1;
    });

    let max = 0;
    let winner = null;
    for (const [owner, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        winner = owner;
      }
    }
    this.state.governors[planetId] = (max > planetMoons.length / 2) ? winner : null;
  },

  canAfford(cost) {
    for (const [res, amount] of Object.entries(cost)) {
      if ((this.state.resources[res] || 0) < amount) return false;
    }
    return true;
  },

  pay(cost) {
    for (const [res, amount] of Object.entries(cost)) {
      this.state.resources[res] -= amount;
    }
  },

  placeBuilding(buildingId, x, y, free = false) {
    let def = null;
    for (const cat of Object.values(BUILDINGS)) {
      def = cat.find(b => b.id === buildingId);
      if (def) break;
    }
    if (!def) return false;

    const existing = this.state.buildings.filter(b => b.id === buildingId).length;
    if (existing >= def.max) return false;
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
    this.tickInterval = setInterval(() => {
      if (this.speed === 0) return;
      this.tick();
    }, 2000 / this.speed);
  },

  stopLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  },

  tick() {
    if (!this.state || !this.state.currentMoon) return;

    const mods = this.state.faction.modifiers;
    let oxyProd = 0, foodProd = 0, energyProd = 0;
    let regProd = 0, iceProd = 0, metalProd = 0;

    this.state.buildings.forEach(b => {
      let def = null;
      for (const cat of Object.values(BUILDINGS)) {
        def = cat.find(d => d.id === b.id);
        if (def) break;
      }
      if (!def || !def.effect) return;

      if (def.effect.oxygen) oxyProd += def.effect.oxygen * mods.oxygen;
      if (def.effect.food) foodProd += def.effect.food * mods.food;
      if (def.effect.energy) energyProd += def.effect.energy * mods.energy;
      if (def.effect.regolith) regProd += def.effect.regolith * mods.mining;
      if (def.effect.ice) iceProd += def.effect.ice * mods.mining;
      if (def.effect.metal) metalProd += def.effect.metal * mods.mining;
    });

    const add = (key, amount) => {
      this.state.resources[key] = Math.min(
        this.state.storageCap,
        (this.state.resources[key] || 0) + amount
      );
    };

    add('oxygen', oxyProd);
    add('food', foodProd);
    add('energy', energyProd);
    add('regolith', regProd);
    add('ice', iceProd);
    add('metal', metalProd);

    const pop = this.state.population;
    this.state.resources.oxygen = Math.max(0, this.state.resources.oxygen - pop * 0.8);
    this.state.resources.food = Math.max(0, this.state.resources.food - pop * 0.6);
    this.state.resources.energy = Math.max(0, this.state.resources.energy - this.state.buildings.length * 0.5);

    let moralChange = 0;
    if (this.state.resources.oxygen < pop * 2) moralChange -= 3;
    if (this.state.resources.food < pop * 1.5) moralChange -= 2;
    if (this.state.resources.oxygen > 50 && this.state.resources.food > 40) moralChange += 1;

    this.state.moral = Math.max(0, Math.min(100, this.state.moral + moralChange));

    if (this.state.resources.oxygen <= 0 || this.state.resources.food <= 0) {
      if (this.state.population > 0) {
        this.state.population = Math.max(0, this.state.population - 1);
        this.log('⚠ A colonist has died from lack of resources');
      }
    } else if (this.state.moral > 60 && this.state.population < this.state.popCap && Math.random() < 0.15 * mods.popGrowth) {
      this.state.population++;
      this.log('👤 New colonist arrived');
    }

    this.state.tick++;
    if (this.state.tick % 5 === 0) this.state.day++;

    if (this.state.population <= 0) {
      this.log('💀 Colony lost. All colonists have died.');
      this.speed = 0;
      this.stopLoop();
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
      const found = cat.find(b => b.id === id);
      if (found) return found;
    }
    return null;
  },

  countBuilding(id) {
    return this.state.buildings.filter(b => b.id === id).length;
  }
};

Game.init();
