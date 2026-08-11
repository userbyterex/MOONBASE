// ===================== GAME DATA =====================

const FACTIONS = [
  {
    id: 'terracorp',
    name: 'TerraCorp',
    desc: 'Industrial extractors. Maximum mining efficiency.',
    bonus: '+20% mining speed',
    color: '#22d3ee',
    modifiers: { mining: 1.20, energy: 1.0, food: 1.0, oxygen: 1.0, popGrowth: 1.0 }
  },
  {
    id: 'aether',
    name: 'Aether Guild',
    desc: 'Life-support scientists and engineers.',
    bonus: '+15% oxygen & energy efficiency',
    color: '#a78bfa',
    modifiers: { mining: 1.0, energy: 1.15, food: 1.0, oxygen: 1.15, popGrowth: 1.0 }
  },
  {
    id: 'redlegion',
    name: 'Red Legion',
    desc: 'Military expansionists. Ready for future PvP.',
    bonus: '+25% ship damage (future) & hangar capacity',
    color: '#f87171',
    modifiers: { mining: 1.05, energy: 1.0, food: 1.0, oxygen: 1.0, popGrowth: 1.05 }
  },
  {
    id: 'gaia',
    name: 'Gaia Collective',
    desc: 'Agrarian diplomats focused on growth.',
    bonus: '+20% food & population growth',
    color: '#34d399',
    modifiers: { mining: 1.0, energy: 1.0, food: 1.20, oxygen: 1.0, popGrowth: 1.20 }
  },
  {
    id: 'void',
    name: 'Void Syndicate',
    desc: 'Independent smugglers and traders.',
    bonus: '+15% trade profit (future)',
    color: '#fbbf24',
    modifiers: { mining: 1.08, energy: 1.05, food: 1.05, oxygen: 1.05, popGrowth: 1.0 }
  }
];

const BUILDINGS = {
  life: [
    {
      id: 'dome',
      name: 'Dome',
      icon: '🛡️',
      desc: 'Basic pressure & radiation shield',
      cost: { regolith: 40, metal: 10 },
      max: 1,
      effect: { unlock: true }
    },
    {
      id: 'oxygen',
      name: 'O₂ Generator',
      icon: '💨',
      desc: '+8 oxygen / tick',
      cost: { regolith: 25, ice: 15 },
      max: 6,
      effect: { oxygen: 8 }
    },
    {
      id: 'hydro',
      name: 'Hydroponics',
      icon: '🌱',
      desc: '+6 food / tick',
      cost: { regolith: 20, ice: 20 },
      max: 8,
      effect: { food: 6 }
    },
    {
      id: 'habitat',
      name: 'Habitat',
      icon: '🏠',
      desc: '+4 population capacity',
      cost: { regolith: 30, metal: 15 },
      max: 10,
      effect: { popCap: 4 }
    }
  ],
  energy: [
    {
      id: 'solar',
      name: 'Solar Array',
      icon: '☀️',
      desc: '+5 energy / tick',
      cost: { regolith: 15, metal: 10 },
      max: 12,
      effect: { energy: 5 }
    },
    {
      id: 'reactor',
      name: 'Reactor',
      icon: '⚛️',
      desc: '+18 energy / tick',
      cost: { metal: 40, rare: 8 },
      max: 4,
      effect: { energy: 18 }
    }
  ],
  extract: [
    {
      id: 'mine',
      name: 'Regolith Mine',
      icon: '⛏️',
      desc: '+4 regolith / tick',
      cost: { regolith: 10 },
      max: 10,
      effect: { regolith: 4 }
    },
    {
      id: 'ice_drill',
      name: 'Ice Drill',
      icon: '🧊',
      desc: '+3 ice / tick',
      cost: { metal: 20, regolith: 15 },
      max: 8,
      effect: { ice: 3 }
    },
    {
      id: 'metal_extractor',
      name: 'Metal Extractor',
      icon: '🔩',
      desc: '+2 metal / tick',
      cost: { regolith: 25, metal: 10 },
      max: 6,
      effect: { metal: 2 }
    }
  ],
  infra: [
    {
      id: 'storage',
      name: 'Storage Hub',
      icon: '📦',
      desc: '+50 storage capacity',
      cost: { regolith: 20, metal: 5 },
      max: 5,
      effect: { storage: 50 }
    },
    {
      id: 'hangar',
      name: 'Hangar (Beta)',
      icon: '🛸',
      desc: 'Ready for ships in next version',
      cost: { metal: 60, rare: 15 },
      max: 1,
      effect: { hangar: true }
    }
  ]
};

const PLANETS = [
  {
    id: 'earth',
    name: 'Earth',
    moons: 12,
    difficulty: 1,
    resources: ['regolith', 'ice', 'metal']
  },
  {
    id: 'mars',
    name: 'Mars',
    moons: 6,
    difficulty: 2,
    resources: ['regolith', 'metal', 'rare'],
    locked: true
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    moons: 4,
    difficulty: 3,
    resources: ['ice', 'rare', 'helium3'],
    locked: true
  }
];

function generateEarthMoons() {
  const moons = [];
  const names = [
    'Luna-Alpha', 'Luna-Beta', 'Luna-Gamma', 'Luna-Delta',
    'Luna-Epsilon', 'Luna-Zeta', 'Luna-Eta', 'Luna-Theta',
    'Luna-Iota', 'Luna-Kappa', 'Luna-Lambda', 'Luna-Mu'
  ];
  for (let i = 0; i < 12; i++) {
    moons.push({
      id: `earth-moon-${i}`,
      name: names[i],
      planet: 'earth',
      owner: null,
      claimedAt: null,
      resources: {
        primary: i % 3 === 0 ? 'ice' : (i % 3 === 1 ? 'metal' : 'regolith'),
        secondary: 'regolith'
      }
    });
  }
  return moons;
}

const RESOURCE_ICONS = {
  regolith: '🪨',
  ice: '🧊',
  metal: '⚙️',
  rare: '💎',
  energy: '⚡',
  oxygen: '💨',
  food: '🥗'
};
