import dayjs from 'dayjs'
import 'dayjs/locale/ko'
dayjs.locale('ko')

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 해당 월의 달력 그리드 생성 (6주 고정 or 5주)
export function buildCalendarGrid(year, month) {
  const firstDay = dayjs(`${year}-${String(month).padStart(2,'0')}-01`)
  const startDow = firstDay.day()
  const daysInMonth = firstDay.daysInMonth()
  const prevMonth = firstDay.subtract(1, 'month')
  const nextMonth = firstDay.add(1, 'month')

  const cells = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonth.daysInMonth() - i
    cells.push({ year: prevMonth.year(), month: prevMonth.month()+1, day: d, isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, isCurrentMonth: true })
  }
  const total = cells.length <= 35 ? 35 : 42
  let nd = 1
  while (cells.length < total) {
    cells.push({ year: nextMonth.year(), month: nextMonth.month()+1, day: nd++, isCurrentMonth: false })
  }
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i+7))
  }
  return weeks
}

export function toDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

export function isToday(year, month, day) {
  const t = dayjs()
  return t.year() === year && t.month()+1 === month && t.date() === day
}

export function isSunday(dow) { return dow === 0 }
export function isSaturday(dow) { return dow === 6 }

export function getDow(year, month, day) {
  return dayjs(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`).day()
}

// ── 휠 피커 옵션 ────────────────────────────────────────
export const HOUR_OPTIONS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2,'0'))
export const MINUTE_OPTIONS = ['00','10','20','30','40','50']

// 운동 소요시간 (10분 단위, 0 ~ 180분)
export const EXERCISE_MIN_OPTIONS = Array.from({ length: 19 }, (_, i) => i * 10)  // 0, 10, ..., 180

// 지출 카테고리
export const EXPENSE_CATEGORIES = [
  '주거/통신',
  '금융',
  '문화생활',
  '외식',
  '식재료',
  '생활용품',
  '교통/차량',
]

// ── 포맷 헬퍼 ──────────────────────────────────────────
export function formatAmount(num) {
  if (!num || num === 0) return ''
  if (num >= 10000) {
    const man = Math.floor(num / 10000)
    const rest = num % 10000
    return rest > 0 ? `${man}만 ${rest.toLocaleString()}원` : `${man}만원`
  }
  return `${num.toLocaleString()}원`
}

export function formatMinutes(min) {
  if (!min || min === 0) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return `${h}시간 ${m}분`
  if (h > 0) return `${h}시간`
  return `${m}분`
}

// ── 다중 항목 정규화 (legacy text 필드 ↔ items 배열) ──────
// schedule_items: [{ time: "14:30", text: "치과" }, ...]
export function normalizeScheduleItems(entry = {}) {
  if (Array.isArray(entry.schedule_items) && entry.schedule_items.length > 0) {
    return entry.schedule_items
  }
  // legacy: schedule TEXT
  const s = (entry.schedule || '').trim()
  if (!s) return []
  const m = s.match(/^(\d{1,2}:\d{2})\s+(.+)$/)
  if (m) {
    const t = m[1].length === 4 ? `0${m[1]}` : m[1]
    return [{ time: t, text: m[2] }]
  }
  return [{ time: '', text: s }]
}

// expense_items: [{ category: "주거/통신", amount: 750000, text: "다이소" }, ...]
export function normalizeExpenseItems(entry = {}) {
  if (Array.isArray(entry.expense_items) && entry.expense_items.length > 0) {
    return entry.expense_items.map(it => ({
      category: it.category || '기타',
      amount:   parseInt(it.amount, 10) || 0,
      text:     it.text || '',
    }))
  }
  // legacy: expense INTEGER
  if (entry.expense && entry.expense > 0) {
    return [{ category: '기타', amount: entry.expense, text: '' }]
  }
  return []
}

export function sumExpenseItems(items = []) {
  return items.reduce((s, it) => s + (parseInt(it.amount, 10) || 0), 0)
}

export function formatScheduleItem({ time, text }) {
  if (time && text) return `${time} ${text}`
  return text || time || ''
}

export function formatExpenseItem({ category, amount }) {
  return `${category} ${formatAmount(amount)}`
}
