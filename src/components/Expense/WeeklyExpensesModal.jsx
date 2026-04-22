import { formatAmount, normalizeExpenseItems, toDateKey } from '../../utils/dateUtils'
import { CloseIcon } from '../icons/AppIcons'

const DOW_LABELS = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일']

export default function WeeklyExpensesModal({ weekNum, weekDays, entries, onClose }) {
  // 각 요일별 지출 항목 수집
  const perDay = weekDays
    .filter(d => d.isCurrentMonth)
    .map(d => {
      const key = toDateKey(d.year, d.month, d.day)
      const entry = entries[key] || {}
      const items = normalizeExpenseItems(entry).filter(it => it.amount > 0)
      const dow = new Date(`${key}T00:00:00`).getDay()
      return { date: d, items, dow }
    })
    .filter(d => d.items.length > 0)

  const total = perDay.reduce((s, d) => s + d.items.reduce((ss, it) => ss + it.amount, 0), 0)

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="animate-slide-up" onClick={e => e.stopPropagation()} style={wrapStyle}>
        <div style={handleWrap}><div style={handle} /></div>

        <div style={headerStyle}>
          <span style={titleStyle}>📊 {weekNum}주 지출 내역</span>
          <button onClick={onClose} style={{ ...closeBtn, display:'inline-flex', padding:0 }} aria-label="닫기"><CloseIcon size={20} color="var(--color-text2)" /></button>
        </div>

        <div style={{ padding:'12px 18px 18px', maxHeight:'60vh', overflowY:'auto' }}>
          {perDay.length === 0 ? (
            <div style={emptyStyle}>이번 주 지출 내역이 없습니다.</div>
          ) : (
            perDay.map(({ date, items, dow }) => (
              <div key={`${date.year}-${date.month}-${date.day}`} style={dayBlockStyle}>
                <div style={dayLabelStyle}>
                  <span style={{ fontWeight: 700, color: dow===0 ? '#EF4444' : dow===6 ? '#3B82F6' : 'var(--color-text1)' }}>
                    {DOW_LABELS[dow]}
                  </span>
                  <span style={{ fontSize:`calc(11px * var(--font-scale))`, color:'var(--color-text2)', marginLeft:6 }}>
                    {date.month}/{date.day}
                  </span>
                </div>
                {items.map((it, i) => (
                  <div key={i} style={itemRowStyle}>
                    <span style={catStyle}>{it.category}</span>
                    <span style={amtStyle}>{formatAmount(it.amount)}</span>
                    {it.text && <span style={textStyle}>{it.text}</span>}
                  </div>
                ))}
              </div>
            ))
          )}

          {perDay.length > 0 && (
            <div style={totalRowStyle}>
              <span style={{ fontWeight:800, color:'var(--color-text1)' }}>주간 합계</span>
              <span style={{ fontWeight:800, color:'#F59E0B' }}>{formatAmount(total)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const wrapStyle = {
  width: '100%', background: 'var(--color-surface)',
  borderRadius: '20px 20px 0 0',
  padding: '0 0 env(safe-area-inset-bottom)',
  boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
  maxHeight: '90vh', overflowY: 'auto',
}
const handleWrap = { display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:4 }
const handle = { width:36, height:4, borderRadius:2, background:'var(--color-border)' }
const headerStyle = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'8px 18px 10px',
  borderBottom:'1px solid var(--color-border)',
}
const titleStyle = {
  fontWeight:900, fontSize:`calc(16px * var(--font-scale))`, color:'var(--color-text1)',
}
const closeBtn = {
  fontSize:20, color:'var(--color-text2)', background:'none', border:'none', cursor:'pointer',
}
const emptyStyle = {
  textAlign:'center', color:'var(--color-text3)',
  fontSize:`calc(13px * var(--font-scale))`, padding:'24px 0',
}
const dayBlockStyle = { marginBottom: 12 }
const dayLabelStyle = {
  marginBottom: 4, fontSize:`calc(13px * var(--font-scale))`,
  borderBottom:'1px solid var(--color-border)', paddingBottom:3,
}
const itemRowStyle = {
  display:'grid',
  gridTemplateColumns:'76px 90px 1fr',
  gap: 6, alignItems: 'baseline',
  padding:'3px 0 3px 8px',
  fontSize:`calc(12px * var(--font-scale))`,
}
const catStyle = { color: 'var(--color-text2)', fontWeight: 600 }
const amtStyle = { color: '#F59E0B', fontWeight: 700 }
const textStyle = { color: 'var(--color-text1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }
const totalRowStyle = {
  marginTop: 8, padding:'10px 12px', borderRadius:10,
  background:'var(--color-bg)', border:'1.5px solid var(--color-border)',
  display:'flex', justifyContent:'space-between',
  fontSize:`calc(14px * var(--font-scale))`,
}
