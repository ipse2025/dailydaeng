// 인앱 배너 (알리미 트리거 후 화면 상단 표시).
// 포지셔닝은 호출자가 담당 (App.jsx 가 wrapper 로 위치 지정).
//
// props:
//   icon    : React element (SVG/이미지 등)
//   iconBg  : 아이콘 칩 배경색 (옅은 톤 권장)
//   accent  : 강조색 (border / count 텍스트)
//   title   : 제목 문자열
//   lines   : 본문 문자열 배열 (최대 3개 + "외 N건 더")
//   count   : 총 건수 (undefined 면 미표시)
//   onDismiss : 닫기 핸들러

export default function InAppBanner({ icon, iconBg, accent, title, lines, count, onDismiss }) {
  const shown = (lines || []).slice(0, 3)
  const rest  = Math.max(0, (lines?.length || 0) - shown.length)
  const border = accent || 'var(--color-primary)'

  return (
    <div className="animate-slide-down"
         style={{
           background:'var(--color-surface)',
           border:`1.5px solid ${border}`,
           borderRadius:14,
           boxShadow:'0 6px 20px rgba(0,0,0,0.12)',
           padding:'10px 12px 12px',
           display:'flex', alignItems:'flex-start', gap:10,
         }}>
      <span style={{
        width:40, height:40, borderRadius:10, overflow:'hidden', flexShrink:0, marginTop:2,
        background: iconBg || '#EAE9E9',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        border:'1px solid rgba(0,0,0,0.06)',
      }}>
        {icon}
      </span>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <span style={{ fontWeight:900, fontSize:'calc(13px * var(--font-scale))', color:'var(--color-text1)' }}>
            {title}
          </span>
          {typeof count === 'number' && count > 0 && (
            <span style={{ fontSize:'calc(10px * var(--font-scale))', color:border, fontWeight:700 }}>
              · {count}건
            </span>
          )}
        </div>
        <ul style={{ listStyle:'none', padding:0, margin:0,
                     display:'flex', flexDirection:'column', gap:2 }}>
          {shown.map((line, i) => (
            <li key={i} style={{
              fontSize:'calc(12px * var(--font-scale))', color:'var(--color-text1)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              • {line || '(내용 없음)'}
            </li>
          ))}
          {rest > 0 && (
            <li style={{ fontSize:'calc(11px * var(--font-scale))', color:'var(--color-text2)' }}>
              외 {rest}건 더
            </li>
          )}
        </ul>
      </div>

      <button onClick={onDismiss} aria-label="닫기"
              style={{
                width:28, height:28, flexShrink:0, padding:0,
                background:'transparent', border:'none', cursor:'pointer',
                color:'var(--color-text2)', fontSize:18, lineHeight:1,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
        ✕
      </button>
    </div>
  )
}
