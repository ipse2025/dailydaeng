import dayjs from 'dayjs'
import { toDateKey, getDow } from './dateUtils'

// 교대 근무 패턴 자동 계산
// pattern: "주야비비휴휴" 같은 문자열
// startDate: "2026-03-01"
// targetYear, targetMonth: 계산할 달
export function calcShiftPattern(pattern, startDate, targetYear, targetMonth) {
  if (!pattern || !startDate) return {}
  const patArr = pattern.replace(/\s/g,'').split('')
  const patLen = patArr.length
  const start = dayjs(startDate)
  const firstOfMonth = dayjs(`${targetYear}-${String(targetMonth).padStart(2,'0')}-01`)
  const daysInMonth = firstOfMonth.daysInMonth()

  const result = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const date = firstOfMonth.date(d)
    const diff = date.diff(start, 'day')
    if (diff < 0) continue
    const idx = ((diff % patLen) + patLen) % patLen
    const key = toDateKey(targetYear, targetMonth, d)
    result[key] = patArr[idx]
  }
  return result
}

// 일근 근무 자동 계산 (평일=주, 토일+공휴일=휴)
export function calcDayShift(targetYear, targetMonth, holidays = []) {
  const firstOfMonth = dayjs(`${targetYear}-${String(targetMonth).padStart(2,'0')}-01`)
  const daysInMonth = firstOfMonth.daysInMonth()
  const holidayKeys = new Set(holidays.map(h => h.dateKey))
  const result = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(targetYear, targetMonth, d)
    const dow = getDow(targetYear, targetMonth, d)
    if (dow === 0 || dow === 6 || holidayKeys.has(key)) {
      result[key] = '휴'
    } else {
      result[key] = '주'
    }
  }
  return result
}

// 근무 유형 색상 맵
export const SHIFT_COLORS = {
  '주': { fill: 'var(--badge-day-fill)',   text: 'var(--badge-day-text)',   outline: 'var(--badge-day-outline)',   outlineW: 'var(--badge-day-outline-w)' },
  '야': { fill: 'var(--badge-night-fill)', text: 'var(--badge-night-text)', outline: 'var(--badge-night-outline)', outlineW: 'var(--badge-night-outline-w)' },
  '비': { fill: 'var(--badge-off-fill)',   text: 'var(--badge-off-text)',   outline: 'var(--badge-off-outline)',   outlineW: 'var(--badge-off-outline-w)' },
  '휴': { fill: 'var(--badge-rest-fill)',  text: 'var(--badge-rest-text)',  outline: 'var(--badge-rest-outline)',  outlineW: 'var(--badge-rest-outline-w)' },
}
