# DAILY댕 📅

Safari 기반 스마트폰 단독 구동 데일리 로그 PWA (shiftnote 포크)

---

## 빠른 시작

```bash
cd dailydaeng-app
npm install
npm run dev                # http://localhost:5173
```

`npm run dev` / `build` 는 실행 전 `scripts/sync-icons.mjs` 가 자동으로
`../icon/` 폴더의 PNG들을 `public/` 으로 복사합니다.

---

## 아이콘 교체

`../icon/icon.png` (1024×1024 권장) 한 장을 교체하면 아래 4종이 자동 파생됩니다:
`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`

재생성 스크립트 (macOS `sips`):
```bash
cd ../icon
sips -Z 192 icon.png --out icon-192.png
sips -Z 512 icon.png --out icon-512.png
sips -Z 512 icon.png --out icon-512-maskable.png
sips -Z 180 icon.png --out apple-touch-icon.png
```

---

## iOS Safari "홈 화면에 추가"

1. `npm run build && npm run preview`
2. iPhone Safari 에서 해당 URL 접속
3. 공유 → 홈 화면에 추가 → 아이콘 확인
4. 홈 아이콘 탭 → `display: standalone` 으로 풀스크린 구동

---

## 데이터

모든 기록은 브라우저 `localStorage` 에만 저장됩니다.
프리픽스: `dailydaeng.*`
- `dailydaeng.entries`: 날짜별 엔트리 (일정·운동·지출)
- `dailydaeng.settings`: 테마·폰트·배지·알림 설정
- `dailydaeng.shiftPattern`: 교대 근무 패턴

---

## 파일 구조

```
dailydaeng-app/
  src/
    components/   # UI (Calendar / Entry / Settings / Shift / Expense / BotSettings)
    hooks/        # 커스텀 훅
    api/          # localStorage 저장소 + 정적 공휴일 데이터
    utils/        # 날짜·교대 계산 유틸
    styles/       # CSS + 테마
  scripts/
    sync-icons.mjs  # ../icon → public/ 복사
  public/         # 빌드 시 정적 자산
```
