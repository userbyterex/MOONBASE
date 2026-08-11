const UI = {
  selectedFaction: null,
  currentTab: 'overview',

  init() {
    this.renderFactions();
    this.bindEvents();
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
      const el = document.createElement('div');
      el.className = 'faction-card';
      el.style.setProperty('--fc', f.color);
      el.style.setProperty('--fbg', f.bg);
      el.innerHTML = `<div class="faction-avatar">${f.avatar}</div><h4 style="color:${f.color}">${f.name}</h4><p>${f.desc}</p><div class="bonus">${f.bonus}</div>`;
      el.onclick = () => {
        document.querySelectorAll('.faction-card').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-start').querySelector('span').textContent = 'Launch Colony';
        this.selectedFaction = f.id;
      };
      c.appendChild(el);
    });
  },

  playLaunch(cb) {
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
      if (t === 5) { text.textContent = 'ENGINES ONLINE'; rocket.classList.add('ignite'); }
      if (t === 1) text.textContent = 'LIFTOFF';
      if (t <= 0) {
        clearInterval(iv);
        status.textContent = 'LIFTOFF';
        progress.style.width = '100%';
        rocket.classList.add('liftoff');
        text.textContent = 'TRANSIT TO ORBIT';
        setTimeout(cb, 3200);
      }
    }, 380);
  },

  renderMoons() {
    const list = document.getElementById('moon-list');
    list.innerHTML = '';
    Game.state.moons.filter(m => m.planet === 'earth').forEach(m => {
      const el = document.createElement('div');
      el.className = 'moon-card' + (m.owner ? ' claimed' : '');
      const st = m.owner === Game.state.playerId ? '<span class="free">Yours</span>' : m.owner ? '<span class="taken">Taken</span>' : '<span class="free">Free</span>';
      el.innerHTML = `<div><strong>${m.name}</strong></div>${st}`;
      if (!m.owner) {
        el.onclick = () => {
          document.querySelectorAll('.moon-card').forEach(x => x.classList.remove('selected'));
          el.classList.add('selected');
          Game.selectedMoonId = m.id;
          const btn = document.getElementById('btn-launch');
          btn.disabled = false;
          btn.textContent = `Launch to ${m.name}`;
        };
      }
      list.appendChild(el);
    });
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
    if (tab === 'buildings') this.renderBuildings();
    if (tab === 'surface') this.renderSurface();
    if (tab === 'overview') this.refresh();
  },

  refresh() {
    if (!Game.state?.currentMoon) return;
    this.updateResources();
    this.updateOverview();
    this.updateQueue();
  },

  updateResources() {
    const r = Game.state.resources;
    document.getElementById('resource-bar').innerHTML = `
      <div class="res-item">${RES_ICON.regolith} <span class="val">${Math.floor(r.regolith)}</span></div>
      <div class="res-item">${RES_ICON.ice} <span class="val">${Math.floor(r.ice)}</span></div>
      <div class="res-item">${RES_ICON.helium} <span class="val">${Math.floor(r.helium)}</span></div>
      <div class="res-item">${RES_ICON.energy} <span class="val">${Game.getEnergyProd()}</span></div>`;
    document.getElementById('base-name').textContent = Game.state.currentMoon.name;
    document.getElementById('day').textContent = Game.state.day;
  },

  updateOverview() {
    const prod = Game.getProduction();
    const need = Game.getEnergyNeed();
    const have = Game.getEnergyProd();
    const ef = Game.getEnergyFactor();

    document.getElementById('prod-list').innerHTML = `
      <div>${RES_ICON.regolith} Regolith: <span>+${prod.regolith}/h</span></div>
      <div>${RES_ICON.ice} Ice: <span>+${prod.ice}/h</span></div>
      <div>${RES_ICON.helium} Helium-3: <span>+${prod.helium}/h</span></div>
      <div>${RES_ICON.oxygen} Oxygen: <span>+${prod.oxygen}/h</span></div>
      <div>${RES_ICON.food} Food: <span>+${prod.food}/h</span></div>
      ${ef < 1 ? '<div style="color:var(--red)">⚠ Low energy — production reduced</div>' : ''}`;

    document.getElementById('energy-balance').textContent = `${have} / ${need}`;
    document.getElementById('energy-balance').style.color = have >= need ? 'var(--green)' : 'var(--red)';

    document.getElementById('status-box').innerHTML = `
      <div>Population: ${Game.state.population} / ${Game.state.popCap}</div>
      <div>Oxygen: ${Math.floor(Game.state.resources.oxygen)}</div>
      <div>Food: ${Math.floor(Game.state.resources.food)}</div>
      <div>Dome level: ${Game.state.levels.dome || 0}</div>`;

    document.getElementById('faction-info').innerHTML = `
      <div style="color:${Game.state.faction.color}">${Game.state.faction.name}</div>
      <div class="muted">${Game.state.faction.bonus}</div>`;
  },

  updateQueue() {
    const box = document.getElementById('queue-box');
    const q = Game.state.queue;
    if (!q) {
      box.innerHTML = '<p class="muted">Nothing in construction</p>';
      return;
    }
    const def = BUILDINGS[q.buildingId];
    const elapsed = Date.now() - q.startTime;
    const pct = Math.min(100, (elapsed / q.duration) * 100);
    const left = Math.max(0, Math.ceil((q.duration - elapsed) / 1000));
    box.innerHTML = `
      <div class="q-item">
        <div><strong>${def.icon} ${def.name}</strong> → Level ${q.levelTo}</div>
        <div class="muted">${left}s remaining</div>
        <div class="queue-bar"><div class="queue-fill" style="width:${pct}%"></div></div>
      </div>`;
  },

  renderBuildings() {
    const list = document.getElementById('buildings-list');
    list.innerHTML = '';
    const order = ['regolith_mine','ice_mine','helium_synth','solar','reactor','storage','dome','habitat','oxygen','hydro','robotics','shipyard','lab'];
    order.forEach(id => {
      const def = BUILDINGS[id];
      if (!def) return;
      const lvl = Game.state.levels[id] || 0;
      const cost = Game.levelCost(def.baseCost, def.costFactor, lvl);
      const can = Game.canUpgrade(id);
      const time = Game.getBuildTime(id);
      const costStr = Object.entries(cost).map(([k,v]) => `${RES_ICON[k]||k} ${v}`).join('  ');

      let reqStr = '';
      if (def.requires) {
        const missing = Object.entries(def.requires).filter(([rid, rl]) => (Game.state.levels[rid]||0) < rl);
        if (missing.length) reqStr = `<div class="desc" style="color:var(--red)">Requires: ${missing.map(([rid,rl]) => BUILDINGS[rid].name + ' ' + rl).join(', ')}</div>`;
      }

      const row = document.createElement('div');
      row.className = 'b-row';
      row.innerHTML = `
        <div class="b-icon">${def.icon}</div>
        <div class="b-info">
          <h4>${def.name}</h4>
          <div class="lvl">Level ${lvl}${lvl >= def.maxLevel ? ' (MAX)' : ''}</div>
          <div class="desc">${def.desc}</div>
          ${reqStr}
          ${lvl < def.maxLevel ? `<div class="cost">${costStr}</div>` : ''}
        </div>
        <div class="b-actions">
          ${lvl < def.maxLevel ? `<button class="btn-upgrade" ${can?'':'disabled'} data-id="${id}">Upgrade</button>
          <div class="time">${time}s</div>` : '<span class="muted">Max</span>'}
        </div>`;
      list.appendChild(row);
    });

    list.querySelectorAll('.btn-upgrade').forEach(btn => {
      btn.onclick = () => {
        if (Game.startUpgrade(btn.dataset.id)) {
          this.renderBuildings();
          this.refresh();
        }
      };
    });
  },

  renderSurface() {
    const box = document.getElementById('surface-buildings');
    const dome = document.getElementById('dome-visual');
    box.innerHTML = '';
    const dl = Game.state.levels.dome || 0;
    if (dl > 0) {
      dome.classList.remove('hidden', 'level-1', 'level-2', 'level-3');
      dome.classList.add('level-' + Math.min(dl, 3));
    } else dome.classList.add('hidden');

    const show = ['regolith_mine','ice_mine','solar','habitat','oxygen','hydro','shipyard','reactor'];
    show.forEach(id => {
      const lvl = Game.state.levels[id] || 0;
      if (lvl <= 0) return;
      const def = BUILDINGS[id];
      const el = document.createElement('div');
      el.className = 'surf-bldg';
      el.innerHTML = `<div class="ico">${def.icon}</div><div class="nm">${def.name.split(' ')[0]}</div><div class="lv">Lv ${lvl}</div>`;
      box.appendChild(el);
    });
  },

  renderPlanetMap() {
    const c = document.getElementById('planet-map');
    c.innerHTML = '';
    PLANETS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'planet-card';
      const moons = Game.state.moons.filter(m => m.planet === p.id);
      const gov = Game.state.governors[p.id];
      let gt = 'No Governor';
      if (gov === Game.state.playerId) gt = 'You are Governor';
      else if (gov) gt = 'Enemy Governor';
      const dots = moons.length ? moons.map(m => {
        let cls = 'moon-dot';
        if (m.owner === Game.state.playerId) cls += ' owned';
        else if (m.owner) cls += ' enemy';
        return `<div class="${cls}">${m.owner ? '●' : '○'}</div>`;
      }).join('') : '<span class="muted">Locked</span>';
      card.innerHTML = `<h3>${p.name}</h3><div class="gov">${gt}</div><div class="moon-mini">${dots}</div>`;
      c.appendChild(card);
    });
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
      if (Game.state.currentMoon) this.enterGame();
      else { this.showScreen('screen-hangar'); this.renderMoons(); }
    };
    document.getElementById('btn-back-title').onclick = () => this.showScreen('screen-title');
    document.getElementById('btn-launch').onclick = () => {
      if (!Game.selectedMoonId) return;
      this.playLaunch(() => {
        if (Game.claimMoon(Game.selectedMoonId)) this.enterGame();
      });
    };
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => this.switchTab(btn.dataset.tab);
    });
    document.getElementById('btn-pause').onclick = () => {
      Game.speed = Game.speed === 0 ? 1 : 0;
      document.getElementById('btn-pause').textContent = Game.speed === 0 ? '▶' : '⏸';
    };
    document.getElementById('btn-speed').onclick = () => {
      Game.speed = Game.speed === 1 ? 3 : 1;
      document.getElementById('btn-speed').textContent = Game.speed === 3 ? '⏩' : '▶';
    };
    document.getElementById('btn-map').onclick = () => {
      this.renderPlanetMap();
      this.showScreen('screen-map');
    };
    document.getElementById('btn-back-game').onclick = () => this.showScreen('screen-game');
  },

  enterGame() {
    this.showScreen('screen-game');
    this.switchTab('overview');
    this.refresh();
    Game.startLoop();
  }
};

document.addEventListener('DOMContentLoaded', () => UI.init());
