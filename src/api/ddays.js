import { store } from './localStore'

const KEY = 'ddays'

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : `dd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const getDDays = async () => store.read(KEY, [])

export const addDDay = async ({ calendar, year, month, day, label }) => {
  const list = store.read(KEY, [])
  const item = {
    id: uid(),
    calendar: calendar === 'lunar' ? 'lunar' : 'solar',
    year:  parseInt(year, 10),
    month: parseInt(month, 10),
    day:   parseInt(day, 10),
    label: (label || '').trim(),
    createdAt: Date.now(),
  }
  const updated = [...list, item]
  store.write(KEY, updated)
  return item
}

export const removeDDay = async (id) => {
  const list = store.read(KEY, [])
  store.write(KEY, list.filter(d => d.id !== id))
  return { ok: true }
}
