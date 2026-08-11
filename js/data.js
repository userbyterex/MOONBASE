const FACTIONS = [
  { id:'terracorp', name:'TerraCorp', desc:'Industrial extractors', bonus:'+20% mine production', color:'#22d3ee', bg:'#0c2e3a', avatar:'🧑‍🔧', role:'⚙️', mod:{mine:1.20, energy:1, build:1} },
  { id:'aether', name:'Aether Guild', desc:'Life-support scientists', bonus:'+15% energy efficiency', color:'#a78bfa', bg:'#251a40', avatar:'👩‍🔬', role:'🔬', mod:{mine:1, energy:1.15, build:1} },
  { id:'redlegion', name:'Red Legion', desc:'Military expansionists', bonus:'+15% shipyard speed (future)', color:'#f87171', bg:'#3a1515', avatar:'💂', role:'⚔️', mod:{mine:1.05, energy:1, build:1.05} },
  { id:'gaia', name:'Gaia Collective', desc:'Agrarian growth', bonus:'+10% all production', color:'#34d399', bg:'#0d2e22', avatar:'🧑‍🌾', role:'🌿', mod:{mine:1.10, energy:1.05, build:1} },
  { id:'void', name:'Void Syndicate', desc:'Traders & smugglers', bonus:'+10% build speed', color:'#fbbf24', bg:'#2e2508', avatar:'🕵️', role:'💰', mod:{mine:1.05, energy:1, build:0.90} }
];

// OGame-style buildings: one of each, upgrade by level
// cost grows: base * costFactor ^ level
// production grows similarly
const BUILDINGS = {
  regolith_mine: {
    id:'regolith_mine', name:'Regolith Mine', icon:'⛏️', cat:'resource',
    desc:'Produces Regolith (main building material)',
    baseCost:{regolith:60, ice:15}, costFactor:1.5,
    baseProd:30, prodFactor:1.1,
    baseEnergy:10, energyFactor:1.1,
    maxLevel:30
  },
  ice_mine: {
    id:'ice_mine', name:'Ice Extractor', icon:'🧊', cat:'resource',
    desc:'Produces Ice (advanced components)',
    baseCost:{regolith:48, ice:24}, costFactor:1.6,
    baseProd:20, prodFactor:1.1,
    baseEnergy:10, energyFactor:1.1,
    maxLevel:30
  },
  helium_synth: {
    id:'helium_synth', name:'Helium-3 Synth', icon:'⚛️', cat:'resource',
    desc:'Produces Helium-3 (fuel & research)',
    baseCost:{regolith:225, ice:75}, costFactor:1.5,
    baseProd:10, prodFactor:1.1,
    baseEnergy:20, energyFactor:1.1,
    maxLevel:25
  },
  solar: {
    id:'solar', name:'Solar Plant', icon:'☀️', cat:'energy',
    desc:'Produces Energy for mines',
    baseCost:{regolith:75, ice:30}, costFactor:1.5,
    baseProd:20, prodFactor:1.1, // energy production
    baseEnergy:0, energyFactor:1,
    maxLevel:30
  },
  reactor: {
    id:'reactor', name:'Fusion Reactor', icon:'🔆', cat:'energy',
    desc:'High energy. Consumes Helium-3.',
    baseCost:{regolith:900, ice:360, helium:180}, costFactor:1.8,
    baseProd:50, prodFactor:1.1,
    baseEnergy:0, energyFactor:1,
    requires:{helium_synth:5},
    maxLevel:20
  },
  storage: {
    id:'storage', name:'Storage Hub', icon:'📦', cat:'infra',
    desc:'Increases resource capacity',
    baseCost:{regolith:100, ice:50}, costFactor:2,
    baseProd:0, prodFactor:1,
    baseEnergy:0, energyFactor:1,
    maxLevel:15
  },
  dome: {
    id:'dome', name:'Dome', icon:'🛡️', cat:'infra',
    desc:'Life support shield. Higher level = more capacity.',
    baseCost:{regolith:200, ice:100}, costFactor:2,
    baseProd:0, prodFactor:1,
    baseEnergy:5, energyFactor:1.1,
    maxLevel:10
  },
  habitat: {
    id:'habitat', name:'Habitat', icon:'🏠', cat:'life',
    desc:'Increases population capacity',
    baseCost:{regolith:150, ice:80}, costFactor:1.8,
    baseProd:0, prodFactor:1,
    baseEnergy:5, energyFactor:1.1,
    maxLevel:15
  },
  oxygen: {
    id:'oxygen', name:'O₂ Plant', icon:'💨', cat:'life',
    desc:'Oxygen production for population',
    baseCost:{regolith:100, ice:60}, costFactor:1.6,
    baseProd:15, prodFactor:1.1, // oxygen
    baseEnergy:8, energyFactor:1.1,
    maxLevel:20
  },
  hydro: {
    id:'hydro', name:'Hydroponics', icon:'🌱', cat:'life',
    desc:'Food production',
    baseCost:{regolith:80, ice:100}, costFactor:1.6,
    baseProd:12, prodFactor:1.1, // food
    baseEnergy:8, energyFactor:1.1,
    maxLevel:20
  },
  robotics: {
    id:'robotics', name:'Robotics Factory', icon:'🤖', cat:'facility',
    desc:'Reduces construction time',
    baseCost:{regolith:400, ice:120, helium:200}, costFactor:2,
    baseProd:0, prodFactor:1,
    baseEnergy:10, energyFactor:1.1,
    maxLevel:12
  },
  shipyard: {
    id:'shipyard', name:'Shipyard', icon:'🛸', cat:'facility',
    desc:'Build fleets (PvP next version)',
    baseCost:{regolith:400, ice:200, helium:100}, costFactor:2,
    baseProd:0, prodFactor:1,
    baseEnergy:15, energyFactor:1.1,
    requires:{robotics:2},
    maxLevel:12
  },
  lab: {
    id:'lab', name:'Research Lab', icon:'🔬', cat:'facility',
    desc:'Unlock technologies (coming soon)',
    baseCost:{regolith:200, ice:400, helium:200}, costFactor:2,
    baseProd:0, prodFactor:1,
    baseEnergy:12, energyFactor:1.1,
    maxLevel:12
  }
};

const PLANETS = [
  { id:'earth', name:'Earth', moons:12 },
  { id:'mars', name:'Mars', moons:6, locked:true },
  { id:'jupiter', name:'Jupiter', moons:4, locked:true }
];

function generateEarthMoons() {
  const names = ['Luna-Alpha','Luna-Beta','Luna-Gamma','Luna-Delta','Luna-Epsilon','Luna-Zeta','Luna-Eta','Luna-Theta','Luna-Iota','Luna-Kappa','Luna-Lambda','Luna-Mu'];
  return names.map((n,i)=>({ id:`earth-moon-${i}`, name:n, planet:'earth', owner:null }));
}

const RES_ICON = { regolith:'🪨', ice:'🧊', helium:'⚛️', energy:'⚡', oxygen:'💨', food:'🥗' };
