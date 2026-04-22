import ShiftBadge from './ShiftBadge'
import {
  isToday, getDow, formatAmount, formatMinutes,
  normalizeScheduleItems, normalizeExpenseItems, sumExpenseItems,
} from '../../utils/dateUtils'

const DOW_COLOR = ['#EF4444','#1A1D23','#1A1D23','#1A1D23','#1A1D23','#1A1D23','#3B82F6']

export default function CalendarCell({ year, month, day, isCurrentMonth, shift, entry={}, holiday, onTap }) {
  const today     = isToday(year, month, day)
  const dow       = getDow(year, month, day)
  const isHoliday = !!holiday

  const numColor = !isCurrentMonth
    ? 'var(--color-text3)'
    : today
    ? 'var(--color-primary)'
    : isHoliday
    ? '#FF3B30'
    : DOW_COLOR[dow]

  const scheduleItems = normalizeScheduleItems(entry)
  const expenseItems  = normalizeExpenseItems(entry)
  const expenseTotal  = sumExpenseItems(expenseItems) || entry.expense || 0

  // 각 InfoBlock 에 들어갈 items ([{head, body}])
  const scheduleBlocks = scheduleItems
    .filter(it => it.time || it.text)
    .map(it => ({ head: it.time || '', body: it.text || '' }))

  const exerciseBlocks = (entry.exercise || entry.exercise_min)
    ? [{
        head: entry.exercise_min ? formatMinutes(entry.exercise_min) : '',
        body: entry.exercise || '',
      }]
    : []

  const expenseBlocks = expenseTotal > 0
    ? [{ head: formatAmount(expenseTotal), body: '' }]
    : []

  const holidayBlocks = (isHoliday && isCurrentMonth)
    ? [{ head: holiday, body: '' }]
    : []

  return (
    <div
      onClick={() => isCurrentMonth && onTap?.({ year, month, day })}
      style={{
        position:   'relative',
        background: today ? 'rgba(59,130,246,0.18)' : 'var(--cal-cell-bg)',
        cursor:     isCurrentMonth ? 'pointer' : 'default',
        display:    'flex',
        flexDirection: 'column',
        outline:    today ? '2px solid var(--color-primary)' : 'none',
        outlineOffset: '-1px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── 날짜 숫자 줄 (flex 컨테이너: 날짜+뱃지 수직 중앙 정렬) ── */}
      <div style={{
        height: 22,
        padding: '0 2px 0 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontWeight:  today ? 900 : 500,
          fontSize:    `calc(13px * var(--font-scale))`,
          color:       numColor,
          lineHeight:  1,
        }}>
          {day}
        </span>
        {shift && isCurrentMonth && (
          <div style={{ opacity: 0.7, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            <ShiftBadge type={shift} size={16} fontSize={9} />
          </div>
        )}
      </div>

      {/* ── 정보 영역 — 날짜 아래로 내림 ── */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column', gap: 2,
        padding: '3px 2px 2px',
        overflow: 'hidden',
      }}>
        <InfoBlock color="#FF3B30" items={holidayBlocks}  bold singleLine fontSize={8} />
        <InfoBlock color="#6366F1" items={scheduleBlocks} />
        <InfoBlock color="#10B981" items={exerciseBlocks} />
        <InfoBlock color="#F59E0B" items={expenseBlocks}  bold />
      </div>
    </div>
  )
}

// items: [{head, body}]
// 항목 하나당 원형 1개. head + body 있으면 2줄 (body 는 셀 왼쪽 3px 에 정렬), 하나만 있으면 1줄
// singleLine: 강제 1줄 (공휴일용), 폭 넘치면 ellipsis
function InfoBlock({ color, items, bold, singleLine, fontSize = 10 }) {
  const visible = items.filter(it => it.head || it.body)
  if (visible.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {visible.map((it, i) => (
        <ItemRow key={i}
          head={it.head} body={it.body}
          color={color} bold={bold}
          singleLine={singleLine} fontSize={fontSize}
        />
      ))}
    </div>
  )
}

function ItemRow({ head, body, color, bold, singleLine, fontSize }) {
  const has2 = head && body && !singleLine
  const line = {
    fontSize:     `calc(${fontSize}px * var(--font-scale))`,
    color,
    fontWeight:   bold ? 700 : 400,
    lineHeight:   1.2,
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
        marginTop: 3,
        background: color,
      }} />
      <div style={{
        flex: 1, minWidth: 0, overflow: 'visible',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        {has2 ? (
          <>
            <div style={line}>{head}</div>
            {/* info-area.paddingLeft(2) + dot(5) + gap(2) = 9px → -6px 당겨 3px */}
            <div style={{ ...line, marginLeft: -6 }}>{body}</div>
          </>
        ) : (
          <div style={line}>{head || body}</div>
        )}
      </div>
    </div>
  )
}
