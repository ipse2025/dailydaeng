// 배경 이미지 저장/로드 (localStorage dataURL)
// - 원본 파일과 분리 (앱 내부에 픽셀 데이터 자체 보존)
// - 캔버스로 자동 리사이즈 + JPEG 압축 (대략 200~500KB)
// - 백업 제외 키 (backupSchema.js BLACKLIST_KEYS 와 동기화 필요)

export const BG_IMAGE_KEY = 'dailydaeng.bgImage'

const MAX_DIM = 1920          // 가장 긴 변 기준 px
const JPEG_QUALITY = 0.85

// File → 리사이즈/압축 → dataURL
export async function fileToCompressedDataUrl(file) {
  if (!file) throw new Error('파일이 없습니다.')
  if (!file.type?.startsWith('image/')) throw new Error('이미지 파일만 선택 가능합니다.')

  const blobUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(blobUrl)
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_DIM)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
    img.src = src
  })
}

function fitWithin(w, h, maxDim) {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h }
  const ratio = w >= h ? maxDim / w : maxDim / h
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

export function readBgImage() {
  try { return localStorage.getItem(BG_IMAGE_KEY) || null } catch (_) { return null }
}

export function writeBgImage(dataUrl) {
  try { localStorage.setItem(BG_IMAGE_KEY, dataUrl) }
  catch (e) { throw new Error('저장 공간이 부족합니다. 더 작은 이미지를 사용해 주세요.') }
}

export function clearBgImage() {
  try { localStorage.removeItem(BG_IMAGE_KEY) } catch (_) {}
}
