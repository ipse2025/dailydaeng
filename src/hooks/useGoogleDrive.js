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
          reject(new Error(err?.message || '인증 취소되었거나 실패했습니다.'))
        },
      })
      tokenClientRef.current = client
      client.requestAccessToken({ prompt: '' })  // 첫 호출엔 consent, 이후 silent
    })
  }

  return { requestAccessToken }
}
