// DAILY댕 ↔ Google Sheet 변환 (양방향)
// 한 entry 가 항목별로 여러 행으로 펼쳐지는 sparse 방식.
// 컬럼(8): 날짜 | 시간 | 일정 | 운동시간 | 운동메모 | 지출종류 | 지출내역 | 소비금액

import { store } from './localStore'

export const HEADER = [
  '날짜', '시간', '일정', '운동시간', '운동메모', '지출종류', '지출내역', '소비금액',
]

function safeArr(x) { return Array.isArray(x) ? x : [] }
function safeStr(x) { return typeof x === 'string' ? x : (x == null ? '' : String(x)) }
function safeNum(x) { const n = Number(x); return Number.isFinite(n) ? n : '' }
function numOrEmpty(x) {
  if (x === '' || x == null) return ''
  const n = Number(x)
  return Number.isFinite(n) ? n : ''
}

// ── entries → 시트 행 배열 ─────────────────────────────────
export function buildSheetRows() {
  const entries = store.read('entries', {})
  const rows = []

  Object.values(entries || {}).forEach(e => {
    const dateKey = safeStr(e?.date_key)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return

    const schedules = safeArr(e.schedule_items)
      .map(s => ({ time: safeStr(s?.time), text: safeStr(s?.text) }))
      .filter(s => s.time || s.text)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

    schedules.forEach(s => {
      rows.push([dateKey, s.time, s.text, '', '', '', '', ''])
    })

    const exMin  = safeNum(e.exercise_min)
    const exMemo = safeStr(e.exercise)
    if (exMin !== '' && exMin !== 0 || exMemo) {
      rows.push([dateKey, '', '', exMin === '' ? 0 : exMin, exMemo, '', '', ''])
    }

    safeArr(e.expense_items).forEach(x => {
      const cat = safeStr(x?.category)
      const txt = safeStr(x?.text)
      const amt = safeNum(x?.amount)
      if (!cat && !txt && (amt === '' || amt === 0)) return
      rows.push([dateKey, '', '', '', '', cat, txt, amt === '' ? 0 : amt])
    })
  })

  rows.sort((a, b) => {
    const d = safeStr(a[0]).localeCompare(safeStr(b[0]))
    if (d !== 0) return d
    return safeStr(a[1]).localeCompare(safeStr(b[1]))
  })
  return rows
}

// ── 시트 행 배열 → entries 맵 ──────────────────────────────
// 첫 행이 날짜 포맷(YYYY-MM-DD)이 아니면 헤더로 간주하고 건너뜀.
export function parseSheetRows(values) {
  if (!Array.isArray(values) || values.length === 0) return {}

  let start = 0
  const first = values[0] || []
  const first0 = safeStr(first[0]).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(first0)) start = 1

  const map = {}
  for (let i = start; i < values.length; i++) {
    const row = values[i] || []
    const dateKey = safeStr(row[0]).trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue

    if (!map[dateKey]) {
      map[dateKey] = {
        date_key:       dateKey,
        schedule:       '',
        schedule_items: [],
        exercise:       '',
        exercise_min:   0,
        expense:        0,
        expense_items:  [],
      }
    }
    const e = map[dateKey]

    const time   = safeStr(row[1]).trim()
    const sched  = safeStr(row[2]).trim()
    const exMin  = numOrEmpty(row[3])
    const exMemo = safeStr(row[4]).trim()
    const exCat  = safeStr(row[5]).trim()
    const exTxt  = safeStr(row[6]).trim()
    const exAmt  = numOrEmpty(row[7])

    if (time || sched) {
      e.schedule_items.push({ time, text: sched })
    }
    if (exMin !== '' && exMin !== 0) e.exercise_min = exMin
    if (exMemo) e.exercise = exMemo

    if (exCat || exTxt || (exAmt !== '' && exAmt !== 0)) {
      e.expense_items.push({
        category: exCat || '기타',
        text:     exTxt,
        amount:   exAmt === '' ? 0 : exAmt,
      })
    }
  }

  // 레거시 단일 필드(schedule/expense) 동기화 — EntryModal onSave 와 동일 규칙
  Object.values(map).forEach(e => {
    const first = e.schedule_items[0]
    e.schedule = first ? (first.time ? `${first.time} ${first.text}` : first.text) : ''
    e.expense  = e.expense_items.reduce((s, x) => s + (Number(x.amount) || 0), 0)
  })

  return map
}
