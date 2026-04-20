const CAT_SHORT = {
  '주거/통신': '주/통',
  '금융':     '금융',
  '문화생활': '문화',
  '외식':     '외식',
  '식재료':   '식재',
  '생활용품': '생활',
  '교통/차량':'교통',
  '기타':     '기타',
}

export default function WeeklyStats({ weekNum, byCat = {}, expTotal = 0, onClick }) {
  const categories = Object.entries(byCat)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <div
      onClick={onClick}
      style={{
        height: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}>

      {/* 주차 라벨 — CalendarCell 날짜줄과 동일 높이/정렬 (22px flex center) */}
      <div style={{
        height: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: `calc(13px * var(--font-scale))`,
          color: 'var(--color-text2)',
          lineHeight: 1,
        }}>
          {weekNum}주
        </span>
      </div>

      {/* 카테고리별 합계 + 총계 */}
      <div style={{
        flex: 1, minHeight: 0,
        padding: '3px 2px 2px',
        display: 'flex', flexDirection: 'column', gap: 1,
        overflow: 'hidden',
      }}>
        {categories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--color-text3)',
            fontSize: `calc(10px * var(--font-scale))`,
            paddingTop: 4,
          }}>—</div>
        ) : (
          <>
            {categories.map(([cat, amt]) => (
              <div key={cat} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                gap: 2, lineHeight: 1.1,
              }}>
                <span style={{
                  color: 'var(--color-text2)',
                  fontSize: `calc(8.5px * var(--font-scale))`,
                  flexShrink: 0,
                }}>
                  {CAT_SHORT[cat] || cat}
                </span>
                <span style={{
                  color: '#F59E0B', fontWeight: 700,
                  fontSize: `calc(9px * var(--font-scale))`,
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {shortAmount(amt)}
                </span>
              </div>
            ))}
            <div style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 2, textAlign: 'center',
              color: '#F59E0B', fontWeight: 800,
              fontSize: `calc(10.5px * var(--font-scale))`,
              lineHeight: 1.1,
            }}>
              {shortAmount(expTotal)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function shortAmount(num) {
  if (!num) return ''
  if (num >= 10000) {
    const man = num / 10000
    return man >= 10 ? `${Math.floor(man)}만` : `${Math.round(man * 10) / 10}만`
  }
  if (num >= 1000) return `${Math.round(num/100)/10}천`
  return `${num}원`
}
