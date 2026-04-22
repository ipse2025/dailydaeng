import { formatAmount, normalizeExpenseItems } from '../../utils/dateUtils'
import { CloseIcon } from '../icons/AppIcons'

export default function MonthlyExpensesModal({ year, month, entries, onClose }) {
  // 월별 카테고리별 집계
  const byCat = {}
  let total = 0
  Object.values(entries).forEach(e => {
    if (!e.date_key?.startsWith(`${year}-${String(month).padStart(2,'0')}`)) return
    const items = normalizeExpenseItems(e)
    items.forEach(it => {
      const amt = parseInt(it.amount, 10) || 0
      if (!amt) return
      byCat[it.category] = (byCat[it.category] || 0) + amt
      total += amt
    })
  })

  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1])

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="animate-slide-up" onClick={e => e.stopPropagation()} style={wrapStyle}>
        <div style={handleWrap}><div style={handle} /></div>

        <div style={headerStyle}>
          <span style={titleStyle}>💵 {month}월 지출 통계</span>
          <button onClick={onClose} style={{ ...closeBtn, display:'inline-flex', padding:0 }} aria-label="닫기"><CloseIcon size={20} color="var(--color-text2)" /></button>
        </div>

        <div style={{ padding:'14px 18px 18px', maxHeight:'60vh', overflowY:'auto' }}>
          {sorted.length === 0 ? (
            <div style={emptyStyle}>이번 달 지출 내역이 없습니다.</div>
          ) : (
            <>
              {sorted.map(([cat, amt]) => {
                const pct = total > 0 ? (amt / total) * 100 : 0
                const pctLabel = pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)
                return (
                  <div key={cat} style={itemRow}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:2, gap:8 }}>
                      <span style={{ fontWeight:700, color:'var(--color-text1)', fontSize:`calc(14px * var(--font-scale))` }}>{cat}</span>
                      <span style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <span style={{ fontWeight:600, color:'var(--color-text2)', fontSize:`calc(11px * var(--font-scale))` }}>{pctLabel}%</span>
                        <span style={{ fontWeight:700, color:'#F59E0B', fontSize:`calc(14px * var(--font-scale))` }}>{formatAmount(amt)}</span>
                      </span>
                    </div>
                    <div style={barTrack}>
                      <div style={{ ...barFill, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}

              <div style={totalRow}>
                <span style={{ fontWeight:900, color:'var(--color-text1)' }}>총 지출</span>
                <span style={{ fontWeight:900, color:'#F59E0B' }}>{formatAmount(total)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const wrapStyle = {
  width:'100%', background:'var(--color-surface)',
  borderRadius:'20px 20px 0 0',
  padding:'0 0 env(safe-area-inset-bottom)',
  boxShadow:'0 -4px 20px rgba(0,0,0,0.12)',
  maxHeight:'90vh', overflowY:'auto',
}
const handleWrap = { display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:4 }
const handle = { width:36, height:4, borderRadius:2, background:'var(--color-border)' }
const headerStyle = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'8px 18px 10px', borderBottom:'1px solid var(--color-border)',
}
const titleStyle = { fontWeight:900, fontSize:`calc(16px * var(--font-scale))`, color:'var(--color-text1)' }
const closeBtn   = { fontSize:20, color:'var(--color-text2)', background:'none', border:'none', cursor:'pointer' }
const emptyStyle = {
  textAlign:'center', color:'var(--color-text3)',
  fontSize:`calc(13px * var(--font-scale))`, padding:'24px 0',
}
const itemRow    = { marginBottom: 10 }
const barTrack   = { width:'100%', height:6, borderRadius:3, background:'var(--color-bg)', overflow:'hidden' }
const barFill    = { height:'100%', background:'#F59E0B', borderRadius:3, transition:'width 0.3s' }
const totalRow   = {
  marginTop: 14, padding:'12px 14px', borderRadius:12,
  background:'var(--color-bg)', border:'1.5px solid var(--color-border)',
  display:'flex', justifyContent:'space-between',
  fontSize:`calc(16px * var(--font-scale))`,
}
