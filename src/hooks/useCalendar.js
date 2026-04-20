import { useState, useCallback } from 'react'
import dayjs from 'dayjs'

export function useCalendar() {
  const today = dayjs()
  const [year, setYear]   = useState(today.year())
  const [month, setMonth] = useState(today.month() + 1)

  const goPrev = useCallback(() => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }, [month])

  const goNext = useCallback(() => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }, [month])

  const goTo = useCallback((y, m) => {
    setYear(y); setMonth(m)
  }, [])

  return { year, month, goPrev, goNext, goTo }
}
