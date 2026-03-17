import JSZip from 'jszip'

// ─── STL (binary) ────────────────────────────────────────────────────────────

export function exportSTL(tris, filename = 'woojgen.stl') {
  const buf = new ArrayBuffer(80 + 4 + tris.length * 50)
  const view = new DataView(buf)

  // Header (80 bytes, zero-filled — optionally write a title)
  const header = 'WoojGen STL Export'
  for (let i = 0; i < Math.min(header.length, 80); i++) {
    view.setUint8(i, header.charCodeAt(i))
  }

  // Triangle count
  view.setUint32(80, tris.length, true)

  let offset = 84
  for (const [a, b, c] of tris) {
    // Normal (computed from winding)
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    const nx = uy * vz - uz * vy
    const ny = uz * vx - ux * vz
    const nz = ux * vy - uy * vx
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
    view.setFloat32(offset,      nx / len, true); offset += 4
    view.setFloat32(offset,      ny / len, true); offset += 4
    view.setFloat32(offset,      nz / len, true); offset += 4
    // Vertices
    for (const v of [a, b, c]) {
      view.setFloat32(offset,     v[0], true); offset += 4
      view.setFloat32(offset,     v[1], true); offset += 4
      view.setFloat32(offset,     v[2], true); offset += 4
    }
    // Attribute byte count
    view.setUint16(offset, 0, true); offset += 2
  }

  const blob = new Blob([buf], { type: 'application/octet-stream' })
  triggerDownload(blob, filename)
}

// ─── 3MF ─────────────────────────────────────────────────────────────────────

export async function export3MF(tris, filename = 'woojgen.3mf') {
  // Build vertex list + triangle index list (deduplicate by string key)
  const vertices = []
  const indices = []
  const keyMap = new Map()

  const addVert = ([x, y, z]) => {
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`
    if (!keyMap.has(key)) {
      keyMap.set(key, vertices.length)
      vertices.push([x, y, z])
    }
    return keyMap.get(key)
  }

  for (const [a, b, c] of tris) {
    indices.push([addVert(a), addVert(b), addVert(c)])
  }

  const verticesXML = vertices.map(([x, y, z]) =>
    `      <vertex x="${x.toFixed(4)}" y="${y.toFixed(4)}" z="${z.toFixed(4)}" />`
  ).join('\n')

  const trianglesXML = indices.map(([v1, v2, v3]) =>
    `      <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`
  ).join('\n')

  const modelXML = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US"
  xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${verticesXML}
        </vertices>
        <triangles>
${trianglesXML}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`

  const relsXML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"
    Target="/3D/3dmodel.model" Id="rel0" />
</Relationships>`

  const contentTypesXML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`

  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypesXML)
  zip.folder('_rels').file('.rels', relsXML)
  zip.folder('3D').file('3dmodel.model', modelXML)

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  triggerDownload(blob, filename)
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
