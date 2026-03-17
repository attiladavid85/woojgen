import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { generateCylinderLamp, generateVase, generatePanel } from './gcode.js'

const GENERATORS = { lamp: generateCylinderLamp, vase: generateVase, panel: generatePanel }
import Slider from './Slider.jsx'

const Preview3D = lazy(() => import('./Preview3D.jsx'))

// ─── Constants ───────────────────────────────────────────────────────────────

const MODES = [
  { id: 'lamp',  label: 'Lámpatest', icon: '◎', desc: 'Hengeres, szövetszerű fal' },
  { id: 'vase',  label: 'Váza',      icon: '◑', desc: 'Organikus profil + hullám' },
  { id: 'panel', label: 'Panel',     icon: '▦', desc: 'Szövetmintás lapos lap' },
]

const css = {
  sectionLabel: {
    fontSize: 10, letterSpacing: '0.2em', color: '#6b7fa0',
    textTransform: 'uppercase', marginBottom: 14, display: 'block',
  },
  btn: (active, accent = false) => ({
    width: '100%',
    padding: accent ? '13px' : '10px 14px',
    background: active
      ? 'linear-gradient(135deg, #131f3e, #182848)'
      : accent ? 'linear-gradient(135deg, #1a2fa8, #2258d8)' : 'transparent',
    border: `1px solid ${active || accent ? '#2a65d8' : '#1e293b'}`,
    borderRadius: 8,
    color: active ? '#93c5fd' : accent ? '#dbeafe' : '#7090b0',
    cursor: 'pointer',
    fontSize: accent ? 13 : 12,
    letterSpacing: '0.1em',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    boxShadow: active || accent ? '0 0 14px #2a65d833' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }),
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
          background: value ? '#2258d8' : '#1e293b',
          border: '1px solid #2d4060',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 18 : 3,
          width: 12, height: 12, borderRadius: '50%',
          background: value ? '#93c5fd' : '#6b7fa0',
          transition: 'left 0.2s, background 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 11, color: '#8aa8c8' }}>{label}</span>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState('lamp')
  const [view, setView] = useState('preview') // 'preview' | 'gcode'
  const [generating, setGenerating] = useState(false)
  const [gcodeText, setGcodeText] = useState('')

  const gcodeLines = useMemo(() => gcodeText ? gcodeText.split('\n') : [], [gcodeText])

  // Shared params
  const [radius, setRadius]               = useState(30)
  const [layers, setLayers]               = useState(60)
  const [waveAmp, setWaveAmp]             = useState(3)
  const [waveFreq, setWaveFreq]           = useState(6)
  const [wallWaves, setWallWaves]         = useState(8)
  const [layerHeight, setLayerHeight]     = useState(0.2)
  const [extrusionW, setExtrusionW]       = useState(0.4)
  const [flareTop, setFlareTop]           = useState(true)

  // Panel specific
  const [panelWidth, setPanelWidth]   = useState(80)
  const [panelHeight, setPanelHeight] = useState(80)
  const [gridX, setGridX]             = useState(5)
  const [gridY, setGridY]             = useState(5)

  // Caps
  const [capBottom, setCapBottom] = useState(false)
  const [capTop, setCapTop]       = useState(false)

  const generate = useCallback(() => {
    setGenerating(true)
    setTimeout(() => {
      const p = { radius, layers, waveAmp, waveFreq, wallWaves, layerHeight, extrusionWidth: extrusionW, flareTop, panelWidth, panelHeight, gridX, gridY, capBottom, capTop }
      setGcodeText(GENERATORS[mode](p))
      setView('preview')
      setGenerating(false)
    }, 60)
  }, [mode, radius, layers, waveAmp, waveFreq, wallWaves, layerHeight, extrusionW, flareTop, panelWidth, panelHeight, gridX, gridY, capBottom, capTop])

  const download = useCallback(() => {
    const blob = new Blob([gcodeText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `woojgen_${mode}_${Date.now()}.gcode`
    a.click()
    URL.revokeObjectURL(url)
  }, [gcodeText, mode])

  const moveCount = useMemo(() => gcodeLines.filter(l => l.startsWith('G1')).length, [gcodeLines])

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0c1018', color: '#d0e0f8',
      fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
    }}>
      {/* ── Header ── */}
      <header style={{
        padding: '14px 28px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to right, #0f1523, #111827)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.15em', color: '#eef4ff' }}>
            WOOJ<span style={{ color: '#44aaff' }}>GEN</span>
          </div>
          <div style={{ fontSize: 9, color: '#4a6080', letterSpacing: '0.25em', marginTop: 1 }}>
            PARAMETRIC G-CODE GENERATOR
          </div>
        </div>
        {gcodeText && (
          <div style={{ fontSize: 11, color: '#7090b0', textAlign: 'right', lineHeight: 1.7 }}>
            <span style={{ color: '#44aaff' }}>{moveCount.toLocaleString()}</span> mozgás
            <br />
            <span style={{ color: '#44aaff' }}>{(gcodeText.length / 1024).toFixed(1)}</span> KB
          </div>
        )}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: 270, background: '#111827',
          borderRight: '1px solid #1e293b',
          overflowY: 'auto', padding: '22px 20px',
          flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {/* Mode */}
          <section>
            <span style={css.sectionLabel}>Objektum típus</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={css.btn(mode === m.id)}>
                  <span style={{ fontSize: 15, opacity: 0.9 }}>{m.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: mode === m.id ? '#93c5fd' : '#7090b0', fontSize: 12 }}>{m.label}</div>
                    <div style={{ color: '#5a7295', fontSize: 9, letterSpacing: '0.05em' }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Dimensions */}
          <section>
            <span style={css.sectionLabel}>Méretek</span>
            {mode !== 'panel' ? (
              <Slider label="Sugár" value={radius} min={10} max={125} onChange={setRadius} unit=" mm" />
            ) : (
              <>
                <Slider label="Szélesség" value={panelWidth}  min={30} max={250} onChange={setPanelWidth}  unit=" mm" />
                <Slider label="Magasság"  value={panelHeight} min={30} max={250} onChange={setPanelHeight} unit=" mm" />
              </>
            )}
            <Slider label="Rétegek száma"      value={layers}      min={10}  max={2500} onChange={setLayers} />
            <Slider label="Rétegmagasság"       value={layerHeight} min={0.1} max={0.4}  step={0.05} onChange={setLayerHeight} unit=" mm" />
            <Slider label="Extrudálás szélesség" value={extrusionW}  min={0.2} max={0.8}  step={0.05} onChange={setExtrusionW}  unit=" mm" />
          </section>

          {/* Pattern */}
          <section>
            <span style={css.sectionLabel}>Mintázat</span>
            <Slider label="Hullám amplitúdó"   value={waveAmp}   min={0}  max={10} step={0.5} onChange={setWaveAmp}   unit=" mm" />
            <Slider label="Z hullám frekvencia" value={waveFreq}  min={1}  max={20}            onChange={setWaveFreq} />
            {mode !== 'panel' ? (
              <Slider label="Fal hullámok" value={wallWaves} min={2} max={24} onChange={setWallWaves} />
            ) : (
              <>
                <Slider label="Rács X" value={gridX} min={1} max={20} onChange={setGridX} />
                <Slider label="Rács Y" value={gridY} min={1} max={20} onChange={setGridY} />
              </>
            )}
            {mode === 'vase' && (
              <Toggle value={flareTop} onChange={setFlareTop} label="Kiszélesedő teteje" />
            )}
          </section>

          {/* Caps */}
          <section>
            <span style={css.sectionLabel}>Lezárás</span>
            <Toggle value={capBottom} onChange={setCapBottom} label="Talp (tömör alap)" />
            <Toggle value={capTop}    onChange={setCapTop}    label="Fedlap (tömör tető)" />
          </section>

          {/* Actions */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={generate} disabled={generating} style={{
              ...css.btn(false, true),
              justifyContent: 'center',
              padding: '13px',
              opacity: generating ? 0.6 : 1,
            }}>
              {generating ? '⏳  Generálás...' : '▶  Generálás'}
            </button>

            {gcodeText && (
              <>
                <button onClick={download} style={{ ...css.btn(false), justifyContent: 'center', color: '#8aa8c8' }}>
                  ↓  G-kód letöltés
                </button>
                <button
                  onClick={() => setView(v => v === 'gcode' ? 'preview' : 'gcode')}
                  style={{ ...css.btn(view === 'gcode'), justifyContent: 'center', color: '#7090b0', fontSize: 11 }}
                >
                  {view === 'gcode' ? '◎  3D Előnézet' : '≡  G-kód nézet'}
                </button>
              </>
            )}
          </section>
        </aside>

        {/* ── Main Area ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!gcodeText ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
              color: '#3a5070',
            }}>
              <div style={{ fontSize: 72 }}>◎</div>
              <div style={{ fontSize: 12, letterSpacing: '0.2em' }}>
                Állítsd be a paramétereket, majd nyomj <span style={{ color: '#5a7898' }}>GENERÁLÁS</span>-t
              </div>
            </div>
          ) : view === 'gcode' ? (
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px 24px',
              fontSize: 11, lineHeight: 1.7,
            }}>
              {gcodeLines.map((line, i) => (
                <div key={i} style={{
                  color: line.startsWith(';') ? '#4a6a8a'
                    : line.startsWith('G1') ? '#5588cc'
                    : line.startsWith('M') ? '#aa7744'
                    : '#5a7898',
                }}>
                  {line || '\u00a0'}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <Suspense fallback={
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a7898' }}>
                    Előnézet betöltése...
                  </div>
                }>
                  <Preview3D gcodeLines={gcodeLines} />
                </Suspense>
              </div>
              <div style={{
                textAlign: 'center', fontSize: 9, color: '#4a6080',
                marginTop: 8, letterSpacing: '0.2em',
              }}>
                HÚZD A FORGATÁSHOZ  ·  SCROLL = ZOOM
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
