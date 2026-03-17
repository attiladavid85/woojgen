# WoojGen – Parametric G-Code Generator

## Project
Vite + React app, G-code generator for 3D printing. `npm run dev` → http://localhost:5173

## Printer target
Bambu Lab P1S — build volume: 250×250×250mm
Max layers: 2500 (at 0.1mm), max radius: 125mm, max panel: 250×250mm

## Git workflow
- Always branch off main: `git checkout -b feat/...` or `fix/...`
- Never push directly to main — always PR → merge
- `gh` CLI is at `/opt/homebrew/bin/gh` (not in default PATH)

## Stack
- React 18, Vite, Three.js (3D preview)
- Inline styles only (no CSS modules/Tailwind)
- Hungarian UI labels

## Machine protection principles (highest priority)
1. **Never generate G-code that endangers the printer.** Safety overrides aesthetics always.
2. **Z clamping is mandatory** — all Z moves must stay within `[zOffset, zOffset + layers * layerHeight]`. Never let the extruder go below the bed or above the print.
3. **Temperature commands** in the header are fixed (hotend 210°C, bed 60°C) — do not generate arbitrary temperatures.
4. **XY travel must stay within the build volume** — P1S is 250×250mm, center-origin. Max radius 125mm, max panel 250×250mm.
5. **No negative Z** — any G-code that moves Z below 0 is invalid and must be rejected.
6. **Validate before generate** — if `waveAmp >= layerHeight`, the Z wave could cause layer overlap; warn the user. If `meshGap <= waveAmp`, the spiral grid won't close cleanly; warn.
7. **Cap layers use `solidDisk`/`solidRect`** — never raw G1 moves for caps, to ensure consistent safe extrusion.
