# WoojGen 🌀

**Parametric G-Code Generator** for fabric-texture 3D printing.

Inspired by Wooj-style organic lamp aesthetics — generate sinusoidal, woven,
and rippling print paths directly as G-Code, without a slicer.

---

## Features

- **3 object modes**: Cylinder Lamp · Organic Vase · Fabric Panel
- **Real-time 3D preview** (Three.js, drag to rotate, scroll to zoom)
- **Parametric controls**: wave amplitude, frequency, wall waves, layer height, etc.
- **G-code export** — import directly into Bambu Studio or any slicer as custom G-code

---

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` in your browser.

---

## How it works

Instead of slicing a 3D model, WoojGen **programs the printhead path directly**
using mathematical functions:

```
X(θ) = (r + A·sin(n·θ + layer·φ)) · cos(θ)
Y(θ) = (r + A·sin(n·θ + layer·φ)) · sin(θ)
Z(θ) = z_layer + A·sin(f·θ + layer·ψ)
```

Where:
- `r` = base radius
- `A` = wave amplitude
- `n` = number of wall waves
- `f` = Z-frequency (fabric drape effect)
- `φ, ψ` = per-layer phase offsets (creates the twisting/knitting effect)

---

## Bambu Studio import

1. Generate your object → click **G-kód letöltés**
2. In Bambu Studio: **File → Import → Import G-Code**
3. Preview and print

> ⚠️ The G-code is pre-sliced — Bambu Studio won't re-slice it.
> Set your printer profile manually if needed (temps are in the file header).

---

## Project Structure

```
woojgen/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx        # Entry point
│   ├── App.jsx         # Main UI
│   ├── Preview3D.jsx   # Three.js 3D viewer
│   ├── Slider.jsx      # Reusable slider component
│   └── gcode.js        # G-code math & generators
├── index.html
├── vite.config.js
└── package.json
```

---

## Roadmap

- [ ] STL export (Three.js tube geometry)
- [ ] More object types (bowl, sphere, twisted column)
- [ ] Lissajous path mode
- [ ] Preset library (save/load params)
- [ ] Multi-color layer switching (M600)
- [ ] Print time estimator

---

MIT License
