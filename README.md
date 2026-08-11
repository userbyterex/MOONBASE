# MOONBASE (LUNA) — Beta 3.0

OGame-style lunar empire builder with 3D surface, fleet combat, research tree, and dynamic events.

## What's New in Beta 3.0

### 🎨 Visual
- **3D Surface View** — Interactive WebGL moon with Three.js. Click buildings to inspect them.
- Procedural crater textures, Earth in the sky, particle atmosphere
- Building glow effects, hover animations, dome scaling

### ⚔️ Combat & Fleet
- **5 Ship Types**: Scout, Fighter, Bomber, Cruiser, Carrier
- **Shipyard Queue** — Build multiple ships with construction times
- **Pirate Raids** — Random enemy fleets attack your colony. Defend with your fleet!
- **Battle Simulator** — 6-round combat with attack/defense/cargo mechanics

### 🔬 Research
- **6 Tech Trees**: Ion Propulsion, Nano Armor, Plasma Weapons, Deep Core Mining, Zero-Point Energy, Sensor Array
- Research Lab required. Queue-based research system.

### 🎲 Events
- ☄️ **Meteor Shower** — Damage based on dome level
- ☀️ **Solar Flare** — +50% solar production for 1 hour
- 🛸 **Derelict Vessel** — Free resource salvage
- ☠️ **Pirate Raiders** — Defend within 5 minutes or lose resources

### 📋 Missions
- 3 daily missions with resource rewards
- Progress tracking with visual bars
- Auto-generation at midnight

### 🔊 Audio
- Web Audio API — no external files needed
- Ambient space drone, build/upgrade/error/battle/victory SFX
- Toggle button in top bar

### 🛠️ Fixes from Beta 2.0
- Construction progress bar now works
- Build times increased (was instant, now meaningful)
- Energy balance shown in top bar
- Reactor consumes meaningful Helium-3
- Population can die from starvation
- Offline catch-up refreshes UI immediately
- `created` timestamp properly initialized
- Locked planets actually locked
- Memory leak in launch sequence fixed
- Reset game button added

## How to Play

1. Choose faction → Launch → Claim a moon
2. Upgrade Regolith Mine, Ice Extractor, Solar Plant
3. Keep Energy positive
4. Build Robotics → Shipyard → Build fleet
5. Build Lab → Research technologies
6. Defend against pirate raids!
7. Complete daily missions for bonus resources

## File Structure
```
MOONBASE/
├── index.html          # Main HTML with all screens
├── css/style.css       # Styles (dark sci-fi theme)
├── js/
│   ├── data.js         # Factions, buildings, ships, techs, events, missions
│   ├── game.js         # Core game loop, production, saving
│   ├── ui.js           # All UI rendering and interaction
│   ├── fleet.js        # Fleet building and combat simulation
│   ├── combat.js       # Battle utilities and formatting
│   ├── tech.js         # Research system
│   ├── events.js       # Random event system
│   ├── missions.js     # Daily mission system
│   ├── audio.js        # Web Audio API sound effects
│   └── three-scene.js  # 3D moon surface (Three.js)
```

## Tech Stack
- HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- Three.js (via CDN importmap)
- localStorage for save games
- Web Audio API for sound

## Browser Support
- Chrome/Edge 90+
- Firefox 90+
- Safari 15+
- Mobile browsers (touch-friendly)

## License
MIT — feel free to fork, modify, and expand!
