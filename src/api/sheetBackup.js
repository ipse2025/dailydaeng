// Google Sheet 기반 백업/복원 (양방향)
//
// - 시트는 사용자의 기존 "Daily댕 백업" 시트 한 개에 고정 (SPREADSHEET_ID 상수)
// - 탭은 메타 조회로 첫 번째 탭 title 을 동적으로 사용 (시트1/data/Sheet1 등 표기 차이 흡수)
// - 내보내기: 첫 탭 전체 클리어 → HEADER + 현재 entries 일괄 PUT (시트가 source of truth)
// - 가져오기: 첫 탭 전체 GET → parseSheetRows → entries 통째 교체
//
// 시트가 삭제/이동되면 API 가 404 로 명확히 실패한다. 옛 버그처럼 조용히 새 시트를
// 만들지 않는다.

import { store } from './localStore'
import { HEADER, buildSheetRows, parseSheetRows } from './sheetSchema'

const SPREADSHEET_ID = '1iELkisjjZMHBWeAcdCdRCoYWDTcMIAM0IuVvZwHAgLg'
const SHEETS_API     = 'https://sheets.googleapis.com/v4/spreadsheets'

const KEY_LAST_AT = 'sheetBackup.lastSyncAt'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function getSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`
}

export function getLastSyncAt() {
  return store.read(KEY_LAST_AT, null)
}

async function getFirstTabTitle(token) {
  const r = await fetch(
    `${SHEETS_API}/${SPREADSHEET_ID}?fields=sheets.properties(title,index)`,
    { headers: authHeaders(token) }
  )
  if (!r.ok) throw new Error(`시트 메타 조회 실패 (${r.status})`)
  const j = await r.json()
  const tabs = Array.isArray(j.sheets) ? j.sheets : []
  if (!tabs.length) throw new Error('시트에 탭이 없습니다.')
  const first = tabs
    .slice()
    .sort((a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0))[0]
  const title = first?.properties?.title
  if (!title) throw new Error('탭 이름을 확인할 수 없습니다.')
  return title
}

// A1 표기에서 탭 이름에 특수문자(공백/한글 등)가 들어가면 작은따옴표로 감싸야 안전
function quoteTab(title) {
  return `'${title.replace(/'/g, "''")}'`
}

export async function exportToSheet(token) {
  const tab     = await getFirstTabTitle(token)
  const quoted  = quoteTab(tab)
  const rows    = buildSheetRows()

  const clearRange = encodeURIComponent(`${quoted}!A:Z`)
  const r1 = await fetch(
    `${SHEETS_API}/${SPREADSHEET_ID}/values/${clearRange}:clear`,
    {
      method:  'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body:    '{}',
    }
  )
  if (!r1.ok) throw new Error(`시트 비우기 실패 (${r1.status})`)

  const writeRange = encodeURIComponent(`${quoted}!A1`)
  const body       = { values: [HEADER, ...rows] }
  const r2 = await fetch(
    `${SHEETS_API}/${SPREADSHEET_ID}/values/${writeRange}?valueInputOption=RAW`,
    {
      method:  'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }
  )
  if (!r2.ok) throw new Error(`시트 쓰기 실패 (${r2.status})`)

  const at = new Date().toISOString()
  store.write(KEY_LAST_AT, at)
  return { rowCount: rows.length, at, tab }
}

// 시트에서 읽어와 entries 맵 형태로 반환. 적용은 applySheetEntries() 가 별도 수행.
export async function fetchSheetEntries(token) {
  const tab    = await getFirstTabTitle(token)
  const quoted = quoteTab(tab)
  const range  = encodeURIComponent(`${quoted}!A:H`)

  const r = await fetch(
    `${SHEETS_API}/${SPREADSHEET_ID}/values/${range}`,
    { headers: authHeaders(token) }
  )
  if (!r.ok) throw new Error(`시트 읽기 실패 (${r.status})`)
  const j      = await r.json()
  const values = Array.isArray(j.values) ? j.values : []
  const map    = parseSheetRows(values)
  return { map, tab, rowCount: values.length }
}

// 가져오기 확정 — entries 를 통째 교체.
export function applySheetEntries(map) {
  if (!map || typeof map !== 'object') {
    throw new Error('잘못된 데이터 형식입니다.')
  }
  store.write('entries', map)
  return { entries: Object.keys(map).length }
}
