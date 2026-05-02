// Google Sheets 동기화 — 기존 JSON 백업과 독립적으로 동작
//
// 흐름:
//  1) ensureSheet(token) — 시트 ID 가 없으면 새로 만들고 localStorage 에 저장
//  2) syncSheet(token)   — 시트 전체 클리어 → 헤더 + 현재 데이터 일괄 업로드
//
// 실패해도 JSON 백업/복원 신뢰성에 영향 없도록 호출처에서 try/catch 로 격리.

import { store } from './localStore'
import { HEADER, SHEET_TAB, buildSheetRows } from './sheetSchema'

const SHEETS_API   = 'https://sheets.googleapis.com/v4/spreadsheets'
const SHEET_TITLE  = 'DAILY댕 백업'

const KEY_ENABLED   = 'sheetBackup.enabled'
const KEY_FILE_ID   = 'sheetBackup.fileId'
const KEY_LAST_AT   = 'sheetBackup.lastSyncAt'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function isSheetSyncEnabled() {
  return store.read(KEY_ENABLED, false) === true
}

export function setSheetSyncEnabled(v) {
  store.write(KEY_ENABLED, !!v)
}

export function getSheetFileId() {
  return store.read(KEY_FILE_ID, null)
}

function setSheetFileId(id) {
  if (id) store.write(KEY_FILE_ID, id)
  else    store.remove(KEY_FILE_ID)
}

export function getLastSyncAt() {
  return store.read(KEY_LAST_AT, null)
}

function setLastSyncAt(iso) {
  store.write(KEY_LAST_AT, iso)
}

export function getSheetUrl() {
  const id = getSheetFileId()
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null
}

// ── 새 스프레드시트 생성 (탭 이름 'data', 컬럼 너비는 기본) ──
async function createSheet(token) {
  const body = {
    properties: { title: SHEET_TITLE, locale: 'ko_KR' },
    sheets: [{ properties: { title: SHEET_TAB, gridProperties: { rowCount: 1000, columnCount: HEADER.length } } }],
  }
  const r = await fetch(SHEETS_API, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`시트 생성 실패 (${r.status})`)
  const j = await r.json()
  if (!j.spreadsheetId) throw new Error('시트 생성 응답에 ID 없음')
  return j.spreadsheetId
}

// 시트 ID 가 없으면 새로 만든다.
// 휴지통/삭제 케이스는 검증하지 않음 — drive.appdata+spreadsheets scope 로는 일반
// Drive 파일에 GET 권한이 없어 검증이 항상 실패(404)했고, 그 결과 매 백업마다
// 새 시트가 생성되는 버그가 있었음. 시트 무효화 시엔 clearSheet/writeAllValues
// 가 자연스럽게 실패하므로, 사용자가 "시트 재생성" 버튼으로 복구하면 된다.
export async function ensureSheet(token) {
  let id = getSheetFileId()
  if (!id) {
    id = await createSheet(token)
    setSheetFileId(id)
  }
  return id
}

// 시트 전체 클리어
async function clearSheet(token, id) {
  const range = encodeURIComponent(`${SHEET_TAB}!A:Z`)
  const r = await fetch(`${SHEETS_API}/${id}/values/${range}:clear`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!r.ok) throw new Error(`시트 비우기 실패 (${r.status})`)
}

// 헤더 + 데이터 일괄 업로드 (RAW: 문자열 그대로, 숫자는 숫자)
async function writeAllValues(token, id, rows) {
  const range = encodeURIComponent(`${SHEET_TAB}!A1`)
  const body  = { values: [HEADER, ...rows] }
  const r = await fetch(
    `${SHEETS_API}/${id}/values/${range}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!r.ok) throw new Error(`시트 쓰기 실패 (${r.status})`)
}

// 외부 진입점: 동기화 1회 (ensure → clear → write)
export async function syncSheet(token) {
  const id   = await ensureSheet(token)
  const rows = buildSheetRows()
  await clearSheet(token, id)
  await writeAllValues(token, id, rows)
  const at = new Date().toISOString()
  setLastSyncAt(at)
  return { fileId: id, rowCount: rows.length, at }
}

// 시트 재생성: 기존 ID 폐기 후 새로 생성하고 한 번 동기화
// (Drive 측 파일은 사용자가 수동으로 휴지통에 넣을 수 있도록 그대로 둠)
export async function recreateSheet(token) {
  setSheetFileId(null)
  return await syncSheet(token)
}
