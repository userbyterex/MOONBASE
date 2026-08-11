# MOONBASE LUNA — Changelog

## Beta 3.0 (2026-08-11)

### Added
- Three.js 3D surface view with interactive buildings
- Fleet system with 5 ship types
- Combat simulator (6-round battles)
- Pirate raid events with timer
- Research lab and 6 technology trees
- Daily mission system with rewards
- Web Audio API sound effects (ambient, SFX)
- Audio toggle button
- Game reset button
- Population mortality (starvation)
- Threat banner for incoming pirates
- Mission progress bars
- Ship construction queue
- Tech research queue
- Building hover effects in 3D view
- Earth atmosphere glow in 3D
- Particle dust effects

### Fixed
- Construction progress bar now updates visually
- `created` timestamp initializes on new game
- Build times increased from ~5s to meaningful durations
- Reactor Helium-3 consumption is now significant (20/h per level)
- Population no longer immortal — dies without food/oxygen
- Energy need shown in top resource bar
- Offline catch-up refreshes UI immediately
- Locked planets (Mars, Jupiter) properly hidden
- Launch sequence memory leak fixed
- `innerHTML` spam in refresh reduced
- Upgrade buttons disabled when unaffordable
- Multiple moon ownership tracked properly

### Changed
- CSS: Added scrollbar styling, modal animations, threat pulse
- UI: New tabs for Fleet, Research, Missions, Log
- Balance: Fusion reactor now viable but costly
- Balance: Ship costs and build times tuned
- Balance: Tech costs scale exponentially

## Beta 2.0
- Initial release
- 5 factions, 13 buildings
- Resource production system
- Energy management
- Construction queue
- Moon claiming
- Offline production catch-up
