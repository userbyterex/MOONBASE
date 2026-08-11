const FACTIONS = [
  {
    id: 'terracorp', name: 'TerraCorp',
    desc: 'Corporate miners. Efficiency above all.',
    bonus: '+20% mining speed',
    color: '#22d3ee', bg: '#0c2e3a',
    avatar: '🧑‍🔧', role: '⚙️',
    modifiers: { mining: 1.20, energy: 1.0, food: 1.0, oxygen: 1.0, popGrowth: 1.0 }
  },
  {
    id: 'aether', name: 'Aether Guild',
    desc: 'Scientists of life support systems.',
    bonus: '+15% oxygen & energy',
    color: '#a78bfa', bg: '#251a40',
    avatar: '👩‍🔬', role: '🔬',
    modifiers: { mining: 1.0, energy: 1.15, food: 1.0, oxygen: 1.15, popGrowth: 1.0 }
  },
  {
    id: 'redlegion', name: 'Red Legion',
    desc: 'Military expansionists. Ready for war.',
    bonus: '+25% future combat power',
    color: '#f87171', bg: '#3a1515',
    avatar: '💂', role: '⚔️',
    modifiers: { mining: 1.05, energy: 1.0, food: 1.0, oxygen: 1.0, popGrowth: 1.05 }
  },
  {
    id: 'gaia', name: 'Gaia Collective',
    desc: 'Growers and diplomats of new worlds.',
    bonus: '+20% food & population growth',
    color: '#34d399', bg: '#0d2e22',
    avatar: '🧑‍🌾', role: '🌿',
    modifiers: { mining: 1.0, energy: 1.0, food: 1.20, oxygen: 1.0, popGrowth: 1.20 }
  },
  {
    id: 'void', name: 'Void Syndicate',
    desc: 'Independent traders and smugglers.',
    bonus: '+15% future trade profit',
    color: '#fbbf24', bg: '#2e2508',
    avatar: '🕵️', role: '💰',
    modifiers: { mining: 1.08, energy: 1.05, food: 1.05, oxygen: 1.05, popGrowth: 1.0 }
  }
];

const BUILDINGS = {
  life: [
    { id: 'dome', name: 'Dome', icon: '🛡️', short: 'Dome', desc: 'Pressure & radiation shield', cost: { regolith: 40, metal: 10 }, max: 1, effect: { unlock: true } },
    { id: 'oxygen', name: 'O₂ Generator', icon: '💨', short: 'O₂', desc: '+8 oxygen / tick', cost: { regolith: 25, ice: 15 }, max: 6, effect: { oxygen: 8 } },
    { id: 'hydro', name: 'Hydroponics', icon: '🌱', short: 'Food', desc: '+6 food / tick', cost: { regolith: 20, ice: 20 }, max: 8, effect: { food: 6 } },
    { id: 'habitat', name: 'Habitat', icon: '🏠', short: 'Hab', desc: '+4 population capacity', cost: { regolith: 30, metal: 15 }, max: 10, effect: { popCap: 4 } }
  ],
  energy: [
    { id: 'solar', name: 'Solar Array', icon: '☀️', short: 'Solar', desc: '+5 energy / tick', cost: { regolith: 15, metal: 10 }, max: 12, effect: { energy: 5 } },
    { id: 'reactor', name: 'Reactor', icon: '⚛️', short: 'Reactor', desc: '+18 energy / tick', cost: { metal: 40, rare: 8 }, max: 4, effect: { energy: 18 } }
  ],
  extract: [
    { id: 'mine', name: 'Regolith Mine', icon: '⛏️', short: 'Mine', desc: '+4 regolith / tick', cost: { regolith: 10 }, max: 10, effect: { regolith: 4 } },
    { id: 'ice_drill', name: 'Ice Drill', icon: '🧊', short: 'Ice', desc: '+3 ice / tick', cost: { metal: 20, regolith: 15 }, max: 8, effect: { ice: 3 } },
    { id: 'metal_extractor', name: 'Metal Extractor', icon: '🔩', short: 'Metal', desc: '+2 metal / tick', cost: { regolith: 25, metal: 10 }, max: 6, effect: { metal: 2 } }
  ],
  infra: [
    { id: 'storage', name: 'Storage Hub', icon: '📦', short: 'Store', desc: '+50 storage capacity', cost: { regolith: 20, metal: 5 }, max: 5, effect: { storage: 50 } },
    { id: 'hangar', name: 'Hangar', icon: '🛸', short: 'Hangar', desc: 'Ready for ships next version', cost: { metal: 60, rare: 15 }, max: 1, effect: { hangar: true } }
  ]
};

const PLANETS = [
  { id: 'earth', name: 'Earth', moons: 12 },
  { id: 'mars', name: 'Mars', moons: 6, locked: true },
  { id: 'jupiter', name: 'Jupiter', moons: 4, locked: true }
];

function generateEarthMoons() {
  const names = ['Luna-Alpha','Luna-Beta','Luna-Gamma','Luna-Delta','Luna-Epsilon','Luna-Zeta','Luna-Eta','Luna-Theta','Luna-Iota','Luna-Kappa','Luna-Lambda','Luna-Mu'];
  return names.map((name, i) => ({
    id: `earth-moon-${i}`,
    name,
    planet: 'earth',
    owner: null,
    resources: {
      primary: i % 3 === 0 ? 'ice' : (i % 3 === 1 ? 'metal' : 'regolith'),
      secondary: 'regolith'
    }
  }));
}

const RESOURCE_ICONS = {
  regolith: '🪨', ice: '🧊', metal: '⚙️', rare: '💎', energy: '⚡', oxygen: '💨', food: '🥗'
};

// Grid size for placement (6 cols x 4 rows on the surface)
const GRID_COLS = 6;
const GRID_ROWS = 4;
