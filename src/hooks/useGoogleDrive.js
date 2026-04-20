// Google Identity Services (GIS) 기반 access token 발급
// Drive appDataFolder 스코프만 요청

import { useEffect, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE     = 'https://www.googleapis.com/auth/drive.appdata'

export function useGoogleDrive() {
  const tokenClientRef = useRef(null)
  const readyRef       = useRef(false)

  // GIS 스크립트 준비 대기 (index.html에 async defer 로 로드됨)
  useEffect(() => {
    let cancelled = false
    const tryInit = () => {
      if (cancelled) return
      if (window.google?.accounts?.oauth2) {
        readyRef.current = true
        return
      }
      setTimeout(tryInit, 100)
    }
    tryInit()
    return () => { cancelled = true }
  }, [])

  // 매 호출마다 새 Promise 로 토큰 요청 (팝업)
  const requestAccessToken = () => {
    return new Promise((resolve, reject) => {
      if (!CLIENT_ID) {
        reject(new Error('VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다.'))
        return
      }
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google 인증 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도하세요.'))
        return
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope:     SCOPE,
        callback:  (resp) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error))
          } else {
            resolve(resp.access_token)
          }
        },
        error_callback: (err) => {
          const t = err?.type
          let msg = err?.message || '인증 실패'
          if (t === 'popup_closed') {
            msg = '로그인 창이 닫혔습니다. 팝업 차단을 해제한 뒤 다시 시도하거나, Google 계정이 테스트 사용자로 등록돼 있는지 확인해 주세요.'
          } else if (t === 'popup_failed_to_open') {
            msg = '팝업이 차단되었습니다. 브라우저 주소창의 팝업 차단 아이콘을 클릭해 허용으로 바꾸세요.'
          } else if (t === 'unknown') {
            msg = '인증 중 오류가 발생했습니다. 다시 시도해 주세요.'
          }
          reject(new Error(msg))
        },
      })
      tokenClientRef.current = client
      // 매 호출마다 consent 화면 표시 (테스트 모드에서 silent 이슈 회피)
      client.requestAccessToken({ prompt: 'consent' })
    })
  }

  return { requestAccessToken }
}
