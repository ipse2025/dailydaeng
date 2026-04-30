// 공휴일 데이터 자동 갱신 스크립트
//
// 소스: Google Calendar 의 한국 공휴일 공개 iCal 피드
//   https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics
// 결과: src/api/holidaysData.js 를 현재 연도 ±N 범위로 재생성
//
// 사용:
//   node scripts/update-holidays.mjs           # 기본 2023 ~ (현재연도+6)
//   node scripts/update-holidays.mjs 2024 2032 # 연도 범위 명시
//
// 외부 의존성 없음 (Node 내장 fetch + 자체 iCal 파서).

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname  = fileURLToPath(new URL('.', import.meta.url))
const OUT_FILE   = resolve(__dirname, '..', 'src', 'api', 'holidaysData.js')

const ICAL_URL =
  'https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics'

const now = new Date()
const argYearMin = parseInt(process.argv[2], 10)
const argYearMax = parseInt(process.argv[3], 10)
const YEAR_MIN = Number.isFinite(argYearMin) ? argYearMin : 2023
const YEAR_MAX = Number.isFinite(argYearMax) ? argYearMax : now.getFullYear() + 6

// 피드의 DESCRIPTION 필드가 "공휴일" 로 시작하는 이벤트만 빨간날로 채택.
// Google 이 이미 "공휴일" / "기념일" 로 분류해 두므로 그 메타데이터를 그대로 신뢰한다.
// → 노동절·임시공휴일·선거일은 자동 포함, 어버이날·스승의날·식목일 등 관습 기념일은 자동 제외.
function isHoliday(description) {
  if (!description) return false
  return description.startsWith('공휴일')
}

// Google Calendar 가 쓰는 대체공휴일 표기 "쉬는 날 XXX" → "XXX 대체공휴일"
function normalizeName(name) {
  const m = name.match(/^쉬는 날\s+(.+)$/)
  if (m) return `${m[1]} 대체공휴일`
  return name
}

async function main() {
  console.log(`[holidays] iCal 다운로드: ${ICAL_URL}`)
  const res = await fetch(ICAL_URL, { headers: { 'User-Agent': 'dailydaeng-updater/1.0' } })
  if (!res.ok) throw new Error(`iCal fetch 실패: ${res.status}`)
  const ical = await res.text()

  const events = parseICS(ical)
  console.log(`[holidays] 총 ${events.length}개 이벤트 파싱`)

  // 연도 → [{ month, day, name }] 맵
  const byYear = new Map()
  let skipped = 0
  for (const ev of events) {
    if (!ev.date || !ev.summary) continue
    const y = ev.date.getUTCFullYear()
    if (y < YEAR_MIN || y > YEAR_MAX) continue
    if (!isHoliday(ev.description)) { skipped++; continue }
    const name = normalizeName(ev.summary.trim())
    const m = ev.date.getUTCMonth() + 1
    const d = ev.date.getUTCDate()
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y).push({ month: m, day: d, name })
  }
  console.log(`[holidays] 기념일/비공휴일 제외: ${skipped}개`)

  // 각 연도 내부 정렬 + 동일 (월,일) 중복 이름 병합
  const years = [...byYear.keys()].sort((a, b) => a - b)
  for (const y of years) {
    const list = byYear.get(y)
    list.sort((a, b) => (a.month - b.month) || (a.day - b.day))
    const merged = []
    for (const h of list) {
      const prev = merged[merged.length - 1]
      if (prev && prev.month === h.month && prev.day === h.day) {
        if (!prev.name.includes(h.name)) prev.name = `${prev.name}·${h.name}`
      } else {
        merged.push({ ...h })
      }
    }
    byYear.set(y, merged)
  }

  const code = buildCode(byYear, years)
  writeFileSync(OUT_FILE, code, 'utf8')
  const totalRows = years.reduce((s, y) => s + byYear.get(y).length, 0)
  console.log(`[holidays] ${OUT_FILE}`)
  console.log(`[holidays] ✓ ${years[0]} ~ ${years.at(-1)} / ${years.length}개 연도 / ${totalRows}개 항목 기록`)
}

// ────────── iCal 최소 파서 ──────────
// DTSTART;VALUE=DATE:YYYYMMDD, SUMMARY, DESCRIPTION 을 추출. 폴딩 라인(시작 공백) 재결합.
function parseICS(text) {
  const lines = text.split(/\r?\n/)
  const unfolded = []
  for (const ln of lines) {
    if (ln.startsWith(' ') || ln.startsWith('\t')) {
      if (unfolded.length) unfolded[unfolded.length - 1] += ln.slice(1)
    } else {
      unfolded.push(ln)
    }
  }

  const events = []
  let cur = null
  for (const ln of unfolded) {
    if (ln === 'BEGIN:VEVENT') { cur = {}; continue }
    if (ln === 'END:VEVENT')   { if (cur) events.push(cur); cur = null; continue }
    if (!cur) continue

    if (ln.startsWith('DTSTART')) {
      const m = ln.match(/:(\d{8})(?:T\d+Z?)?$/)
      if (m) {
        const s = m[1]
        const y = parseInt(s.slice(0, 4), 10)
        const mo = parseInt(s.slice(4, 6), 10) - 1
        const d = parseInt(s.slice(6, 8), 10)
        cur.date = new Date(Date.UTC(y, mo, d))
      }
    } else if (ln.startsWith('SUMMARY')) {
      const idx = ln.indexOf(':')
      if (idx >= 0) cur.summary = unescapeICal(ln.slice(idx + 1))
    } else if (ln.startsWith('DESCRIPTION')) {
      const idx = ln.indexOf(':')
      if (idx >= 0) cur.description = unescapeICal(ln.slice(idx + 1))
    }
  }
  return events
}

function unescapeICal(s) {
  return s.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

// ────────── holidaysData.js 코드 생성 ──────────
function buildCode(byYear, years) {
  const lines = []
  lines.push('// 한국 공휴일 정적 데이터')
  lines.push(`// scripts/update-holidays.mjs 가 자동 생성 (최종 갱신: ${new Date().toISOString().slice(0, 10)})`)
  lines.push('// 소스: Google Calendar "대한민국의 휴일" 공개 iCal 피드')
  lines.push('// 수동 보정이 필요하면 스크립트 재실행 대신 이 파일을 직접 수정 후 재배포.')
  lines.push('')
  lines.push('export const HOLIDAYS = {')
  for (const y of years) {
    lines.push(`  ${y}: [`)
    for (const h of byYear.get(y)) {
      const name = JSON.stringify(h.name)
      lines.push(`    { month: ${String(h.month).padStart(2, ' ')}, day: ${String(h.day).padStart(2, ' ')}, name: ${name} },`)
    }
    lines.push('  ],')
  }
  lines.push('}')
  lines.push('')
  return lines.join('\n')
}

main().catch(err => {
  console.error('[holidays] 실패:', err)
  process.exit(1)
})
