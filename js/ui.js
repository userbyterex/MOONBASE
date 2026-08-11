const UI = {
  currentCategory: 'life',
  selectedFaction: null,
  panX: 0,
  panY: 0,
  isPanning: false,
  panStart: null,

  init() {
    this.renderFactions();
    this.bindEvents();
    this.setupPan();
    if (Game.state?.currentMoon) document.getElementById('btn-continue').classList.remove('hidden');
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  renderFactions() {
    const c = document.getElementById('faction-select');
    c.innerHTML = '';
    FACTIONS.forEach(f => {
      const card = document.createElement('div');
      card.className = 'faction-card';
      card.style.setProperty('--faction-color', f.color);
      card.style.setProperty('--faction-bg', f.bg);
      card.innerHTML = `
        <div class="faction-avatar">${f.avatar}<span class="role">${f.role}</span></div>
        <h4 style="color:${f.color}">${f.name}</h4>
        <p>${f.desc}</p>
        <div class="bonus">${f.bonus}</div>`;
      card.onclick = () => {
        document.querySelectorAll('.faction-card').forEach(x => x.classList.remove('selected'));
        card.classList.add('selected');
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-start').querySelector('span').textContent = 'Launch Colony';
        this.selectedFaction = f.id;
      };
      c.appendChild(card);
    });
  },

  playLaunchAnimation(cb) {
    this.showScreen('screen-launch');
    const rocket = document.getElementById('rocket');
    const progress = document.getElementById('launch-progress');
    const text = document.getElementById('launch-text');
    const status = document.getElementById('launch-status');
    rocket.classList.remove('ignite', 'liftoff');
    progress.style.width = '0%';
    text.textContent = 'IGNITION SEQUENCE';
    status.textContent = 'T-10';

    let t = 10;
    const iv = setInterval(() => {
      t--;
      status.textContent = 'T-' + t;
      progress.style.width = ((10 - t) * 10) + '%';
      if (t === 6) { text.textContent = 'ENGINES ONLINE'; rocket.classList.add('ignite'); }
      if (t === 3) text.textContent = 'MAIN ENGINE START';
      if (t === 1) text.textContent = 'LIFTOFF';
      if (t <= 0) {
        clearInterval(iv);
        status.textContent = 'LIFTOFF';
        progress.style.width = '100%';
        rocket.classList.add('liftoff');
        text.textContent = 'TRANSIT TO ORBIT';
        setTimeout(cb, 3400);
      }
    }, 400);
  },

  renderMoons() {
    const list = document.getElementById('moon-list');
    list.innerHTML = '';
    Game.state.moons.filter(m => m.planet === 'earth').forEach(m => {
      const card = document.createElement('div');
      card.className = 'moon-card' + (m.owner ? ' claimed' : '');
      let st = m.owner === Game.state.playerId ? '<span class="status free">Yours</span>'
             : m.owner ? '<span class="status taken">Taken</span>'
             : '<span class="status free">Free</span>';
      card.innerHTML = `<div><strong>${m.name}</strong><br><small>${m.resources.primary} · ${m.resources.secondary}</small></div>${st}`;
      if (!m.owner) {
        card.onclick = () => {
          document.querySelectorAll('.moon-card').forEach(x => x.classList.remove('selected'));
          card.classList.add('selected');
          Game.selectedMoonId = m.id;
          const btn = document.getElementById('btn-launch');
          btn.disabled = false;
          btn.textContent = `Launch to ${m.name}`;
        };
      }
      list.appendChild(card);
    });
  },

  renderBuildMenu() {
    const list = document.getElementById('build-list');
    list.innerHTML = '';
    (BUILDINGS[this.currentCategory] || []).forEach(b => {
      const count = Game.countBuilding(b.id);
      const can = count < b.max && Game.canAfford(b.cost);
      const item = document.createElement('div');
      item.className = 'build-item' + (can ? '' : ' disabled');
      item.innerHTML = `<h4>${b.icon} ${b.name} (${count}/${b.max})</h4>
        <div class="cost">${this.formatCost(b.cost)} — ${b.desc}</div>`;
      if (can) item.onclick = () => {
        Game.selectedBuilding = b.id;
        this.showAlert(`Selected: ${b.name}. Tap a free unlocked slot.`);
        document.querySelectorAll('.slot:not(.occupied):not(.locked)').forEach(s => s.classList.add('highlight'));
      };
      list.appendChild(item);
    });
  },

  formatCost(cost) {
    return Object.entries(cost).map(([k, v]) => `${RESOURCE_ICONS[k] || k} ${v}`).join('  ');
  },

  renderColony() {
    const layer = document.getElementById('buildings-layer');
    const slots = document.getElementById('slots-layer');
    const domeEl = document.getElementById('dome-visual');
    layer.innerHTML = '';
    slots.innerHTML = '';

    const domeLevel = Game.getDomeLevel();
    const unlocked = slotsUnlocked(domeLevel);

    // Dome visual
    if (domeLevel > 0) {
      domeEl.classList.remove('hidden', 'level-1', 'level-2', 'level-3');
      domeEl.classList.add('level-' + Math.min(domeLevel, 3));
    } else {
      domeEl.classList.add('hidden');
    }

    // Slots
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.x = x;
        slot.dataset.y = y;
        const idx = y * GRID_COLS + x;
        const buildingId = Game.state.grid[y][x];

        if (buildingId) slot.classList.add('occupied');
        else if (idx >= unlocked) slot.classList.add('locked');

        slot.onclick = () => {
          if (Game.selectedBuilding && !buildingId && idx < unlocked) {
            if (Game.placeBuilding(Game.selectedBuilding, x, y)) {
              Game.selectedBuilding = null;
              document.querySelectorAll('.slot').forEach(s => s.classList.remove('highlight'));
              this.renderColony();
              this.renderBuildMenu();
              this.updateResources();
              this.updateStatus();
            }
          }
        };
        slots.appendChild(slot);
      }
    }

    // Building sprites
    Game.state.buildings.forEach(b => {
      if (b.id === 'dome') return; // dome is the big transparent overlay

      const def = Game.getBuildingDef(b.id);
      if (!def) return;

      const sprite = document.createElement('div');
      sprite.className = 'building-sprite' + (b.complete ? ' complete' : ' constructing');
      sprite.dataset.key = `${b.x}-${b.y}`;

      let barHtml = '';
      if (!b.complete) {
        barHtml = `<div class="build-bar"><div class="build-bar-fill" style="width:${Math.floor(b.progress * 100)}%"></div></div>`;
      }

      sprite.innerHTML = `
        <div class="sprite-icon">${def.icon}</div>
        <div class="sprite-label">${def.short}</div>
        ${barHtml}
      `;

      const leftPct = ((b.x + 0.5) / GRID_COLS) * 100;
      const topPct = ((b.y + 0.55) / GRID_ROWS) * 100;
      sprite.style.left = leftPct + '%';
      sprite.style.top = topPct + '%';
      sprite.style.transform = 'translate(-50%, -70%)';

      layer.appendChild(sprite);
    });
  },

  updateConstructionBars() {
    Game.state.buildings.forEach(b => {
      if (b.complete) return;
      const el = document.querySelector(`.building-sprite[data-key="${b.x}-${b.y}"] .build-bar-fill`);
      if (el) el.style.width = Math.floor(b.progress * 100) + '%';
    });
  },

  updateResources() {
    const r = Game.state.resources;
    document.getElementById('resource-bar').innerHTML = `
      <div class="res-item">${RESOURCE_ICONS.regolith} <span class="val">${Math.floor(r.regolith)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.ice} <span class="val">${Math.floor(r.ice)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.metal} <span class="val">${Math.floor(r.metal)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.energy} <span class="val">${Math.floor(r.energy)}</span></div>
      <div class="res-item">${RESOURCE_ICONS.rare} <span class="val">${Math.floor(r.rare)}</span></div>`;
  },

  updateStatus() {
    const s = Game.state;
    document.getElementById('day').textContent = s.day;
    document.getElementById('pop-count').textContent = `${s.population} / ${s.popCap}`;
    document.getElementById('base-name').textContent = s.currentMoon?.name || 'Base';

    const oxyPct = Math.min(100, (s.resources.oxygen / (s.population * 5 + 20)) * 100);
    const foodPct = Math.min(100, (s.resources.food / (s.population * 4 + 20)) * 100);
    document.getElementById('oxy-fill').style.width = oxyPct + '%';
    document.getElementById('oxy-val').textContent = Math.floor(oxyPct) + '%';
    document.getElementById('food-fill').style.width = foodPct + '%';
    document.getElementById('food-val').textContent = Math.floor(foodPct) + '%';
    document.getElementById('moral-fill').style.width = s.moral + '%';
    document.getElementById('moral-val').textContent = Math.floor(s.moral) + '%';

    const hasDome = Game.countBuilding('dome', true) > 0;
    const hasOxy = Game.countBuilding('oxygen', true) > 0;
    const hasHab = Game.countBuilding('habitat', true) > 0;
    const domeLvl = Game.getDomeLevel();
    document.getElementById('base-status').innerHTML = `
      <div>Dome: ${hasDome ? '✅ L' + domeLvl : '❌'}</div>
      <div>Oxygen: ${hasOxy ? '✅' : '❌'}</div>
      <div>Habitat: ${hasHab ? '✅' : '❌'}</div>
      <div>Buildings: ${s.buildings.filter(b => b.complete).length}</div>`;

    let obj = 'Expand and survive';
    if (!hasDome) obj = 'Build a Dome';
    else if (!hasOxy) obj = 'Build an O₂ Generator';
    else if (!hasHab) obj = 'Build a Habitat';
    else if (domeLvl < 3) obj = 'Upgrade Dome for more space';
    document.getElementById('objective').textContent = obj;
    document.getElementById('log').innerHTML = s.log.slice(0, 6).map(l => `<div>${l}</div>`).join('');
  },

  updateAll() {
    this.updateResources();
    this.updateStatus();
    this.renderBuildMenu();
  },

  renderPlanetMap() {
    const c = document.getElementById('planet-map');
    c.innerHTML = '';
    PLANETS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'planet-card';
      const moons = Game.state.moons.filter(m => m.planet === p.id);
      const gov = Game.state.governors[p.id];
      let govT = 'No Governor';
      if (gov === Game.state.playerId) govT = 'You are the Governor';
      else if (gov) govT = 'Enemy Governor';
      const dots = moons.length === 0
        ? '<span style="color:var(--muted);font-size:0.74rem">Locked</span>'
        : moons.map(m => {
            let cls = 'moon-dot';
            if (m.owner === Game.state.playerId) cls += ' owned';
            else if (m.owner) cls += ' enemy';
            return `<div class="${cls}">${m.owner ? '●' : '○'}</div>`;
          }).join('');
      card.innerHTML = `<h3>${p.name}</h3><div class="gov">${govT}</div><div class="moon-mini">${dots}</div>`;
      c.appendChild(card);
    });
  },

  showAlert(msg) {
    const box = document.getElementById('alert-box');
    box.textContent = msg;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 2500);
  },

  setupPan() {
    const view = document.getElementById('colony-view');
    const ground = document.getElementById('colony-ground');
    if (!view || !ground) return;

    const onStart = (e) => {
      this.isPanning = true;
      const pt = e.touches ? e.touches[0] : e;
      this.panStart = { x: pt.clientX - this.panX, y: pt.clientY - this.panY };
    };
    const onMove = (e) => {
      if (!this.isPanning) return;
      e.preventDefault();
      const pt = e.touches ? e.touches[0] : e;
      this.panX = Math.max(-40, Math.min(40, pt.clientX - this.panStart.x));
      this.panY = Math.max(-30, Math.min(30, pt.clientY - this.panStart.y));
      ground.style.transform = `translate(${this.panX}px, ${this.panY}px)`;
    };
    const onEnd = () => { this.isPanning = false; };

    view.addEventListener('mousedown', onStart);
    view.addEventListener('mousemove', onMove);
    view.addEventListener('mouseup', onEnd);
    view.addEventListener('mouseleave', onEnd);
    view.addEventListener('touchstart', onStart, { passive: true });
    view.addEventListener('touchmove', onMove, { passive: false });
    view.addEventListener('touchend', onEnd);
  },

  bindEvents() {
    document.getElementById('btn-start').onclick = () => {
      if (!this.selectedFaction) return;
      Game.createNewGame(this.selectedFaction);
      document.getElementById('player-faction-badge').textContent = Game.state.faction.name;
      this.showScreen('screen-hangar');
      this.renderMoons();
    };

    document.getElementById('btn-continue').onclick = () => {
      if (!Game.state) return;
      document.getElementById('player-faction-badge').textContent = Game.state.faction.name;
      if (Game.state.currentMoon) this.enterBase();
      else { this.showScreen('screen-hangar'); this.renderMoons(); }
    };

    document.getElementById('btn-back-title').onclick = () => this.showScreen('screen-title');

    document.getElementById('btn-launch').onclick = () => {
      if (!Game.selectedMoonId) return;
      this.playLaunchAnimation(() => {
        if (Game.claimMoon(Game.selectedMoonId)) this.enterBase();
      });
    };

    document.querySelectorAll('.tab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.cat;
        this.renderBuildMenu();
      };
    });

    document.getElementById('btn-pause').onclick = () => {
      Game.speed = Game.speed === 0 ? 1 : 0;
      document.getElementById('btn-pause').textContent = Game.speed === 0 ? '▶' : '⏸';
    };
    document.getElementById('btn-speed').onclick = () => {
      Game.speed = Game.speed === 1 ? 2 : 1;
      document.getElementById('btn-speed').textContent = Game.speed === 2 ? '⏩' : '▶';
    };

    document.getElementById('btn-build-toggle').onclick = () => {
      document.getElementById('build-panel').classList.toggle('hidden');
    };
    document.getElementById('btn-close-build').onclick = () => {
      document.getElementById('build-panel').classList.add('hidden');
    };

    document.getElementById('btn-map').onclick = () => {
      this.renderPlanetMap();
      this.showScreen('screen-map');
    };
    document.getElementById('btn-back-game').onclick = () => this.showScreen('screen-game');
  },

  enterBase() {
    this.showScreen('screen-game');
    this.renderColony();
    this.renderBuildMenu();
    this.updateAll();
    document.getElementById('build-panel').classList.remove('hidden');
    Game.startLoop();
  }
};

document.addEventListener('DOMContentLoaded', () => UI.init());
