import { useState } from 'react'

export default function ShiftSetupPanel({ shiftConfig, onApply, onClose }) {
  const [mode,      setMode]      = useState(shiftConfig?.type || '')
  const [pattern,   setPattern]   = useState(shiftConfig?.pattern || '')
  const [startDate, setStartDate] = useState(shiftConfig?.startDate || '')

  const handleApply = () => {
    if (!mode) return
    if (mode === 'day') {
      onApply({ type: 'day' })
    } else {
      if (!pattern.trim() || !startDate) return
      onApply({ type: 'rotation', pattern: pattern.trim(), startDate })
    }
    onClose()
  }

  return (
    <div className="animate-slide-down"
         style={{
           position:'absolute', top:'100%', right:0, zIndex:50,
           background:'var(--color-surface)',
           borderRadius:14, boxShadow:'0 8px 24px rgba(0,0,0,0.15)',
           border:'1px solid var(--color-border)',
           width:210, padding:'12px 10px',
         }}>

      <div style={{ fontWeight:700, fontSize:`calc(13px * var(--font-scale))`, marginBottom:10, color:'var(--color-text1)' }}>
        근무 형태 선택
      </div>

      {/* 일근 근무 */}
      <button
        onClick={() => setMode('day')}
        style={{
          width:'100%', padding:'10px 12px', borderRadius:10, marginBottom:6,
          background: mode==='day' ? '#F0FDF4' : 'var(--color-bg)',
          border: `1.5px solid ${mode==='day' ? '#10B981' : 'var(--color-border)'}`,
          textAlign:'left', cursor:'pointer',
        }}>
        <div style={{ fontWeight:600, fontSize:`calc(13px * var(--font-scale))`, color:'#10B981' }}>☀ 일근 근무</div>
        <div style={{ fontSize:`calc(10px * var(--font-scale))`, color:'var(--color-text2)', marginTop:2 }}>평일 주간 자동 적용</div>
      </button>

      {/* 교대 근무 */}
      <button
        onClick={() => setMode('rotation')}
        style={{
          width:'100%', padding:'10px 12px', borderRadius:10, marginBottom: mode==='rotation'?8:0,
          background: mode==='rotation' ? '#EFF6FF' : 'var(--color-bg)',
          border: `1.5px solid ${mode==='rotation' ? 'var(--color-primary)' : 'var(--color-border)'}`,
          textAlign:'left', cursor:'pointer',
        }}>
        <div style={{ fontWeight:600, fontSize:`calc(13px * var(--font-scale))`, color:'var(--color-primary)' }}>🔄 교대 근무</div>
        <div style={{ fontSize:`calc(10px * var(--font-scale))`, color:'var(--color-text2)', marginTop:2 }}>패턴·시작일 설정</div>
      </button>

      {/* 교대 근무 하위 설정 */}
      {mode === 'rotation' && (
        <div style={{ padding:'8px 4px', display:'flex', flexDirection:'column', gap:8 }}>
          <SubField label="근무 입력">
            <input
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="예: 주야비비휴휴"
              style={subInputStyle}
            />
          </SubField>
          <SubField label="시작일">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={subInputStyle}
            />
          </SubField>
        </div>
      )}

      {mode && (
        <>
          <div style={{ height:1, background:'var(--color-border)', margin:'8px 0' }} />
          <button onClick={handleApply} style={{
            width:'100%', padding:'9px 0', borderRadius:9,
            background:'var(--color-primary)', color:'#fff',
            fontWeight:700, fontSize:`calc(13px * var(--font-scale))`,
            border:'none', cursor:'pointer',
          }}>
            적용
          </button>
        </>
      )}
    </div>
  )
}

function SubField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize:`calc(11px * var(--font-scale))`, fontWeight:600, color:'var(--color-text2)', marginBottom:3 }}>{label}</div>
      {children}
    </div>
  )
}

const subInputStyle = {
  width:'100%', padding:'7px 10px', borderRadius:7,
  border:'1px solid var(--color-border)',
  background:'var(--color-bg)', color:'var(--color-text1)',
  fontSize:`calc(12px * var(--font-scale))`,
  fontFamily:"'Noto Sans KR', sans-serif",
}
