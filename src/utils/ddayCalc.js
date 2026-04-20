import dayjs from 'dayjs'
import solarlunar from 'solarlunar'

// 음력 (year,month,day) → 양력 dayjs
function lunarToSolar(year, month, day) {
  try {
    const s = solarlunar.lunar2solar(year, month, day)
    if (!s || !s.cYear) return null
    return dayjs(`${s.cYear}-${String(s.cMonth).padStart(2,'0')}-${String(s.cDay).padStart(2,'0')}`)
  } catch { return null }
}

// D-day 남은 일수 계산. 대상일과 오늘 자정 기준 날짜 차 (단위: 일).
// 양수: 미래 (앞으로 남음), 0: 오늘, 음수: 과거 (지남)
export function calcDDay({ calendar, year, month, day }) {
  let target
  if (calendar === 'lunar') {
    target = lunarToSolar(year, month, day)
  } else {
    target = dayjs(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`)
  }
  if (!target || !target.isValid()) return null
  const today = dayjs().startOf('day')
  return target.startOf('day').diff(today, 'day')
}

// "D-12" / "D-DAY" / "D+30" 포맷
export function formatDDay(days) {
  if (days === null || days === undefined) return '—'
  if (days === 0) return 'D-DAY'
  if (days > 0)  return `D-${days}`
  return `D+${Math.abs(days)}`
}

// 드로어에 표시할 양/음력 라벨
export function calendarLabel(cal) {
  return cal === 'lunar' ? '음' : '양'
}

// 음력 값 → 양력 { month, day } (실패 시 null)
export function lunarToSolarMD(year, month, day) {
  const s = lunarToSolar(year, month, day)
  if (!s) return null
  return { month: s.month() + 1, day: s.date() }
}
