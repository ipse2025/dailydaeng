// OAuth 2.0 Implicit Flow 직접 구현
// 3중 채널(postMessage / BroadcastChannel / localStorage)로 토큰 회수
// COOP 환경에서 cross-origin redirect 후 opener 끊김 케이스 대비
//
// UX 최적화:
// - 발급된 토큰은 만료 전까지 localStorage에 캐시하여 재사용 (팝업 자체를 안 띄움)
// - prompt=consent 제거 → 한 번 동의한 앱은 동의 화면 스킵
// - login_hint 지정 → 계정 선택 화면 스킵

const CLIENT_ID     = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE         = 'https://www.googleapis.com/auth/drive.appdata'
const REDIRECT_PATH = '/oauth-callback.html'
const MSG_TYPE      = 'dailydaeng_oauth_response'
const STORAGE_KEY   = 'dailydaeng_oauth_response'
const TOKEN_KEY     = 'dailydaeng.oauth.token'
const LOGIN_HINT    = 'ipse2025@gmail.com'
const EXPIRY_BUFFER_MS = 5 * 60 * 1000  // 만료 5분 전엔 새 토큰 발급

function readCachedToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || !obj.access_token || !obj.expires_at) return null
    if (Date.now() + EXPIRY_BUFFER_MS >= obj.expires_at) return null
    return obj.access_token
  } catch (_) {
    return null
  }
}

function writeCachedToken(accessToken, expiresInSec) {
  try {
    const expires_at = Date.now() + (Number(expiresInSec || 3600) * 1000)
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: accessToken, expires_at }))
  } catch (_) {}
}

export function clearCachedToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch (_) {}
}

export function useGoogleDrive() {
  const requestAccessToken = () => {
    return new Promise((resolve, reject) => {
      if (!CLIENT_ID) {
        reject(new Error('VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다.'))
        return
      }

      // 캐시 적중 시 즉시 반환 — 팝업 자체를 띄우지 않음
      const cached = readCachedToken()
      if (cached) {
        resolve(cached)
        return
      }

      const state       = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const redirectUri = `${window.location.origin}${REDIRECT_PATH}`

      // 이전 잔여물 제거
      try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id',     CLIENT_ID)
      authUrl.searchParams.set('redirect_uri',  redirectUri)
      authUrl.searchParams.set('response_type', 'token')
      authUrl.searchParams.set('scope',         SCOPE)
      authUrl.searchParams.set('state',         state)
      authUrl.searchParams.set('include_granted_scopes', 'true')
      if (LOGIN_HINT) authUrl.searchParams.set('login_hint', LOGIN_HINT)

      // 팝업 중앙 배치
      const w = 500, h = 640
      const dualLeft = window.screenLeft ?? window.screenX ?? 0
      const dualTop  = window.screenTop  ?? window.screenY ?? 0
      const width    = window.innerWidth  || document.documentElement.clientWidth  || screen.width
      const height   = window.innerHeight || document.documentElement.clientHeight || screen.height
      const left     = dualLeft + (width  - w) / 2
      const top      = dualTop  + (height - h) / 2

      const popup = window.open(
        authUrl.toString(),
        'dailydaeng_oauth',
        `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
      )

      if (!popup) {
        reject(new Error('팝업이 차단되었습니다. 브라우저 주소창 팝업 차단을 해제한 뒤 다시 시도하세요.'))
        return
      }
      try { popup.focus() } catch (_) {}

      let settled = false
      let bc = null

      const cleanup = () => {
        settled = true
        window.removeEventListener('message', onMessage)
        window.removeEventListener('storage', onStorage)
        if (bc) { try { bc.close() } catch (_) {} bc = null }
        clearInterval(closedTimer)
        clearInterval(pollTimer)
        clearTimeout(timeoutTimer)
        try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}
      }

      const handlePayload = (d) => {
        if (settled) return
        if (!d || d.type !== MSG_TYPE) return
        if (d.state !== state) return
        cleanup()
        try { if (popup && !popup.closed) popup.close() } catch (_) {}
        if (d.error) {
          reject(new Error(d.error))
        } else if (d.access_token) {
          writeCachedToken(d.access_token, d.expires_in)
          resolve(d.access_token)
        } else {
          reject(new Error('토큰을 받지 못했습니다.'))
        }
      }

      const onMessage = (e) => {
        if (e.origin !== window.location.origin) return
        handlePayload(e.data)
      }
      window.addEventListener('message', onMessage)

      try {
        if ('BroadcastChannel' in window) {
          bc = new BroadcastChannel('dailydaeng_oauth')
          bc.onmessage = (e) => handlePayload(e.data)
        }
      } catch (_) {}

      const onStorage = (e) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return
        try { handlePayload(JSON.parse(e.newValue)) } catch (_) {}
      }
      window.addEventListener('storage', onStorage)

      const pollTimer = setInterval(() => {
        if (settled) return
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) handlePayload(JSON.parse(raw))
        } catch (_) {}
      }, 400)

      const closedTimer = setInterval(() => {
        if (settled) return
        let isClosed = false
        try { isClosed = popup.closed } catch (_) { return }
        if (!isClosed) return

        setTimeout(() => {
          if (settled) return
          try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) { handlePayload(JSON.parse(raw)); return }
          } catch (_) {}
          cleanup()
          reject(new Error('로그인 창이 닫혔습니다. 다시 시도해 주세요.'))
        }, 1000)

        clearInterval(closedTimer)
      }, 500)

      const timeoutTimer = setTimeout(() => {
        if (settled) return
        cleanup()
        try { if (popup && !popup.closed) popup.close() } catch (_) {}
        reject(new Error('인증 시간이 초과되었습니다. 다시 시도해 주세요.'))
      }, 120000)
    })
  }

  return { requestAccessToken, clearCachedToken }
}
