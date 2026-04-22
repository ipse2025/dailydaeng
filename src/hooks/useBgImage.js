import { useState, useEffect, useCallback } from 'react'
import {
  readBgImage, writeBgImage, clearBgImage,
  fileToCompressedDataUrl, subscribeBgImage, BG_IMAGE_KEY,
} from '../api/bgImage'

export function useBgImage() {
  const [bgImage, setBgImage] = useState(() => readBgImage())

  useEffect(() => {
    // 같은 탭 안의 다른 useBgImage 인스턴스에서 변경 시 동기화
    const unsub = subscribeBgImage(setBgImage)
    // 다른 탭/창에서 변경 시 동기화
    const onStorage = (e) => {
      if (e.key !== BG_IMAGE_KEY) return
      setBgImage(e.newValue || null)
    }
    window.addEventListener('storage', onStorage)
    return () => {
      unsub()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setFromFile = useCallback(async (file) => {
    const dataUrl = await fileToCompressedDataUrl(file)
    writeBgImage(dataUrl)   // notify() 가 모든 구독자(이 hook 인스턴스 포함) 업데이트
    return dataUrl
  }, [])

  const remove = useCallback(() => {
    clearBgImage()
  }, [])

  return { bgImage, setFromFile, remove }
}
