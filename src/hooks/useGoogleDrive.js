// OAuth 2.0 Implicit Flow 직접 구현
// 3중 채널(postMessage / BroadcastChannel / localStorage)로 토큰 회수
// COOP 환경에서 cross-origin redirect 후 opener 끊김 케이스 대비

const CLIENT_ID     = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE         = 'https://www.googleapis.com/auth/drive.appdata'
const REDIRECT_PATH = '/oauth-callback.html'
const MSG_TYPE      = 'dailydaeng_oauth_response'
const STORAGE_KEY   = 'dailydaeng_oauth_response'

export function useGoogleDrive() {
  const requestAccessToken = () => {
    return new Promise((resolve, reject) => {
      if (!CLIENT_ID) {
        reject(new Error('VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다.'))
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
      authUrl.searchParams.set('prompt',        'consent')
      authUrl.searchParams.set('include_granted_scopes', 'true')

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

      // 공통 payload 처리기
      const handlePayload = (d) => {
        if (settled) return
        if (!d || d.type !== MSG_TYPE) return
        if (d.state !== state) return  // CSRF 방지
        cleanup()
        try { if (popup && !popup.closed) popup.close() } catch (_) {}
        if (d.error) {
          reject(new Error(d.error))
        } else if (d.access_token) {
          resolve(d.access_token)
        } else {
          reject(new Error('토큰을 받지 못했습니다.'))
        }
      }

      // 채널 1: postMessage (opener 살아있을 때)
      const onMessage = (e) => {
        if (e.origin !== window.location.origin) return
        handlePayload(e.data)
      }
      window.addEventListener('message', onMessage)

      // 채널 2: BroadcastChannel
      try {
        if ('BroadcastChannel' in window) {
          bc = new BroadcastChannel('dailydaeng_oauth')
          bc.onmessage = (e) => handlePayload(e.data)
        }
      } catch (_) {}

      // 채널 3: storage 이벤트 (다른 탭/창에서 setItem 시 발화)
      const onStorage = (e) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return
        try { handlePayload(JSON.parse(e.newValue)) } catch (_) {}
      }
      window.addEventListener('storage', onStorage)

      // 채널 3 보강: 같은 탭에선 storage 이벤트 안 뜨므로 폴링도 병행
      const pollTimer = setInterval(() => {
        if (settled) return
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) handlePayload(JSON.parse(raw))
        } catch (_) {}
      }, 400)

      // popup.closed 폴링 — 단, 모든 채널 회수 실패 시에만 reject
      // 닫힌 직후에도 storage가 약간 늦게 도달할 수 있으므로 grace period 부여
      const closedTimer = setInterval(() => {
        if (settled) return
        let isClosed = false
        try { isClosed = popup.closed } catch (_) { return }
        if (!isClosed) return

        // 닫힌 후 1초 동안 storage/BroadcastChannel 응답 대기
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

  return { requestAccessToken }
}
