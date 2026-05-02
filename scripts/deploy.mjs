// DAILY댕 풀 배포 매크로
//   1) 공휴일 데이터 자동 갱신 (scripts/update-holidays.mjs)
//   2) 아이콘 동기화 (predev/prebuild 훅과 동일한 sync-icons)
//   3) production 빌드
//   4) Vercel prod 배포 (vercel CLI 필요, 사전 로그인 상태 가정)
//
// 사용:
//   node scripts/deploy.mjs                # 공휴일 자동 갱신 + 배포
//   node scripts/deploy.mjs --skip-holidays # 기존 holidaysData.js 그대로 사용
//   npm run deploy                          # package.json scripts.deploy 별칭

import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const APP_ROOT  = resolve(__dirname, '..')

const skipHolidays = process.argv.includes('--skip-holidays')

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`)
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: APP_ROOT, ...opts })
  if (r.status !== 0) {
    console.error(`명령 실패 (exit ${r.status}): ${cmd} ${args.join(' ')}`)
    process.exit(r.status ?? 1)
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(' DAILY댕 자동 배포 매크로')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// 1) 공휴일 데이터 갱신
if (skipHolidays) {
  console.log('\n[1/4] 공휴일 갱신 스킵 (--skip-holidays)')
} else {
  console.log('\n[1/4] 공휴일 데이터 자동 갱신')
  run(process.execPath, [resolve(__dirname, 'update-holidays.mjs')])
}

// 2) 아이콘 동기화
console.log('\n[2/4] 아이콘 동기화 (sync-icons)')
run(process.execPath, [resolve(__dirname, 'sync-icons.mjs')])

// 3) Production 빌드
console.log('\n[3/4] Production 빌드')
run('npm', ['run', 'build'])

// 4) Vercel 프로덕션 배포
console.log('\n[4/4] Vercel 프로덕션 배포')
run('vercel', ['--prod', '--yes'])

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(' ✅ 배포 완료: https://dailydaeng-app.vercel.app')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
