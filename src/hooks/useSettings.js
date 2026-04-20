import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings } from '../api/settings'
import { applyTheme } from '../styles/theme'

const DEFAULT_BADGES = {
  '주': { fill: '#F59E0B', text: '#FFFFFF', outline: '#B45309', outlineW: 1.5 },
  '야': { fill: '#64748B', text: '#FFFFFF', outline: '#1F2937', outlineW: 1.5 },
  '비': { fill: '#EF4444', text: '#FFFFFF', outline: '#991B1B', outlineW: 1.5 },
  '휴': { fill: '#FFFFFF', text: '#EF4444', outline: '#EF4444', outlineW: 2 },
}

const DEFAULT_SETTINGS = {
  primaryColor: '#3B82F6',
  bgTheme: 'gray',
  fontScale: 1,
  badges: DEFAULT_BADGES,
}

// 저장된 badges 를 기본값과 병합. outline/outlineW 가 완전히 누락이면 default
// (SettingsPanel 허용 범위 0.5 이상은 그대로 존중)
function normalizeBadges(savedBadges) {
  const out = { ...DEFAULT_BADGES }
  if (!savedBadges) return out
  for (const k of Object.keys(DEFAULT_BADGES)) {
    const saved = savedBadges[k] || {}
    const dflt  = DEFAULT_BADGES[k]
    const w = Number(saved.outlineW)
    const outlineBroken = !saved.outline || !Number.isFinite(w) || w < 0.5
    out[k] = {
      fill:     saved.fill     || dflt.fill,
      text:     saved.text     || dflt.text,
      outline:  outlineBroken ? dflt.outline  : saved.outline,
      outlineW: outlineBroken ? dflt.outlineW : w,
    }
  }
  return out
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    getSettings()
      .then(s => {
        const normalized = normalizeBadges(s?.badges)
        const merged = { ...DEFAULT_SETTINGS, ...(s || {}), badges: normalized }
        setSettings(merged)
        applyTheme(merged)
        // 저장된 배지가 정규화와 다르면 자동으로 마이그레이션 (한 번만)
        const dirty = s?.badges && JSON.stringify(s.badges) !== JSON.stringify(normalized)
        if (dirty) saveSettings(merged).catch(() => {})
      })
      .catch(() => { applyTheme(DEFAULT_SETTINGS) })
  }, [])

  const updateSettings = useCallback(async (newSettings) => {
    const merged = { ...settings, ...newSettings }
    setSettings(merged)
    applyTheme(merged)
    await saveSettings(merged).catch(() => {})
  }, [settings])

  return { settings, updateSettings }
}
