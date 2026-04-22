import { useState, useEffect, useCallback } from 'react'
import { readBgImage, writeBgImage, clearBgImage, fileToCompressedDataUrl, BG_IMAGE_KEY } from '../api/bgImage'

export function useBgImage() {
  const [bgImage, setBgImage] = useState(() => readBgImage())

  // 다른 탭/창에서 변경 시 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== BG_IMAGE_KEY) return
      setBgImage(e.newValue || null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setFromFile = useCallback(async (file) => {
    const dataUrl = await fileToCompressedDataUrl(file)
    writeBgImage(dataUrl)
    setBgImage(dataUrl)
    return dataUrl
  }, [])

  const remove = useCallback(() => {
    clearBgImage()
    setBgImage(null)
  }, [])

  return { bgImage, setFromFile, remove }
}
