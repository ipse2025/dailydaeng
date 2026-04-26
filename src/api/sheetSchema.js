// Daily댕 → Google Sheet 행 변환
// 컬럼: 날짜 | 시간 | 일정 | 운동시간(분) | 운동 메모 | 지출 종류 | 지출 내역 | 소비금액
// 한 entry 가 여러 행으로 펼쳐짐 (항목 1개 = 행 1개, sparse 방식)
//
// 외부 에이전트 입장에서는 "오늘 날짜 행 전부 → 비어있지 않은 컬럼만 골라 메시지 조립" 으로 끝남.

import { store } from './localStore'

export const SHEET_TAB = 'data'
export const HEADER = [
  '날짜', '시간', '일정', '운동시간(분)', '운동 메모', '지출 종류', '지출 내역', '소비금액',
]

function safeArr(x)   { return Array.isArray(x) ? x : [] }
function safeStr(x)   { return typeof x === 'string' ? x : (x == null ? '' : String(x)) }
function safeNum(x)   { const n = Number(x); return Number.isFinite(n) ? n : '' }

export function buildSheetRows() {
  const entries = store.read('entries', {})
  const rows = []

  Object.values(entries || {}).forEach(e => {
    const dateKey = safeStr(e?.date_key)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return

    // 일정 (시간 오름차순, 시간 없는 항목은 맨 뒤)
    const schedules = safeArr(e.schedule_items)
      .map(s => ({ time: safeStr(s?.time), text: safeStr(s?.text) }))
      .filter(s => s.time || s.text)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

    schedules.forEach(s => {
      rows.push([dateKey, s.time, s.text, '', '', '', '', ''])
    })

    // 운동 (분 또는 메모 중 하나라도 있으면 1행)
    const exMin  = safeNum(e.exercise_min)
    const exMemo = safeStr(e.exercise)
    if (exMin !== '' || exMemo) {
      rows.push([dateKey, '', '', exMin, exMemo, '', '', ''])
    }

    // 지출
    safeArr(e.expense_items).forEach(x => {
      const cat = safeStr(x?.category)
      const txt = safeStr(x?.text)
      const amt = safeNum(x?.amount)
      if (!cat && !txt && amt === '') return
      rows.push([dateKey, '', '', '', '', cat, txt, amt])
    })
  })

  rows.sort((a, b) => safeStr(a[0]).localeCompare(safeStr(b[0])))
  return rows
}
