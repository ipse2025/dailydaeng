// 백업 페이로드 스키마 정의 + 마이그레이션 유틸
//
// 설계 원칙:
// - entries / ddays 는 명시적 배열로 직렬화 (localStorage 키 이름 변경에도 안전)
// - 알려진 legacy 필드는 표준 필드로 자동 변환 (schedule → schedule_items 등)
// - 모르는 필드까지 모두 보존 (미래의 새 필드를 잃지 않음)
// - 그 외 키들은 raw 맵으로 별도 보존
// - v1(과거 raw dump) 백업도 그대로 복원 가능

import { store } from './localStore'

export const BACKUP_VERSION   = 2
export const SCHEMA_ENTRIES   = 1
export const SCHEMA_DDAYS     = 1

const KEY_ENTRIES = store.PREFIX + 'entries'   // dailydaeng.entries
const KEY_DDAYS   = store.PREFIX + 'ddays'     // dailydaeng.ddays

// ── entry 정규화 ──────────────────────────────────────────
// 알려지지 않은 필드까지 보존하면서, legacy 필드를 표준 필드로 마이그레이션
function sanitizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.date_key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date_key)) {
    return null
  }
  const out = { ...raw }

  // legacy schedule(TEXT) → schedule_items(array)
  if (!Array.isArray(out.schedule_items) && typeof out.schedule === 'string' && out.schedule.trim()) {
    const s = out.schedule.trim()
    const m = s.match(/^(\d{1,2}:\d{2})\s+(.+)$/)
    if (m) {
      const t = m[1].length === 4 ? `0${m[1]}` : m[1]
      out.schedule_items = [{ time: t, text: m[2] }]
    } else {
      out.schedule_items = [{ time: '', text: s }]
    }
    delete out.schedule
  }

  // legacy expense(INTEGER) → expense_items(array)
  if (!Array.isArray(out.expense_items) && typeof out.expense === 'number' && out.expense > 0) {
    out.expense_items = [{ category: '기타', amount: out.expense, text: '' }]
    delete out.expense
  }

  // 정합성: 배열 필드가 잘못된 타입이면 비움
  if ('schedule_items' in out && !Array.isArray(out.schedule_items)) out.schedule_items = []
  if ('expense_items'  in out && !Array.isArray(out.expense_items))  out.expense_items  = []

  return out
}

// ── dday 정규화 ──────────────────────────────────────────
function sanitizeDDay(raw) {
  if (!raw || typeof raw !== 'object') return null
  const year  = parseInt(raw.year, 10)
  const month = parseInt(raw.month, 10)
  const day   = parseInt(raw.day, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const id = (typeof raw.id === 'string' && raw.id) ? raw.id : newDDayId()
  return {
    id,
    calendar:  raw.calendar === 'lunar' ? 'lunar' : 'solar',
    year, month, day,
    label:     typeof raw.label === 'string' ? raw.label : '',
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  }
}

function newDDayId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `dd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ── 백업 페이로드 생성 (현재 localStorage → v2 payload) ─────
export function buildBackupPayload() {
  const entriesObj = store.read('entries', {})
  const ddaysList  = store.read('ddays', [])

  const entries = Object.values(entriesObj || {})
    .map(sanitizeEntry)
    .filter(Boolean)

  const ddays = (Array.isArray(ddaysList) ? ddaysList : [])
    .map(sanitizeDDay)
    .filter(Boolean)

  // 기타 dailydaeng.* 키는 raw 맵으로 (settings 등)
  const raw = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(store.PREFIX)) continue
    if (k === KEY_ENTRIES || k === KEY_DDAYS) continue  // 명시 영역과 중복 방지
    raw[k] = localStorage.getItem(k)
  }

  return {
    version:     BACKUP_VERSION,
    app:         'dailydaeng-app',
    exported_at: new Date().toISOString(),
    schemas:     { entries: SCHEMA_ENTRIES, ddays: SCHEMA_DDAYS },
    entries,
    ddays,
    raw,
  }
}

// ── 백업 페이로드 복원 (v1/v2 모두 처리) ─────────────────────
// 반환: { entries: n, ddays: n, raw: n }
export function applyBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('잘못된 백업 파일 형식입니다.')
  }

  // v1: { version:1, data: { "dailydaeng.entries": "...", ... } }
  if (payload.version === 1 || (!payload.version && payload.data)) {
    return applyV1(payload)
  }

  // v2 (현재 표준)
  if (payload.version === BACKUP_VERSION) {
    return applyV2(payload)
  }

  // 미지의 미래 버전: 호환되는 부분만이라도 시도
  if (typeof payload.version === 'number' && payload.version > BACKUP_VERSION) {
    return applyV2(payload)
  }

  throw new Error(`지원하지 않는 백업 버전입니다 (version=${payload.version}).`)
}

function clearAllAppKeys() {
  const toRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(store.PREFIX)) toRemove.push(k)
  }
  toRemove.forEach(k => localStorage.removeItem(k))
}

function applyV1(payload) {
  if (!payload.data || typeof payload.data !== 'object') {
    throw new Error('잘못된 백업 파일 형식입니다.')
  }
  clearAllAppKeys()
  let count = 0
  Object.entries(payload.data).forEach(([k, v]) => {
    if (k.startsWith(store.PREFIX) && typeof v === 'string') {
      localStorage.setItem(k, v)
      count++
    }
  })
  // v1을 v2 영역으로도 정규화 — entries/ddays 파싱 재적용 (legacy 필드 마이그레이션)
  try {
    const entriesObj = store.read('entries', {})
    const cleaned = {}
    Object.values(entriesObj || {}).forEach(e => {
      const s = sanitizeEntry(e)
      if (s) cleaned[s.date_key] = s
    })
    store.write('entries', cleaned)
  } catch (_) {}
  try {
    const ddays = store.read('ddays', [])
    if (Array.isArray(ddays)) {
      store.write('ddays', ddays.map(sanitizeDDay).filter(Boolean))
    }
  } catch (_) {}
  return { entries: -1, ddays: -1, raw: count, version: 1 }
}

function applyV2(payload) {
  clearAllAppKeys()

  const entries = Array.isArray(payload.entries) ? payload.entries : []
  const ddays   = Array.isArray(payload.ddays)   ? payload.ddays   : []
  const raw     = (payload.raw && typeof payload.raw === 'object') ? payload.raw : {}

  // entries: 배열 → date_key 맵
  const entryMap = {}
  let entryCount = 0
  entries.forEach(e => {
    const s = sanitizeEntry(e)
    if (s) { entryMap[s.date_key] = s; entryCount++ }
  })
  store.write('entries', entryMap)

  // ddays: 검증/마이그레이션 후 배열 저장
  const ddayList = ddays.map(sanitizeDDay).filter(Boolean)
  store.write('ddays', ddayList)

  // raw: entries/ddays 키는 무시 (위에서 명시 처리)
  let rawCount = 0
  Object.entries(raw).forEach(([k, v]) => {
    if (typeof k !== 'string' || !k.startsWith(store.PREFIX)) return
    if (k === KEY_ENTRIES || k === KEY_DDAYS) return
    if (typeof v !== 'string') return
    localStorage.setItem(k, v)
    rawCount++
  })

  return { entries: entryCount, ddays: ddayList.length, raw: rawCount, version: payload.version }
}
