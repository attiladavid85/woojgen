// ─── G-CODE GENERATORS ────────────────────────────────────────────────────────

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

// ── Cylinder Lamp ──────────────────────────────────────────────────────────

export function generateCylinderLamp({
  radius, layers,
  waveAmp, waveFreq, wallWaves,
  extrusionWidth, layerHeight,
}) {
  const lines = [GCODE_HEADER('Cylinder Lamp')]
  let e = 0
  const STEPS = 120

  for (let layer = 0; layer < layers; layer++) {
    const z = (layer + 1) * layerHeight
    const ePerStep = (extrusionWidth * layerHeight * (2 * Math.PI * radius)) / STEPS / 10

    lines.push(`; Layer ${layer + 1}  Z=${z.toFixed(3)}`)
    lines.push(`G1 Z${z.toFixed(3)} F600`)

    for (let step = 0; step <= STEPS; step++) {
      const theta = (step / STEPS) * 2 * Math.PI

      // Radial wall wave
      const radialWave = waveAmp * Math.sin(wallWaves * theta + layer * 0.3)
      const r = radius + radialWave

      // Z oscillation for fabric drape effect
      const zWave = waveAmp * 0.5 * Math.sin(waveFreq * theta + layer * 0.5)

      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)
      e += ePerStep

      lines.push(
        `G1 X${x.toFixed(3)} Y${y.toFixed(3)} Z${(z + zWave).toFixed(3)} E${e.toFixed(5)} F${step === 0 ? 1200 : 2400}`
      )
    }
    lines.push('')
  }

  lines.push(GCODE_FOOTER)
  return lines.join('\n')
}

// ── Organic Vase ───────────────────────────────────────────────────────────

export function generateVase({
  radius, layers,
  waveAmp, waveFreq, wallWaves,
  extrusionWidth, layerHeight, flareTop,
}) {
  const lines = [GCODE_HEADER('Organic Vase')]
  let e = 0
  const STEPS = 120

  for (let layer = 0; layer < layers; layer++) {
    const z = (layer + 1) * layerHeight
    const progress = layer / layers

    // Profile curve: narrow base, wider middle, optional flare
    const profileFactor = flareTop
      ? 0.6 + 0.4 * Math.sin(progress * Math.PI) + 0.3 * progress
      : 0.7 + 0.3 * Math.sin(progress * Math.PI * 0.8)
    const r = radius * profileFactor

    const ePerStep = (extrusionWidth * layerHeight * (2 * Math.PI * r)) / STEPS / 10

    lines.push(`; Layer ${layer + 1}  Z=${z.toFixed(3)}  r=${r.toFixed(2)}`)
    lines.push(`G1 Z${z.toFixed(3)} F600`)

    for (let step = 0; step <= STEPS; step++) {
      const theta = (step / STEPS) * 2 * Math.PI

      const radialWave = waveAmp * profileFactor * Math.sin(wallWaves * theta + layer * 0.25)
      const rFinal = r + radialWave
      const zWave = waveAmp * 0.4 * Math.sin(waveFreq * theta + layer * 0.6)

      const x = rFinal * Math.cos(theta)
      const y = rFinal * Math.sin(theta)
      e += ePerStep

      lines.push(
        `G1 X${x.toFixed(3)} Y${y.toFixed(3)} Z${(z + zWave).toFixed(3)} E${e.toFixed(5)} F${step === 0 ? 1200 : 2400}`
      )
    }
    lines.push('')
  }

  lines.push(GCODE_FOOTER)
  return lines.join('\n')
}

// ── Fabric Panel ──────────────────────────────────────────────────────────

export function generatePanel({
  panelWidth, panelHeight, layers,
  waveAmp, waveFreq, gridX, gridY,
  extrusionWidth, layerHeight,
}) {
  const lines = [GCODE_HEADER('Fabric Panel')]
  let e = 0
  const lineCount = Math.round(panelHeight / (extrusionWidth * 2))
  const stepsX = Math.round(panelWidth / extrusionWidth)
  const ePerStep = (extrusionWidth * layerHeight * (panelWidth / stepsX)) / 10

  // Solid base (2 layers)
  for (let layer = 0; layer < 2; layer++) {
    const z = (layer + 1) * layerHeight
    lines.push(`; Base layer ${layer + 1}`)
    lines.push(`G1 Z${z.toFixed(3)} F600`)
    for (let l = 0; l < lineCount; l++) {
      const yBase = -panelHeight / 2 + (l / lineCount) * panelHeight
      const forward = l % 2 === 0
      for (let step = 0; step <= stepsX; step++) {
        const progress = step / stepsX
        const x = forward ? -panelWidth / 2 + progress * panelWidth : panelWidth / 2 - progress * panelWidth
        e += ePerStep
        lines.push(`G1 X${x.toFixed(3)} Y${yBase.toFixed(3)} Z${z.toFixed(3)} E${e.toFixed(5)} F2400`)
      }
    }
    lines.push('')
  }

  // Fabric layers with wave
  for (let layer = 2; layer < layers; layer++) {
    const z = (layer + 1) * layerHeight
    lines.push(`; Fabric layer ${layer + 1}`)
    lines.push(`G1 Z${z.toFixed(3)} F600`)

    for (let l = 0; l < lineCount; l++) {
      const yBase = -panelHeight / 2 + (l / lineCount) * panelHeight
      const forward = l % 2 === 0

      for (let step = 0; step <= stepsX; step++) {
        const progress = step / stepsX
        const x = forward
          ? -panelWidth / 2 + progress * panelWidth
          : panelWidth / 2 - progress * panelWidth

        // Woven fabric wave: XY combined oscillation
        const zWave =
          waveAmp * Math.sin(gridX * x * 0.25 + layer * 0.5) *
          Math.cos(gridY * yBase * 0.25 + layer * 0.4)

        e += ePerStep
        lines.push(
          `G1 X${x.toFixed(3)} Y${yBase.toFixed(3)} Z${(z + zWave).toFixed(3)} E${e.toFixed(5)} F${step === 0 ? 1200 : 2400}`
        )
      }
    }
    lines.push('')
  }

  lines.push(GCODE_FOOTER)
  return lines.join('\n')
}
