import { store } from './localStore'

const SETTINGS_KEY = 'settings'
const SHIFT_KEY    = 'shiftPattern'

export const getSettings = async () => store.read(SETTINGS_KEY, null)

export const saveSettings = async (settings) => {
  const prev = store.read(SETTINGS_KEY, {}) || {}
  const merged = { ...prev, ...settings }
  store.write(SETTINGS_KEY, merged)
  return merged
}

export const getShiftPattern = async () => store.read(SHIFT_KEY, null)

export const saveShiftPattern = async (data) => {
  store.write(SHIFT_KEY, data)
  return data
}
