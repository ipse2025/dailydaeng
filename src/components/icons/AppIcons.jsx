// src/components/icons/AppIcons.jsx
// ─────────────────────────────────────────────────────────────────────
// DAILY댕 앱 아이콘 세트 (Set A · Minimal Line 톤)
// 헤더 5버튼 및 각종 액션 버튼에 사용되는 인라인 SVG 컴포넌트 모음.
//
// 사용 원칙:
//   - 모든 아이콘은 { size, color } props 를 지원한다.
//   - color 는 fill 이 아니라 stroke 로 적용된다 (단색 라인 톤).
//   - 호출처에서 기존 이모지를 아래 컴포넌트로 교체.
// ─────────────────────────────────────────────────────────────────────

const stroke = (color, width = 1.7) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

const Base = ({ size, children, vb = 24 }) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}
       xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
       style={{ display: 'block' }}>
    {children}
  </svg>
);

/** 근무 패턴 설정 (현재: 📅) — 파란 배경의 달력 */
export function ShiftIcon({ size = 18, color = '#fff' }) {
  return (
    <Base size={size}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...stroke(color)} />
      <path d="M3.5 9.5 H20.5" {...stroke(color)} />
      <path d="M7.5 3 V6.5 M16.5 3 V6.5" {...stroke(color)} />
      <circle cx="8" cy="13.5" r="1.1" fill={color} />
      <circle cx="12" cy="13.5" r="1.1" fill={color} />
      <circle cx="16" cy="13.5" r="1.1" fill={color} />
    </Base>
  );
}

/** 화면 설정 (현재: ⚙) — 회색 배경의 톱니바퀴 */
export function SettingsIcon({ size = 18, color = '#fff' }) {
  return (
    <Base size={size}>
      <circle cx="12" cy="12" r="2.8" {...stroke(color)} />
      <path d="M12 3.2v2.4 M12 18.4v2.4 M4.8 12H2.4 M21.6 12h-2.4
               M6.9 6.9 5.2 5.2 M18.8 18.8l-1.7-1.7
               M6.9 17.1 5.2 18.8 M18.8 5.2l-1.7 1.7"
            {...stroke(color)} />
    </Base>
  );
}

/** 월간 지출 (현재: $ 텍스트) — 주황 배경의 달러 기호 */
export function ExpenseIcon({ size = 18, color = '#fff' }) {
  return (
    <Base size={size}>
      <path d="M12 3.5 V20.5" {...stroke(color)} />
      <path d="M16 7.5 Q12 5.5 9.5 7 Q7 9 9 11 Q11 12.5 14 13.5 Q17 14.5 15.5 17 Q13 18.5 8 16.5"
            {...stroke(color)} />
    </Base>
  );
}

/** Google Drive 백업 (현재: ☁) — 하늘색 배경의 클라우드 업로드 */
export function BackupIcon({ size = 18, color = '#fff' }) {
  return (
    <Base size={size}>
      <path d="M6.5 17.5 Q3 17 3 13.5 Q3 10.5 6 10 Q6.5 6.5 10 6 Q13.5 5.5 15.5 8.5 Q20 8.5 20.5 13 Q21 17 17 17.5 Z"
            {...stroke(color)} />
      <path d="M12 11 V16 M9.5 13.5 L12 16 L14.5 13.5" {...stroke(color)} />
    </Base>
  );
}

/** 드롭다운 가져오기 화살표 (현재: 📤) */
export function UploadIcon({ size = 18, color = '#0EA5E9' }) {
  return (
    <Base size={size}>
      <path d="M12 16 V4 M7.5 8.5 L12 4 L16.5 8.5" {...stroke(color)} />
      <path d="M4 16 V18.5 Q4 20 5.5 20 H18.5 Q20 20 20 18.5 V16" {...stroke(color)} />
    </Base>
  );
}

/** 드롭다운 가져오기 화살표 (현재: 📥) */
export function DownloadIcon({ size = 18, color = '#0EA5E9' }) {
  return (
    <Base size={size}>
      <path d="M12 4 V16 M7.5 11.5 L12 16 L16.5 11.5" {...stroke(color)} />
      <path d="M4 16 V18.5 Q4 20 5.5 20 H18.5 Q20 20 20 18.5 V16" {...stroke(color)} />
    </Base>
  );
}

/** 닫기 (현재: ✕) — 모달/패널/배너 공통 */
export function CloseIcon({ size = 18, color = 'currentColor' }) {
  return (
    <Base size={size}>
      <path d="M6 6 L18 18 M18 6 L6 18" {...stroke(color, 2)} />
    </Base>
  );
}

/** 드롭다운 화살표 ▼ */
export function ChevronDownIcon({ size = 12, color = 'currentColor' }) {
  return (
    <Base size={size}>
      <path d="M6 9 L12 15 L18 9" {...stroke(color, 2)} />
    </Base>
  );
}

/** 드롭다운 화살표 ▲ */
export function ChevronUpIcon({ size = 12, color = 'currentColor' }) {
  return (
    <Base size={size}>
      <path d="M6 15 L12 9 L18 15" {...stroke(color, 2)} />
    </Base>
  );
}

/** 카메라 (현재: 📷) — 배경 이미지 선택 버튼 */
export function CameraIcon({ size = 18, color = 'currentColor' }) {
  return (
    <Base size={size}>
      <path d="M4 8 H7.5 L9 6 H15 L16.5 8 H20 Q21 8 21 9 V18 Q21 19 20 19 H4 Q3 19 3 18 V9 Q3 8 4 8 Z"
            {...stroke(color)} />
      <circle cx="12" cy="13.5" r="3.2" {...stroke(color)} />
    </Base>
  );
}
