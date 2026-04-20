// 색상 테마 프리셋
export const THEMES = {
  blue:   { primary: '#3B82F6', label: '기본 파랑' },
  green:  { primary: '#10B981', label: '초록' },
  amber:  { primary: '#F59E0B', label: '주황' },
  red:    { primary: '#EF4444', label: '빨강' },
  purple: { primary: '#8B5CF6', label: '보라' },
  pink:   { primary: '#EC4899', label: '분홍' },
  dark:   { primary: '#0F172A', label: '다크' },
  gray:   { primary: '#64748B', label: '회색' },
}

// 배경색 프리셋
export const BG_THEMES = {
  white:  { bg: '#FFFFFF', surface: '#F8FAFC', label: '흰색' },
  gray:   { bg: '#F2F4F7', surface: '#FFFFFF', label: '연회색' },
  blue:   { bg: '#EFF6FF', surface: '#FFFFFF', label: '연파랑' },
  orange: { bg: '#FFF8F0', surface: '#FFFFFF', label: '연주황' },
  green:  { bg: '#F0FDF4', surface: '#FFFFFF', label: '연초록' },
  dark:   { bg: '#0F172A', surface: '#1E293B', label: '다크' },
}

// 글자 크기 배율
export const FONT_SCALES = [
  { value: 0.85, label: '작게' },
  { value: 1.00, label: '보통' },
  { value: 1.15, label: '크게' },
  { value: 1.30, label: '매우 크게' },
]

// CSS 변수 적용
export function applyTheme(settings) {
  const root = document.documentElement
  if (settings.primaryColor) {
    root.style.setProperty('--color-primary', settings.primaryColor)
  }
  if (settings.bgTheme) {
    const bg = BG_THEMES[settings.bgTheme]
    if (bg) {
      root.style.setProperty('--color-bg', bg.bg)
      root.style.setProperty('--color-surface', bg.surface)
    }
  }
  if (settings.fontScale) {
    root.style.setProperty('--font-scale', settings.fontScale)
  }
  if (settings.badges) {
    const map = { '주': 'day', '야': 'night', '비': 'off', '휴': 'rest' }
    Object.entries(settings.badges).forEach(([type, cfg]) => {
      const key = map[type]
      if (!key) return
      if (cfg.fill)    root.style.setProperty(`--badge-${key}-fill`,      cfg.fill)
      if (cfg.text)    root.style.setProperty(`--badge-${key}-text`,      cfg.text)
      if (cfg.outline !== undefined)
                       root.style.setProperty(`--badge-${key}-outline`,   cfg.outline || 'transparent')
      if (cfg.outlineW !== undefined)
                       root.style.setProperty(`--badge-${key}-outline-w`, `${cfg.outlineW}px`)
    })
  }
  if (settings.bgTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
