// ─── Bambu Studio G-code template parser ─────────────────────────────────────
//
// Extracts the machine-specific header and footer from a Bambu Studio exported
// .gcode file, so WoojGen can inject its own toolpath between them.
//
// Cut points (robust across Bambu Studio versions):
//   Header ends after: M981 S1 P20000  (open spaghetti detector)
//   Footer starts at:  M981 S0 P20000  (close spaghetti detector)

export function parseBambuTemplate(text) {
  const lines = text.split('\n')

  const headerEndIdx = lines.findIndex(l => l.startsWith('M981 S1 P20000'))
  const footerStartIdx = lines.findIndex(l => l.startsWith('M981 S0 P20000'))

  if (headerEndIdx === -1 || footerStartIdx === -1) return null

  // Strip the CONFIG_BLOCK (it's huge and not needed in generated files)
  const configEnd = lines.findIndex(l => l.startsWith('; CONFIG_BLOCK_END'))
  const headerFrom = configEnd !== -1 ? configEnd + 1 : 0

  const header = lines.slice(headerFrom, headerEndIdx + 1).join('\n')
  const footer = lines.slice(footerStartIdx).join('\n')

  return { header, footer }
}

// Build the override block injected right after the Bambu header.
// Switches to absolute extrusion (M82) and resets E.
export const BAMBU_TOOLPATH_START = [
  '',
  '; ─── WoojGen toolpath ───────────────────────────',
  'M82 ; absolute extrusion (override Bambu M83)',
  'G92 E0 ; reset extruder',
  '',
].join('\n')

// Layer-change marker block for Bambu (enables progress display + timelapse).
// layerNum is 1-based.
export function bambuLayerMarker(layerNum, totalLayers, z, layerHeight) {
  return [
    `; CHANGE_LAYER`,
    `; Z_HEIGHT: ${z.toFixed(3)}`,
    `; LAYER_HEIGHT: ${layerHeight.toFixed(2)}`,
    `; layer num/total_layer_count: ${layerNum}/${totalLayers}`,
    `; update layer progress`,
    `M73 L${layerNum}`,
    `M991 S0 P${layerNum - 1} ;notify layer change`,
  ].join('\n')
}
