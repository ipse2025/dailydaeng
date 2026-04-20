// OAuth 2.0 Implicit Flow 직접 구현
// GIS 라이브러리의 window.closed COOP 이슈를 회피하기 위해 수동 구현
// popup + postMessage 패턴

const CLIENT_ID     = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE         = 'https://www.googleapis.com/auth/drive.appdata'
const REDIRECT_PATH = '/oauth-callback.html'
const MSG_TYPE      = 'dailydaeng_oauth_response'

export function useGoogleDrive() {
  const requestAccessToken = () => {
    return new Promise((resolve, reject) => {
      if (!CLIENT_ID) {
        reject(new Error('VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다.'))
        return
      }

      const state       = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const redirectUri = `${window.location.origin}${REDIRECT_PATH}`

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
      try { popup.focus() } catch (e) {}

      let settled = false
      const cleanup = () => {
        settled = true
        window.removeEventListener('message', onMessage)
        clearInterval(closedTimer)
        clearTimeout(timeoutTimer)
      }

      const onMessage = (e) => {
        if (settled) return
        if (e.origin !== window.location.origin) return
        const d = e.data
        if (!d || d.type !== MSG_TYPE) return
        if (d.state !== state) return   // CSRF 방지
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
      window.addEventListener('message', onMessage)

      // popup.closed 폴링 — COOP 환경에선 예외 발생 가능, 감싸서 무시
      const closedTimer = setInterval(() => {
        if (settled) return
        let isClosed = false
        try { isClosed = popup.closed } catch (_) { return }
        if (isClosed) {
          cleanup()
          reject(new Error('로그인 창이 닫혔습니다. 다시 시도해 주세요.'))
        }
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
