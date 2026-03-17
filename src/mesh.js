// ─── MESH GENERATORS ─────────────────────────────────────────────────────────
// Produce triangle soup (flat Float32Array of xyz triplets, 3 vertices per tri)
// for STL / 3MF export. Uses the same parametric math as gcode.js.

const CAP_LAYERS = 3
const STEPS = 120

// Build one ring of vertices at given layer index
function cylinderRing(layer, layers, params, zOffset, mirrorK) {
  const { radius, waveAmp, waveFreq, wallWaves, layerHeight, mirrorSpiral, meshGap } = params
  const z = zOffset + (layer + 1) * layerHeight
  const k = mirrorSpiral ? (Math.PI * layerHeight / meshGap) : 0.3
  const s = (mirrorSpiral && layer % 2 === 1) ? -1 : 1
  const verts = []
  for (let step = 0; step <= STEPS; step++) {
    const theta = (step / STEPS) * 2 * Math.PI
    const radialWave = waveAmp * Math.sin(wallWaves * theta + s * layer * k)
    const r = radius + radialWave
    const zWave = waveAmp * 0.5 * Math.sin(waveFreq * theta + s * layer * k)
    verts.push([r * Math.cos(theta), r * Math.sin(theta), z + zWave])
  }
  return verts
}

function vaseRing(layer, layers, params, zOffset) {
  const { radius, waveAmp, waveFreq, wallWaves, layerHeight, mirrorSpiral, meshGap, flareTop } = params
  const z = zOffset + (layer + 1) * layerHeight
  const progress = layer / layers
  const profileFactor = flareTop
    ? 0.6 + 0.4 * Math.sin(progress * Math.PI) + 0.3 * progress
    : 0.7 + 0.3 * Math.sin(progress * Math.PI * 0.8)
  const r = radius * profileFactor
  const k = mirrorSpiral ? (Math.PI * layerHeight / meshGap) : 0.25
  const s = (mirrorSpiral && layer % 2 === 1) ? -1 : 1
  const verts = []
  for (let step = 0; step <= STEPS; step++) {
    const theta = (step / STEPS) * 2 * Math.PI
    const radialWave = waveAmp * profileFactor * Math.sin(wallWaves * theta + s * layer * k)
    const rFinal = r + radialWave
    const zWave = waveAmp * 0.4 * Math.sin(waveFreq * theta + s * layer * k)
    verts.push([rFinal * Math.cos(theta), rFinal * Math.sin(theta), z + zWave])
  }
  return verts
}

// Triangulate a quad between two adjacent rings (same column index i)
function pushQuad(tris, a, b, c, d) {
  // a--b
  // |  |
  // c--d  → two triangles
  tris.push(a, b, c)
  tris.push(b, d, c)
}

// Compute face normal for winding check / STL
function faceNormal(a, b, c) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
  return [nx / len, ny / len, nz / len]
}

// Disk cap triangles: fan from center to ring
function diskFan(tris, ring, z, inward) {
  const cx = 0, cy = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const a = [cx, cy, z]
    const b = ring[i]
    const c = ring[i + 1]
    tris.push(inward ? [a, c, b] : [a, b, c])
  }
}

function buildWallTris(rings) {
  const tris = []
  for (let ri = 0; ri < rings.length - 1; ri++) {
    const top = rings[ri + 1]
    const bot = rings[ri]
    const n = bot.length - 1 // last == first (closed ring)
    for (let i = 0; i < n; i++) {
      const a = bot[i], b = bot[i + 1], c = top[i], d = top[i + 1]
      tris.push([a, c, b])
      tris.push([b, c, d])
    }
  }
  return tris
}

// ── Public generators ────────────────────────────────────────────────────────

export function cylinderLampMesh(params) {
  const { layers, layerHeight, capBottom, capTop, radius } = params
  const zOffset = capBottom ? CAP_LAYERS * layerHeight : 0

  const rings = []
  for (let layer = 0; layer < layers; layer++) {
    rings.push(cylinderRing(layer, layers, params, zOffset))
  }

  const tris = buildWallTris(rings)

  if (capBottom) {
    const botRing = rings[0]
    const z = botRing[0][2]
    diskFan(tris, botRing, z, false)
  }
  if (capTop) {
    const topRing = rings[rings.length - 1]
    const z = topRing[0][2]
    diskFan(tris, topRing, z, true)
  }

  return tris
}

export function vaseMesh(params) {
  const { layers, layerHeight, capBottom, capTop } = params
  const zOffset = capBottom ? CAP_LAYERS * layerHeight : 0

  const rings = []
  for (let layer = 0; layer < layers; layer++) {
    rings.push(vaseRing(layer, layers, params, zOffset))
  }

  const tris = buildWallTris(rings)

  if (capBottom) {
    const botRing = rings[0]
    diskFan(tris, botRing, botRing[0][2], false)
  }
  if (capTop) {
    const topRing = rings[rings.length - 1]
    diskFan(tris, topRing, topRing[0][2], true)
  }

  return tris
}

export function panelMesh(params) {
  const { panelWidth, panelHeight, layers, waveAmp, gridX, gridY, layerHeight, capBottom } = params
  const zOffset = capBottom ? CAP_LAYERS * layerHeight : 0
  const GRID_X = Math.round(panelWidth / 2)
  const GRID_Y = Math.round(panelHeight / 2)
  const tris = []

  // Top surface at final layer z
  const z = zOffset + layers * layerHeight
  const grid = []
  for (let row = 0; row <= GRID_Y; row++) {
    const rowVerts = []
    for (let col = 0; col <= GRID_X; col++) {
      const x = -panelWidth / 2 + (col / GRID_X) * panelWidth
      const y = -panelHeight / 2 + (row / GRID_Y) * panelHeight
      const zWave = waveAmp * Math.sin(gridX * x * 0.25) * Math.cos(gridY * y * 0.25)
      rowVerts.push([x, y, z + zWave])
    }
    grid.push(rowVerts)
  }

  for (let row = 0; row < GRID_Y; row++) {
    for (let col = 0; col < GRID_X; col++) {
      const a = grid[row][col], b = grid[row][col + 1]
      const c = grid[row + 1][col], d = grid[row + 1][col + 1]
      tris.push([a, b, c])
      tris.push([b, d, c])
    }
  }

  return tris
}
