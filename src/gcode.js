// ─── G-CODE GENERATORS ────────────────────────────────────────────────────────

import { BAMBU_TOOLPATH_START, bambuLayerMarker } from './bambu.js'

const GCODE_HEADER = (title) => [
  `; ==========================================`,
  `; WoojGen – ${title}`,
  `; Generated: ${new Date().toISOString()}`,
  `; ==========================================`,
  `G21 ; units: mm`,
  `G90 ; absolute positioning`,
  `M82 ; extruder absolute`,
  `G28 ; auto home`,
  `G1 Z5 F3000 ; lift`,
  `M104 S210 ; set hotend temp`,
  `M109 S210 ; wait for hotend`,
  `M140 S60  ; set bed temp`,
  `M190 S60  ; wait for bed`,
  `G92 E0    ; reset extruder`,
  ``,
].join('\n')

const GCODE_FOOTER = [
  ``,
  `; ── End of print ──`,
  `M104 S0  ; hotend off`,
  `M140 S0  ; bed off`,
  `G91`,
  `G1 Z10 F600 ; lift`,
  `G90`,
  `G1 X0 Y200 F3000 ; park`,
  `M84      ; motors off`,
].join('\n')

const CAP_LAYERS = 3

// Fills a solid circular disk at height z, returns updated e
function solidDisk(z, r, extrusionWidth, layerHeight, lines, e) {
  // Non-extruding travel to outer ring start — avoids ooze line from wherever the head is
  lines.push(`G1 X${r.toFixed(3)} Y0.000 Z${z.toFixed(3)} F9000`)
  let cr = r
  while (cr > extrusionWidth / 2) {
    const STEPS = Math.max(24, Math.round((2 * Math.PI * cr) / extrusionWidth))
    const ePerStep = (extrusionWidth * layerHeight * (2 * Math.PI * cr)) / STEPS / 10
    for (let step = 0; step <= STEPS; step++) {
      const theta = (step / STEPS) * 2 * Math.PI
      e += ePerStep
      lines.push(`G1 X${(cr * Math.cos(theta)).toFixed(3)} Y${(cr * Math.sin(theta)).toFixed(3)} Z${z.toFixed(3)} E${e.toFixed(5)} F${step === 0 ? 1200 : 2400}`)
    }
    cr -= extrusionWidth
  }
  return e
}

// Fills a solid rectangle at height z, returns updated e
function solidRect(z, w, h, extrusionWidth, layerHeight, lines, e) {
  // Non-extruding travel to first line start
  lines.push(`G1 X${(-w / 2).toFixed(3)} Y${(-h / 2).toFixed(3)} Z${z.toFixed(3)} F9000`)
  const lineCount = Math.round(h / (extrusionWidth * 2))
  const stepsX = Math.round(w / extrusionWidth)
  const ePerStep = (extrusionWidth * layerHeight * (w / stepsX)) / 10
  for (let l = 0; l < lineCount; l++) {
    const yBase = -h / 2 + (l / lineCount) * h
    const forward = l % 2 === 0
    for (let step = 0; step <= stepsX; step++) {
      const progress = step / stepsX
      const x = forward ? -w / 2 + progress * w : w / 2 - progress * w
      e += ePerStep
      lines.push(`G1 X${x.toFixed(3)} Y${yBase.toFixed(3)} Z${z.toFixed(3)} E${e.toFixed(5)} F2400`)
    }
  }
  return e
}

// ── Cylinder Lamp ──────────────────────────────────────────────────────────

export function generateCylinderLamp({
  radius, layers,
  waveAmp, waveFreq, wallWaves,
  extrusionWidth, layerHeight,
  capBottom = false, capTop = false,
  mirrorSpiral = false, meshGap = 5,
  bambuTemplate = null,
}) {
  const header = bambuTemplate
    ? bambuTemplate.header + BAMBU_TOOLPATH_START
    : GCODE_HEADER('Cylinder Lamp')
  const footer = bambuTemplate ? bambuTemplate.footer : GCODE_FOOTER
  const totalLayers = layers + (capBottom ? CAP_LAYERS : 0) + (capTop ? CAP_LAYERS : 0)

  const lines = [header]
  let e = 0
  let layerNum = 0
  const STEPS = 120
  const zOffset = capBottom ? CAP_LAYERS * layerHeight : 0
  const zMin = zOffset
  const zMax = zOffset + layers * layerHeight
  // Mirror spiral: k derived from meshGap so spirals cross every meshGap mm
  const k = mirrorSpiral ? (Math.PI * layerHeight / meshGap) : 0.3

  if (capBottom) {
    for (let i = 0; i < CAP_LAYERS; i++) {
      layerNum++
      const z = (i + 1) * layerHeight
      lines.push(bambuTemplate ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight) : `; Bottom cap ${i + 1}  Z=${z.toFixed(3)}`)
      lines.push(`G1 Z${z.toFixed(3)} F600`)
      e = solidDisk(z, radius, extrusionWidth, layerHeight, lines, e)
      lines.push('')
    }
  }

  for (let layer = 0; layer < layers; layer++) {
    layerNum++
    const z = zOffset + (layer + 1) * layerHeight
    const ePerStep = (extrusionWidth * layerHeight * (2 * Math.PI * radius)) / STEPS / 10
    // Alternate phase sign each layer for mirror spiral
    const s = (mirrorSpiral && layer % 2 === 1) ? -1 : 1

    lines.push(bambuTemplate
      ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight)
      : `; Layer ${layer + 1}${mirrorSpiral && layer % 2 === 1 ? ' [mirror]' : ''}  Z=${z.toFixed(3)}`)
    lines.push(`G1 Z${z.toFixed(3)} F600`)

    for (let step = 0; step <= STEPS; step++) {
      const theta = (step / STEPS) * 2 * Math.PI
      const radialWave = waveAmp * Math.sin(wallWaves * theta + s * layer * k)
      const r = radius + radialWave
      const zWave = waveAmp * 0.5 * Math.sin(waveFreq * theta + s * layer * k)
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)
      e += ePerStep
      lines.push(
        `G1 X${x.toFixed(3)} Y${y.toFixed(3)} Z${Math.max(zMin, Math.min(zMax, z + zWave)).toFixed(3)} E${e.toFixed(5)} F${step === 0 ? 1200 : 2400}`
      )
    }
    lines.push('')
  }

  if (capTop) {
    const topZ = zOffset + layers * layerHeight
    for (let i = 0; i < CAP_LAYERS; i++) {
      layerNum++
      const z = topZ + (i + 1) * layerHeight
      lines.push(bambuTemplate ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight) : `; Top cap ${i + 1}  Z=${z.toFixed(3)}`)
      lines.push(`G1 Z${z.toFixed(3)} F600`)
      e = solidDisk(z, radius, extrusionWidth, layerHeight, lines, e)
      lines.push('')
    }
  }

  lines.push(footer)
  return lines.join('\n')
}

// ── Organic Vase ───────────────────────────────────────────────────────────

export function generateVase({
  radius, layers,
  waveAmp, waveFreq, wallWaves,
  extrusionWidth, layerHeight, flareTop,
  capBottom = false, capTop = false,
  mirrorSpiral = false, meshGap = 5,
  bambuTemplate = null,
}) {
  const header = bambuTemplate
    ? bambuTemplate.header + BAMBU_TOOLPATH_START
    : GCODE_HEADER('Organic Vase')
  const footer = bambuTemplate ? bambuTemplate.footer : GCODE_FOOTER
  const totalLayers = layers + (capBottom ? CAP_LAYERS : 0) + (capTop ? CAP_LAYERS : 0)

  const lines = [header]
  let e = 0
  let layerNum = 0
  const STEPS = 120
  const zOffset = capBottom ? CAP_LAYERS * layerHeight : 0
  const zMin = zOffset
  const zMax = zOffset + layers * layerHeight
  const k = mirrorSpiral ? (Math.PI * layerHeight / meshGap) : 0.25

  const profileAt = (progress) => flareTop
    ? 0.6 + 0.4 * Math.sin(progress * Math.PI) + 0.3 * progress
    : 0.7 + 0.3 * Math.sin(progress * Math.PI * 0.8)

  if (capBottom) {
    const bottomR = radius * profileAt(0)
    for (let i = 0; i < CAP_LAYERS; i++) {
      layerNum++
      const z = (i + 1) * layerHeight
      lines.push(bambuTemplate ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight) : `; Bottom cap ${i + 1}  Z=${z.toFixed(3)}`)
      lines.push(`G1 Z${z.toFixed(3)} F600`)
      e = solidDisk(z, bottomR, extrusionWidth, layerHeight, lines, e)
      lines.push('')
    }
  }

  for (let layer = 0; layer < layers; layer++) {
    layerNum++
    const z = zOffset + (layer + 1) * layerHeight
    const progress = layer / layers
    const profileFactor = profileAt(progress)
    const r = radius * profileFactor
    const ePerStep = (extrusionWidth * layerHeight * (2 * Math.PI * r)) / STEPS / 10
    const s = (mirrorSpiral && layer % 2 === 1) ? -1 : 1

    lines.push(bambuTemplate
      ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight)
      : `; Layer ${layer + 1}${mirrorSpiral && layer % 2 === 1 ? ' [mirror]' : ''}  Z=${z.toFixed(3)}  r=${r.toFixed(2)}`)
    lines.push(`G1 Z${z.toFixed(3)} F600`)

    for (let step = 0; step <= STEPS; step++) {
      const theta = (step / STEPS) * 2 * Math.PI
      const radialWave = waveAmp * profileFactor * Math.sin(wallWaves * theta + s * layer * k)
      const rFinal = r + radialWave
      const zWave = waveAmp * 0.4 * Math.sin(waveFreq * theta + s * layer * k)
      const x = rFinal * Math.cos(theta)
      const y = rFinal * Math.sin(theta)
      e += ePerStep
      lines.push(
        `G1 X${x.toFixed(3)} Y${y.toFixed(3)} Z${Math.max(zMin, Math.min(zMax, z + zWave)).toFixed(3)} E${e.toFixed(5)} F${step === 0 ? 1200 : 2400}`
      )
    }
    lines.push('')
  }

  if (capTop) {
    const topR = radius * profileAt(1)
    const topZ = zOffset + layers * layerHeight
    for (let i = 0; i < CAP_LAYERS; i++) {
      layerNum++
      const z = topZ + (i + 1) * layerHeight
      lines.push(bambuTemplate ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight) : `; Top cap ${i + 1}  Z=${z.toFixed(3)}`)
      lines.push(`G1 Z${z.toFixed(3)} F600`)
      e = solidDisk(z, topR, extrusionWidth, layerHeight, lines, e)
      lines.push('')
    }
  }

  lines.push(footer)
  return lines.join('\n')
}

// ── Fabric Panel ──────────────────────────────────────────────────────────

export function generatePanel({
  panelWidth, panelHeight, layers,
  waveAmp, waveFreq, gridX, gridY,
  extrusionWidth, layerHeight,
  capBottom = true, capTop = false,
  bambuTemplate = null,
}) {
  const header = bambuTemplate
    ? bambuTemplate.header + BAMBU_TOOLPATH_START
    : GCODE_HEADER('Fabric Panel')
  const footer = bambuTemplate ? bambuTemplate.footer : GCODE_FOOTER
  const totalLayers = layers + (capBottom ? CAP_LAYERS : 0) + (capTop ? CAP_LAYERS : 0)

  const lines = [header]
  let e = 0
  let layerNum = 0
  const lineCount = Math.round(panelHeight / (extrusionWidth * 2))
  const stepsX = Math.round(panelWidth / extrusionWidth)
  const ePerStep = (extrusionWidth * layerHeight * (panelWidth / stepsX)) / 10
  const zOffset = capBottom ? CAP_LAYERS * layerHeight : 0
  const zMin = zOffset
  const zMax = zOffset + layers * layerHeight

  if (capBottom) {
    for (let i = 0; i < CAP_LAYERS; i++) {
      layerNum++
      const z = (i + 1) * layerHeight
      lines.push(bambuTemplate ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight) : `; Bottom cap ${i + 1}`)
      lines.push(`G1 Z${z.toFixed(3)} F600`)
      e = solidRect(z, panelWidth, panelHeight, extrusionWidth, layerHeight, lines, e)
      lines.push('')
    }
  }

  for (let layer = 0; layer < layers; layer++) {
    layerNum++
    const z = zOffset + (layer + 1) * layerHeight
    lines.push(bambuTemplate
      ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight)
      : `; Fabric layer ${layer + 1}`)
    lines.push(`G1 Z${z.toFixed(3)} F600`)

    for (let l = 0; l < lineCount; l++) {
      const yBase = -panelHeight / 2 + (l / lineCount) * panelHeight
      const forward = l % 2 === 0

      for (let step = 0; step <= stepsX; step++) {
        const progress = step / stepsX
        const x = forward
          ? -panelWidth / 2 + progress * panelWidth
          : panelWidth / 2 - progress * panelWidth
        const zWave =
          waveAmp * Math.sin(gridX * x * 0.25 + layer * 0.5) *
          Math.cos(gridY * yBase * 0.25 + layer * 0.4)
        e += ePerStep
        lines.push(
          `G1 X${x.toFixed(3)} Y${yBase.toFixed(3)} Z${Math.max(zMin, Math.min(zMax, z + zWave)).toFixed(3)} E${e.toFixed(5)} F${step === 0 ? 1200 : 2400}`
        )
      }
    }
    lines.push('')
  }

  if (capTop) {
    const topZ = zOffset + layers * layerHeight
    for (let i = 0; i < CAP_LAYERS; i++) {
      layerNum++
      const z = topZ + (i + 1) * layerHeight
      lines.push(bambuTemplate ? bambuLayerMarker(layerNum, totalLayers, z, layerHeight) : `; Top cap ${i + 1}`)
      lines.push(`G1 Z${z.toFixed(3)} F600`)
      e = solidRect(z, panelWidth, panelHeight, extrusionWidth, layerHeight, lines, e)
      lines.push('')
    }
  }

  lines.push(footer)
  return lines.join('\n')
}
