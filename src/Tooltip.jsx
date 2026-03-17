import { useState } from 'react'

export default function InfoIcon({ text }) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 5 }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        width: 13, height: 13, borderRadius: '50%',
        background: '#1e293b', border: '1px solid #2d4060',
        color: '#6b82a0', fontSize: 9, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'default', userSelect: 'none', lineHeight: 1,
        flexShrink: 0,
      }}>i</span>

      {visible && (
        <div style={{
          position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
          background: '#1a2540', border: '1px solid #2a65d8',
          borderRadius: 6, padding: '6px 10px',
          fontSize: 11, color: '#a0c0e0', lineHeight: 1.5,
          width: 190, zIndex: 100,
          boxShadow: '0 4px 16px #00000088',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </span>
  )
}
