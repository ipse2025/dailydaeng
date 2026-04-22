// Google Drive appDataFolder 기반 백업/복원
// 모든 요청은 accessToken 필요 (useGoogleDrive 훅에서 발급)
//
// 페이로드 스키마는 backupSchema.js 에서 담당 (v1/v2 양쪽 호환)

import { buildBackupPayload, applyBackupPayload } from './backupSchema'

const FILE_NAME  = 'dailydaeng-backup.json'
const DRIVE_API  = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function collectBackupData() {
  return buildBackupPayload()
}

export function applyBackupData(payload) {
  return applyBackupPayload(payload)
}

async function findExistingFileId(token) {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q:      `name='${FILE_NAME}'`,
    fields: 'files(id,name,modifiedTime)',
  })
  const r = await fetch(`${DRIVE_API}?${params}`, { headers: authHeaders(token) })
  if (!r.ok) throw new Error(`파일 검색 실패 (${r.status})`)
  const j = await r.json()
  return j.files?.[0]?.id || null
}

export async function uploadBackup(token) {
  const payload = buildBackupPayload()
  const body    = JSON.stringify(payload, null, 2)
  const existingId = await findExistingFileId(token)

  if (existingId) {
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

  const boundary = '-------dailydaeng' + Math.random().toString(36).slice(2)
  const metadata = { name: FILE_NAME, parents: ['appDataFolder'] }
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
