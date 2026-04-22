import { CloseIcon } from '../icons/AppIcons'

// 인앱 배너 (알리미 트리거 후 화면 상단 표시).
// 포지셔닝은 호출자가 담당 (App.jsx 가 wrapper 로 위치 지정).
//
// 디자인 의도:
//   - 화면 약 1/3 면적 (min-height 30dvh) 차지하여 눈에 확 띄게
//   - 글자 크기는 var(--font-scale) 과 분리된 고정 px → 사용자가 글씨 작게로 두어도 알림은 크게
//   - 본문은 굵은 weight + 2줄 wrap 허용 (배너 안에 자연스럽게 줄바꿈)
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
           border:`2px solid ${border}`,
           borderRadius:18,
           boxShadow:'0 8px 24px rgba(0,0,0,0.14)',
           padding:'22px 22px 24px',
           display:'flex', alignItems:'flex-start', gap:16,
           minHeight:'30dvh',
         }}>
      <span style={{
        width:68, height:68, borderRadius:14, overflow:'hidden', flexShrink:0, marginTop:2,
        background: iconBg || '#EAE9E9',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        border:'1px solid rgba(0,0,0,0.06)',
      }}>
        {icon}
      </span>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
          <span style={{ fontWeight:800, fontSize:26, color:'var(--color-text1)', lineHeight:1.2 }}>
            {title}
          </span>
          {typeof count === 'number' && count > 0 && (
            <span style={{ fontSize:16, color:border, fontWeight:700 }}>
              · {count}건
            </span>
          )}
        </div>
        <ul style={{ listStyle:'none', padding:0, margin:0,
                     display:'flex', flexDirection:'column', gap:10 }}>
          {shown.map((line, i) => (
            <li key={i} style={{
              fontSize:21, fontWeight:700, lineHeight:1.35, color:'var(--color-text1)',
              display:'-webkit-box', WebkitBoxOrient:'vertical', WebkitLineClamp:2,
              overflow:'hidden', wordBreak:'break-word',
            }}>
              • {line || '(내용 없음)'}
            </li>
          ))}
          {rest > 0 && (
            <li style={{ fontSize:16, fontWeight:600, color:'var(--color-text2)', marginTop:2 }}>
              외 {rest}건 더
            </li>
          )}
        </ul>
      </div>

      <button onClick={onDismiss} aria-label="닫기"
              style={{
                width:36, height:36, flexShrink:0, padding:0,
                background:'transparent', border:'none', cursor:'pointer',
                color:'var(--color-text2)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
        <CloseIcon size={22} color="var(--color-text2)" />
      </button>
    </div>
  )
}
