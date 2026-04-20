// CalendarGrid.jsx — 요일 헤더 + 달력 셀 그리드 + 범례 바
// (연월 헤더·버튼은 App.jsx에서 관리)
import { useRef } from 'react'
import CalendarCell from './CalendarCell'
import WeeklyStats  from './WeeklyStats'

const DAY_LABELS = ['월','화','수','목','금','토','일']
const DAY_COLORS = ['var(--color-text1)','var(--color-text1)','var(--color-text1)','var(--color-text1)','var(--color-text1)','#3B82F6','#EF4444']
const STAT_W     = 52  // px

// 스와이프 감지 임계값
const SWIPE_THRESHOLD    = 50     // px — 최소 가로 이동 거리
const SWIPE_MAX_DURATION = 600    // ms — 너무 긴 드래그는 무시
const SWIPE_AXIS_RATIO   = 1.5    // 가로가 세로의 1.5배 이상이어야 가로 스와이프로 인식
const SWIPE_COOLDOWN     = 350    // ms — 연속 스와이프 차단 (여러 달 한 번에 넘어가는 것 방지)

export default function CalendarGrid({
  year, month, weeks,
  shiftMap, entries, holidays,
  getWeekStats, onCellTap,
  onSwipePrev, onSwipeNext,
  onWeekClick,
}) {
  const startRef    = useRef(null)
  const swipingRef  = useRef(false)
  const lastSwipeAt = useRef(0)

  const onTouchStart = (e) => {
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY, time: Date.now() }
    swipingRef.current = false
  }

  const onTouchMove = (e) => {
    if (!startRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - startRef.current.x
    const dy = t.clientY - startRef.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    // 가로 우세 또는 세로 우세 중 하나라도 감지되면 스와이프 진행 중
    if ((absDx > 20 && absDx > absDy * SWIPE_AXIS_RATIO) ||
        (absDy > 20 && absDy > absDx * SWIPE_AXIS_RATIO)) {
      swipingRef.current = true
    }
  }

  const onTouchEnd = (e) => {
    const s = startRef.current
    startRef.current = null
    if (!s) return
    const t  = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    const dt = Date.now() - s.time
    if (dt > SWIPE_MAX_DURATION) return

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    let triggered = false
    let isNext = false

    // 가로 스와이프: 좌(next) / 우(prev)
    if (absDx >= SWIPE_THRESHOLD && absDx >= absDy * SWIPE_AXIS_RATIO) {
      triggered = true
      isNext = dx < 0
    }
    // 세로 스와이프: 위(next) / 아래(prev)
    else if (absDy >= SWIPE_THRESHOLD && absDy >= absDx * SWIPE_AXIS_RATIO) {
      triggered = true
      isNext = dy < 0
    }

    if (!triggered) return
    // 연속 스와이프 차단
    const now = Date.now()
    if (now - lastSwipeAt.current < SWIPE_COOLDOWN) return
    lastSwipeAt.current = now
    // 셀 탭 방지
    e.preventDefault?.()
    e.stopPropagation?.()
    if (isNext) onSwipeNext?.()
    else onSwipePrev?.()
  }

  // 셀 클릭 중 스와이프 중이었다면 차단
  const onClickCapture = (e) => {
    if (swipingRef.current) {
      e.stopPropagation()
      e.preventDefault()
      swipingRef.current = false
    }
  }

  return (
    <div
      style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >

      {/* ── 요일 헤더 ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:`repeat(7,1fr) ${STAT_W}px`,
        background:'#F1F5F9',
        borderBottom:'1px solid var(--color-border)',
        flexShrink:0,
      }}>
        {DAY_LABELS.map((lbl,i) => (
          <div key={i} style={{
            textAlign:'center', padding:'5px 0',
            fontSize:`calc(12px * var(--font-scale))`,
            fontWeight:700, color:DAY_COLORS[i],
          }}>{lbl}</div>
        ))}
        <div style={{
          textAlign:'center', padding:'5px 0',
          fontSize:`calc(11px * var(--font-scale))`,
          fontWeight:700, color:'var(--color-primary)',
          borderLeft:'1px solid var(--color-border)',
        }}>통계</div>
      </div>

      {/* ── 주 행 × 5 ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {weeks.map((week, wi) => {
          const stats = getWeekStats(week)
          return (
            <div key={wi} style={{
              flex:1, display:'grid',
              gridTemplateColumns:`repeat(7,1fr) ${STAT_W}px`,
              borderBottom:'1px solid var(--color-border)',
              minHeight:0,
            }}>
              {week.map((cell, di) => {
                const key = `${cell.year}-${String(cell.month).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`
                return (
                  <div key={di} style={{
                    borderRight: di<6 ? '1px solid var(--color-border)' : 'none',
                    minHeight:0, overflow:'hidden',
                  }}>
                    <CalendarCell
                      {...cell}
                      shift={shiftMap[key]}
                      entry={entries[key] || {}}
                      holiday={holidays[key]}
                      onTap={onCellTap}
                    />
                  </div>
                )
              })}

              {/* 주간 통계 열 */}
              <div style={{
                borderLeft:'1px solid var(--color-border)',
                background:'var(--color-surface)',
                minHeight:0,
                overflow:'hidden',
              }}>
                <WeeklyStats
                  weekNum={wi+1}
                  byCat={stats.byCat}
                  expTotal={stats.expTotal}
                  onClick={stats.expTotal > 0 ? () => onWeekClick?.(wi+1, week) : undefined}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 범례 바 ── */}
      <Legend />
    </div>
  )
}

function Legend() {
  const dots   = [{ color:'#6366F1', label:'일정' },{ color:'#10B981', label:'운동' },{ color:'#F59E0B', label:'지출' }]
  const shifts = ['주','야','비','휴']
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'5px 10px',
      background:'var(--color-surface)',
      borderTop:'1px solid var(--color-border)',
      flexShrink:0,
    }}>
      <div style={{ display:'flex', gap:12 }}>
        {dots.map(({ color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />
            <span style={{ fontSize:`calc(10px * var(--font-scale))`, color:'var(--color-text2)' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {shifts.map(s => (
          <div key={s} className={`shift-badge ${s}`} style={{ width:18, height:18, fontSize:8 }}>{s}</div>
        ))}
      </div>
    </div>
  )
}
