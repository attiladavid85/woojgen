export default function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.1em', color: '#556688', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: '#88bbff', fontFamily: 'inherit' }}>
          {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value}{unit}
        </span>
      </div>

      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: '#0d1525', borderRadius: 2,
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
