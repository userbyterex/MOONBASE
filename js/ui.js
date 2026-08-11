// ===================== UI CONTROLLER =====================

const UI = {
  currentCategory: 'life',
  selectedFaction: null,

  init() {
    this.renderFactions();
    this.bindEvents();
    this.checkContinue();
  },

  checkContinue() {
    if (Game.state && Game.state.currentMoon) {
      document.getElementById('btn-continue').classList.remove('hidden');
    }
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  renderFactions() {
    const container = document.getElementById('faction-select');
    container.innerHTML = '';
    FACTIONS.forEach(f => {
      const card = document.createElement('div');
      card.className = 'faction-card';
      card.dataset.id = f.id;
      card.innerHTML = `
        <h4 style="color:${f.color}">${f.name}</h4>
        <p>${f.desc}</p>
        <div class="bonus">${f.bonus}</div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.faction-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        document.getElementById('btn-start').disabled = false;
        this.selectedFaction = f.id;
      });
      container.appendChild(card);
    });
  },

  renderMoons() {
    const list = document.getElementById('moon-list');
    list.innerHTML = '';
    const earthMoons = Game.state.moons.filter(m => m.planet === 'earth');

    earthMoons.forEach(m => {
      const card = document.createElement('div');
      card.className = 'moon-card' + (m.owner ? ' claimed' : '');
      card.dataset.id = m.id;

      let status;
      if (m.owner === Game.state.playerId) status = '<span class="status free">Yours</span>';
      else if (m.owner) status = '<span class="status taken">Taken</span>';
      else status = '<span class="status free">Free</span>';

      card.innerHTML = `
        <div>
          <strong>${m.name}</strong><br>
          <small>${m.resources.primary} · ${m.resources.secondary}</small>
        </div>
        ${status}
      `;

      if (!m.owner) {
        card.addEventListener('click', () => {
          document.querySelectorAll('.moon-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          Game.selectedMoonId = m.id;
          const btn = document.getElementById('btn-launch');
          btn.disabled = false;
          btn.textContent = `Launch to ${m.name}`;
        });
      }
      list.appendChild(card);
    });
  },

  renderBuildMenu() {
    const list = document.getElementById('build-list');
    list.innerHTML = '';
    const cats = BUILDINGS[this.currentCategory] || [];

    cats.forEach(b => {
      const count = Game.countBuilding(b.id);
      const canBuild = count < b.max && Game.canAfford(b.cost);
      const item = document.createElement('div');
      item.className = 'build-item' + (!canBuild ? ' disabled' : '');
      item.innerHTML = `
        <h4>${b.icon} ${b.name} (${count}/${b.max})</h4>
        <div class="cost">${this.formatCost(b.cost)} — ${b.desc}</div>
      `;
      if (canBuild) {
        item.addEventListener('click', () => {
          Game.selectedBuilding = b.id;
          this.showAlert(`Selected: ${b.name}. Tap an empty cell.`);
        });
      }
      list.appendChild(item);
    });
  },

  formatCost(cost) {
    return Object.entries(cost)
      .map(([k, v]) => `${RESOURCE_ICONS[k] || k} ${v}`)
      .join('  ');
  },

  renderGrid() {
    const grid = document.getElementById('base-grid');
    grid.innerHTML = '';
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 8; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        const buildingId = Game.state.grid[y][x];
        if (buildingId) {
          cell.classList.add('occupied');
          const def = Game.getBuildingDef(buildingId);
          cell.textContent = def ? def.icon : '?';
        }

        cell.addEventListener('click', () => {
          if (Game.selectedBuilding && !buildingId) {
            const ok = Game.placeBuilding(Game.selectedBuilding, x, y);
            if (ok) {
              Game.selectedBuilding = null;
              this.renderGrid();
              this.renderBuildMenu();
              this.updateResources();
              this.updateStatus();
            }
          }
        });
        grid.appendChild(cell);
      }
    }
  },

  updateResources() {
    const bar = document.getElementById('resource-bar');
    const r = Game.state.resources;
    bar.innerHTML = `
      <div class="res-item">${RESOURCE_ICONS.regolith} <span class="val">${Math.floor(r.regolith)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.ice} <span class="val">${Math.floor(r.ice)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.metal} <span class="val">${Math.floor(r.metal)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.energy} <span class="val">${Math.floor(r.energy)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.rare} <span class="val">${Math.floor(r.rare)}</span></div>
    `;
  },

  updateStatus() {
    const s = Game.state;
    document.getElementById('day').textContent = s.day;
    document.getElementById('pop-count').textContent = `${s.population} / ${s.popCap}`;
    document.getElementById('base-name').textContent = s.currentMoon ? s.currentMoon.name : 'Base';

    const oxyPct = Math.min(100, (s.resources.oxygen / (s.population * 5 + 20)) * 100);
    const foodPct = Math.min(100, (s.resources.food / (s.population * 4 + 20)) * 100);

    document.getElementById('oxy-fill').style.width = oxyPct + '%';
    document.getElementById('oxy-val').textContent = Math.floor(oxyPct) + '%';
    document.getElementById('food-fill').style.width = foodPct + '%';
    document.getElementById('food-val').textContent = Math.floor(foodPct) + '%';
    document.getElementById('moral-fill').style.width = s.moral + '%';
    document.getElementById('moral-val').textContent = Math.floor(s.moral) + '%';

    const hasDome = Game.countBuilding('dome') > 0;
    const hasOxy = Game.countBuilding('oxygen') > 0;
    const hasHab = Game.countBuilding('habitat') > 0;

    document.getElementById('base-status').innerHTML = `
      <div>Dome: ${hasDome ? '✅' : '❌'}</div>
      <div>Oxygen: ${hasOxy ? '✅' : '❌'}</div>
      <div>Habitat: ${hasHab ? '✅' : '❌'}</div>
      <div>Buildings: ${s.buildings.length}</div>
    `;

    let obj = 'Expand and survive';
    if (!hasDome) obj = 'Build a Dome';
    else if (!hasOxy) obj = 'Build an O₂ Generator';
    else if (!hasHab) obj = 'Build a Habitat';
    document.getElementById('objective').textContent = obj;

    document.getElementById('log').innerHTML = s.log.slice(0, 12)
      .map(l => `<div>${l}</div>`).join('');
  },

  updateAll() {
    this.updateResources();
    this.updateStatus();
    this.renderBuildMenu();
  },

  renderPlanetMap() {
    const container = document.getElementById('planet-map');
    container.innerHTML = '';

    PLANETS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'planet-card';

      const planetMoons = Game.state.moons.filter(m => m.planet === p.id);
      const gov = Game.state.governors[p.id];
      let govText = 'No Governor (need majority)';
      if (gov === Game.state.playerId) govText = 'You are the Governor';
      else if (gov) govText = 'Enemy Governor';

      let moonsHtml = '';
      if (planetMoons.length === 0) {
        moonsHtml = '<span style="color:var(--muted);font-size:0.8rem">Locked in Beta 1</span>';
      } else {
        planetMoons.forEach(m => {
          let cls = 'moon-dot';
          if (m.owner === Game.state.playerId) cls += ' owned';
          else if (m.owner) cls += ' enemy';
          moonsHtml += `<div class="${cls}" title="${m.name}">${m.owner ? '●' : '○'}</div>`;
        });
      }

      card.innerHTML = `
        <h3>${p.name}</h3>
        <div class="gov">${govText}</div>
        <div class="moon-mini">${moonsHtml}</div>
      `;
      container.appendChild(card);
    });
  },

  showAlert(msg) {
    const box = document.getElementById('alert-box');
    box.textContent = msg;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 2800);
  },

  bindEvents() {
    document.getElementById('btn-start').addEventListener('click', () => {
      if (!this.selectedFaction) return;
      Game.createNewGame(this.selectedFaction);
      document.getElementById('player-faction-badge').textContent = Game.state.faction.name;
      this.showScreen('screen-hangar');
      this.renderMoons();
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
      if (!Game.state) return;
      document.getElementById('player-faction-badge').textContent = Game.state.faction.name;
      if (Game.state.currentMoon) this.enterBase();
      else {
        this.showScreen('screen-hangar');
        this.renderMoons();
      }
    });

    document.getElementById('btn-back-title').addEventListener('click', () => {
      this.showScreen('screen-title');
    });

    document.getElementById('btn-launch').addEventListener('click', () => {
      if (!Game.selectedMoonId) return;
      if (Game.claimMoon(Game.selectedMoonId)) this.enterBase();
    });

    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.cat;
        this.renderBuildMenu();
      });
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      Game.speed = Game.speed === 0 ? 1 : 0;
      document.getElementById('btn-pause').textContent = Game.speed === 0 ? '▶' : '⏸';
    });

    document.getElementById('btn-speed').addEventListener('click', () => {
      Game.speed = Game.speed === 1 ? 2 : 1;
      document.getElementById('btn-speed').textContent = Game.speed === 2 ? '⏩' : '▶';
    });

    document.getElementById('btn-map').addEventListener('click', () => {
      this.renderPlanetMap();
      this.showScreen('screen-map');
    });

    document.getElementById('btn-back-game').addEventListener('click', () => {
      this.showScreen('screen-game');
    });
  },

  enterBase() {
    this.showScreen('screen-game');
    this.renderGrid();
    this.renderBuildMenu();
    this.updateAll();
    Game.startLoop();
  }
};

document.addEventListener('DOMContentLoaded', () => UI.init());
