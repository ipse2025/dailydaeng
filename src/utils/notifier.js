// notifier 스키마 정규화 + 구형(v1.1~v1.2 초기) 데이터 마이그레이션
//
// 신스키마:
//   notifier = {
//     hour: 'HH', minute: 'MM',
//     schedule: { enabled, dismissedDate },
//     dday:     { enabled, dismissedDate },
//   }
//
// 구스키마(호환 대상):
//   notifier = { enabled, hour, minute, dismissedDate }  // schedule 전용이었음

export const DEFAULT_NOTIFIER = {
  hour:   '09',
  minute: '00',
  schedule: { enabled: false, dismissedDate: null },
  dday:     { enabled: false, dismissedDate: null },
}

export function normalizeNotifier(n) {
  if (!n || typeof n !== 'object') return { ...DEFAULT_NOTIFIER }

  // 신스키마
  if (n.schedule !== undefined || n.dday !== undefined) {
    return {
      hour:   n.hour   || DEFAULT_NOTIFIER.hour,
      minute: n.minute || DEFAULT_NOTIFIER.minute,
      schedule: {
        enabled:       !!n.schedule?.enabled,
        dismissedDate: n.schedule?.dismissedDate || null,
      },
      dday: {
        enabled:       !!n.dday?.enabled,
        dismissedDate: n.dday?.dismissedDate || null,
      },
    }
  }

  // 구스키마 → schedule 로 이관
  return {
    hour:   n.hour   || DEFAULT_NOTIFIER.hour,
    minute: n.minute || DEFAULT_NOTIFIER.minute,
    schedule: {
      enabled:       !!n.enabled,
      dismissedDate: n.dismissedDate || null,
    },
    dday: { enabled: false, dismissedDate: null },
  }
}
