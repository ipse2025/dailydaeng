// iOS squircle 마스크와 잘 어울리도록 원형 아이콘의 4개 코너를
// 원 테두리 색으로 채워 "핑크 사각형(안에 원래 콘텐츠)" 형태로 변환.
// iOS 는 이 PNG 에 자동으로 squircle 마스크를 적용 → 핑크 squircle 아이콘.
//
// 사용(CLI): node scripts/fill-corners.mjs <png-path> [<png-path> ...]
// 사용(모듈): import { fillCorners } from './fill-corners.mjs'

import { PNG } from 'pngjs'
import { readFileSync, writeFileSync } from 'node:fs'

export function fillCorners(path) {
  const buf = readFileSync(path)
  const png = PNG.sync.read(buf)
  const { width, height, data } = png

  // 이미지에 원이 inscribe 되어 있다고 가정.
  // 좌측 에지(x=0)의 세로 중앙 픽셀은 반드시 원의 테두리 색.
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const r  = Math.min(cx, cy)
  const r2 = r * r

  const sy = Math.floor(cy)
  const sIdx = (sy * width + 0) * 4
  const pink = [data[sIdx], data[sIdx + 1], data[sIdx + 2]]

  let filled = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy > r2) {
        const idx = (y * width + x) * 4
        data[idx]     = pink[0]
        data[idx + 1] = pink[1]
        data[idx + 2] = pink[2]
        data[idx + 3] = 255
        filled++
      }
    }
  }

  writeFileSync(path, PNG.sync.write(png))
  const hex = '#' + pink.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
  console.log(`[fill-corners] ${path}  ${width}×${height}  ${hex}  코너 ${filled}px 채움`)
}

// CLI 직접 실행 시에만 인자 처리
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('인자로 PNG 파일 경로를 주세요')
    process.exit(1)
  }
  for (const p of args) fillCorners(p)
}
