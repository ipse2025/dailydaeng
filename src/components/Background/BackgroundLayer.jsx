// 화면 가장 뒤에 깔리는 배경 레이어
// - 단색(var(--color-bg))은 항상, 사용자 이미지는 있을 때만 그 위에 opacity 적용
// - App root div는 background:transparent + 명시적 zIndex 로 콘텐츠를 위에 올림

export default function BackgroundLayer({ bgImage, opacity }) {
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
          backgroundSize:'cover',
          backgroundPosition:'center',
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
