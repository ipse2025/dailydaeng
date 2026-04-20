// 로컬 저장소 추상화 (localStorage 기반)
// 원래 axios 기반 백엔드 API를 대체

const PREFIX = 'dailydaeng.'

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const write = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('[localStore] write 실패:', e)
  }
}

const remove = (key) => {
  try { localStorage.removeItem(PREFIX + key) } catch {}
}

export const store = { read, write, remove, PREFIX }
