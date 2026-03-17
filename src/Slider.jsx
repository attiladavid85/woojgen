import { useState } from 'react'
import InfoIcon from './Tooltip.jsx'

export default function Slider({ label, value, min, max, step = 1, onChange, unit = '', info }) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const display = typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value

  const commit = (str) => {
    const num = parseFloat(str)
    if (!isNaN(num)) onChange(Math.min(max, Math.max(min, num)))
    setEditing(false)
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 10, letterSpacing: '0.1em', color: '#8aa8c8', textTransform: 'uppercase' }}>
          {label}{info && <InfoIcon text={info} />}
        </span>
        {editing ? (
          <input
            autoFocus
            type="number" min={min} max={max} step={step}
            defaultValue={display}
            onChange={e => setRaw(e.target.value)}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(raw || e.target.value); if (e.key === 'Escape') setEditing(false) }}
            style={{
              width: 70, background: '#1e293b', border: '1px solid #2a65d8',
              borderRadius: 4, color: '#88bbff', fontSize: 12,
              fontFamily: 'inherit', padding: '1px 4px', textAlign: 'right',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onClick={() => { setRaw(''); setEditing(true) }}
            title="Kattints a szerkesztéshez"
            style={{ fontSize: 12, color: '#93c5fd', fontFamily: 'inherit', cursor: 'text', borderBottom: '1px dashed #2a65d844' }}
          >
            {display}{unit}
          </span>
        )}
      </div>

      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: '#1e293b', borderRadius: 2,
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute', left: 0, width: `${pct}%`, height: 2,
          background: 'linear-gradient(to right, #1a44aa, #44aaff)',
          borderRadius: 2, transition: 'width 0.05s',
        }} />
        {/* Native input (invisible, handles interaction) */}
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute', width: '100%', opacity: 0,
            cursor: 'pointer', height: 20, margin: 0,
          }}
        />
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 7px)`,
          width: 14, height: 14,
          background: 'linear-gradient(135deg, #55bbff, #1a44cc)',
          borderRadius: '50%',
          border: '2px solid #0a0a1f',
          boxShadow: '0 0 6px #44aaff66',
          pointerEvents: 'none',
          transition: 'left 0.05s',
        }} />
      </div>
    </div>
  )
}
