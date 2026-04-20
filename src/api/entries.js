import { store } from './localStore'

const KEY = 'entries'

const readAll = () => store.read(KEY, {})

// 특정 월의 전체 엔트리 조회
export const getEntries = async (year, month) => {
  const all = readAll()
  const prefix = `${year}-${String(month).padStart(2,'0')}`
  return Object.values(all).filter(e => e.date_key?.startsWith(prefix))
}

// 단일 date_key 엔트리 조회 (현재 보는 월 바깥이어도 로컬에서 직접 조회)
export const getEntryByKey = async (dateKey) => {
  const all = readAll()
  return all[dateKey] || null
}

// 단일 날짜 엔트리 저장 (upsert)
export const saveEntry = async (entry) => {
  if (!entry?.date_key) throw new Error('date_key 누락')
  const all = readAll()
  all[entry.date_key] = entry
  store.write(KEY, all)
  return entry
}

// 단일 날짜 엔트리 삭제
export const deleteEntry = async (dateKey) => {
  const all = readAll()
  delete all[dateKey]
  store.write(KEY, all)
  return { ok: true }
}
