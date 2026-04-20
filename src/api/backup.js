// Google Drive appDataFolder 기반 백업/복원
// 모든 요청은 accessToken 필요 (useGoogleDrive 훅에서 발급)

import { store } from './localStore'

const FILE_NAME = 'dailydaeng-backup.json'
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

// localStorage에서 dailydaeng.* 전부 dump
export function collectBackupData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(store.PREFIX)) {
      data[key] = localStorage.getItem(key)  // raw string 저장 (JSON.parse 실패 방지)
    }
  }
  return {
    version:     1,
    app:         'dailydaeng-app',
    exported_at: new Date().toISOString(),
    data,
  }
}

// 백업 데이터 → localStorage 전체 교체
export function applyBackupData(payload) {
  if (!payload || typeof payload !== 'object' || !payload.data) {
    throw new Error('잘못된 백업 파일 형식입니다.')
  }
  // 기존 dailydaeng.* 키 제거
  const toRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(store.PREFIX)) toRemove.push(k)
  }
  toRemove.forEach(k => localStorage.removeItem(k))
  // 새 데이터 주입
  Object.entries(payload.data).forEach(([k, v]) => {
    if (k.startsWith(store.PREFIX) && typeof v === 'string') {
      localStorage.setItem(k, v)
    }
  })
}

// appDataFolder 내 기존 백업 파일 검색 → fileId 반환 (없으면 null)
async function findExistingFileId(token) {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${FILE_NAME}'`,
    fields: 'files(id,name,modifiedTime)',
  })
  const r = await fetch(`${DRIVE_API}?${params}`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error(`파일 검색 실패 (${r.status})`)
  const j = await r.json()
  return j.files?.[0]?.id || null
}

// 업로드 (덮어쓰기) — 기존 파일 있으면 update, 없으면 create
export async function uploadBackup(token) {
  const payload = collectBackupData()
  const body    = JSON.stringify(payload, null, 2)
  const existingId = await findExistingFileId(token)

  if (existingId) {
    // 내용만 갱신
    const r = await fetch(
      `${UPLOAD_API}/${existingId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body,
      }
    )
    if (!r.ok) throw new Error(`업로드 실패 (${r.status})`)
    return { mode: 'updated', at: payload.exported_at }
  }

  // 신규 생성 (multipart: metadata + content)
  const boundary = '-------dailydaeng' + Math.random().toString(36).slice(2)
  const metadata = {
    name:    FILE_NAME,
    parents: ['appDataFolder'],
  }
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) + `\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    body + `\r\n` +
    `--${boundary}--`

  const r = await fetch(
    `${UPLOAD_API}?uploadType=multipart`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    }
  )
  if (!r.ok) throw new Error(`업로드 실패 (${r.status})`)
  return { mode: 'created', at: payload.exported_at }
}

// 다운로드 → payload 반환 (없으면 null)
export async function downloadBackup(token) {
  const fileId = await findExistingFileId(token)
  if (!fileId) return null
  const r = await fetch(
    `${DRIVE_API}/${fileId}?alt=media`,
    { headers: authHeaders(token) }
  )
  if (!r.ok) throw new Error(`다운로드 실패 (${r.status})`)
  return await r.json()
}
