// 원본에서는 Telegram WebApp SDK 훅. 로컬 단독 앱에서는 햅틱만 navigator.vibrate 로 대체.
// 동일한 인터페이스를 유지하여 호출 측 코드를 수정하지 않음.

export function useTelegramSDK() {
  const haptic = (type = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return
    const dur = type === 'heavy' ? 30 : type === 'medium' ? 15 : 8
    try { navigator.vibrate(dur) } catch {}
  }

  const showAlert = (msg) => window.alert(msg)
  const showConfirm = (msg, cb) => {
    const ok = window.confirm(msg)
    cb?.(ok)
  }

  return { tg: null, user: null, haptic, showAlert, showConfirm }
}
