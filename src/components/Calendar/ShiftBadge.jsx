// ShiftBadge.jsx
// CSS border-radius:50% + flexbox centering → 완벽한 원형 + 정중앙 글자
export default function ShiftBadge({ type, size = 28, fontSize }) {
  if (!type) return null
  const fs = fontSize || Math.round(size * 0.52)
  return (
    <div
      className={`shift-badge ${type}`}
      style={{
        width:      size,
        height:     size,
        fontSize:   fs,
        flexShrink: 0,
      }}
    >
      {type}
    </div>
  )
}
