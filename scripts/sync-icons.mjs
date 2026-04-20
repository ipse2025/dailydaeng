// project/icon/ 의 두 서브폴더를 public/ 구조로 복사
//   icon/main/*.png    → public/          (홈 화면 아이콘·manifest)
//                         + 복사 후 fill-corners 후처리 (iOS squircle 호환)
//   icon/alarm/*.png   → public/alarm/    (알리미 패널·인앱 배너 아이콘, 후처리 X)
// npm run dev / npm run build / npm run sync-icons 에서 호출됨.

import { readdirSync, copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fillCorners } from './fill-corners.mjs'

const __dirname    = fileURLToPath(new URL('.', import.meta.url))
const APP_ROOT     = resolve(__dirname, '..')
// dailydaeng-app/scripts → ../../ → Daily댕 v1.2 → ../ → Project
const PROJECT_ROOT = resolve(APP_ROOT, '..', '..')
const ICON_ROOT    = join(PROJECT_ROOT, 'icon')
const PUBLIC_DIR   = join(APP_ROOT, 'public')

// main/* 중에서 코너 후처리를 적용할 대상 (원본 콘텐츠가 원형이라 iOS squircle 불일치)
const SQUIRCLE_TARGETS = new Set([
  'icon.png',                // 1024 원본도 통일성 위해
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
])

const JOBS = [
  { src: join(ICON_ROOT, 'main'),  dst: PUBLIC_DIR,                 label: 'main',  postprocess: true },
  { src: join(ICON_ROOT, 'alarm'), dst: join(PUBLIC_DIR, 'alarm'),   label: 'alarm', postprocess: false },
]

if (!existsSync(ICON_ROOT)) {
  console.log(`[sync-icons] 소스 루트 없음: ${ICON_ROOT} — 건너뜀`)
  process.exit(0)
}

mkdirSync(PUBLIC_DIR, { recursive: true })

let total = 0, processed = 0
for (const { src, dst, label, postprocess } of JOBS) {
  if (!existsSync(src)) {
    console.log(`[sync-icons] (${label}) 소스 없음: ${src} — 건너뜀`)
    continue
  }
  mkdirSync(dst, { recursive: true })

  const files = readdirSync(src)
    .filter(f => !f.startsWith('.') && f.toLowerCase() !== 'readme.md')
    .filter(f => statSync(join(src, f)).isFile())   // 하위 폴더 (legacy 등) 제외

  for (const f of files) {
    const outPath = join(dst, f)
    copyFileSync(join(src, f), outPath)
    console.log(`[sync-icons] (${label}) ✓ ${f}`)
    total++

    if (postprocess && SQUIRCLE_TARGETS.has(f)) {
      try {
        fillCorners(outPath)
        processed++
      } catch (e) {
        console.error(`[sync-icons] fill-corners 실패: ${f} — ${e.message}`)
      }
    }
  }
}
console.log(`[sync-icons] 총 ${total}개 복사, ${processed}개 squircle 후처리 완료`)
