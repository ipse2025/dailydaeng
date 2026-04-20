import { useState } from 'react'

export default function MonthYearPicker({ year, month, onSelect, onClose }) {
  const [pickerYear, setPickerYear] = useState(year)

  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

  return (
    <div className="animate-slide-down"
         style={{
           position:   'absolute', top: '100%', left: 0, zIndex: 50,
           background: 'var(--color-surface)',
           borderRadius: 14,
           boxShadow:  '0 8px 24px rgba(0,0,0,0.15)',
           border:     '1px solid var(--color-border)',
           width:      200, padding: '12px 8px',
         }}>
      {/* 연도 선택 */}
      <div className="flex items-center justify-between mb-2 px-2">
        <button onClick={() => setPickerYear(y => y-1)}
                style={{ padding: '2px 8px', fontSize: 14, color: 'var(--color-text2)' }}>◀</button>
        <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--color-text1)' }}>{pickerYear}</span>
        <button onClick={() => setPickerYear(y => y+1)}
                style={{ padding: '2px 8px', fontSize: 14, color: 'var(--color-text2)' }}>▶</button>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 8 }} />

      {/* 월 격자 4×3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
        {MONTHS.map((m, i) => {
          const sel = pickerYear === year && i+1 === month
          return (
            <button key={i}
                    onClick={() => { onSelect(pickerYear, i+1); onClose() }}
                    style={{
                      borderRadius: 8, padding: '6px 2px',
                      fontSize: `calc(12px * var(--font-scale))`,
                      fontWeight: sel ? 700 : 400,
                      background:  sel ? 'var(--color-primary)' : 'transparent',
                      color:       sel ? '#fff' : 'var(--color-text1)',
                      border:      'none', cursor: 'pointer',
                    }}>
              {m}
            </button>
          )
        })}
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 0' }} />

      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '7px 0', borderRadius: 8,
          background: 'var(--color-primary)', color: '#fff',
          fontWeight: 700, fontSize: `calc(13px * var(--font-scale))`,
          border: 'none', cursor: 'pointer',
        }}>
        선택
      </button>
    </div>
  )
}
