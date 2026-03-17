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
