// 알리미 항목·인앱 배너용 인라인 SVG 아이콘.
// 외부 자산 요청 없음 → 오프라인·렌더 안정.

export function CloverIcon({ size = 24, color = '#22C55E', stem = '#166534' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true" style={{ display:'block' }}>
      {/* 4 겹친 원으로 네잎클로버 표현 */}
      <g fill={color}>
        <circle cx="24" cy="14" r="10" />
        <circle cx="34" cy="24" r="10" />
        <circle cx="24" cy="34" r="10" />
        <circle cx="14" cy="24" r="10" />
      </g>
      {/* 줄기 */}
      <path d="M24 26 C 24 32, 28 38, 30 42 L 28 42 C 26 38, 23 32, 23 26 Z"
            fill={stem} />
    </svg>
  )
}

export function HeartIcon({ size = 24, color = '#EF4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
         aria-hidden="true" style={{ display:'block' }}>
      <path fill={color}
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}
