// 화면 가장 뒤에 깔리는 배경 레이어
// - 단색(var(--color-bg))은 항상, 사용자 이미지는 있을 때만 그 위에 opacity 적용
// - App root div 는 background:transparent + 명시적 zIndex 로 콘텐츠를 위에 올림
// - fit 옵션:
//     'contain'      : 화면 안에 이미지 전체가 들어옴 (빈 공간 가능, 기본값)
//     'cover'        : 화면을 꽉 채우되 가장자리 일부 잘림 가능
//     '100% 100%'    : 화면 비율에 맞춰 늘림 (왜곡 가능)
//     'auto'         : 원본 크기 그대로 (작으면 가운데, 크면 잘림)

const VALID_FITS = new Set(['contain', 'cover', '100% 100%', 'auto'])

export default function BackgroundLayer({ bgImage, opacity, fit }) {
  const safeFit = VALID_FITS.has(fit) ? fit : 'contain'
  return (
    <>
      <div style={{
        position:'fixed', inset:0, zIndex:0,
        background:'var(--color-bg)',
        pointerEvents:'none',
      }} />
      {bgImage && (
        <div style={{
          position:'fixed', inset:0, zIndex:1,
          backgroundImage:`url(${bgImage})`,
          backgroundSize: safeFit,
          backgroundPosition:'center center',
          backgroundRepeat:'no-repeat',
          opacity: clampOpacity(opacity),
          pointerEvents:'none',
        }} />
      )}
    </>
  )
}

function clampOpacity(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0.3
  return Math.max(0.1, Math.min(1, n))
}
