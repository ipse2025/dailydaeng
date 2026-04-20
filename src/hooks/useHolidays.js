import { useState, useEffect } from 'react'
import { getHolidays } from '../api/holidays'
import { toDateKey } from '../utils/dateUtils'

export function useHolidays(year, month) {
  const [holidays, setHolidays] = useState({}) // { "2026-03-01": "삼일절" }

  useEffect(() => {
    getHolidays(year, month)
      .then(data => {
        const map = {}
        ;(data || []).forEach(h => {
          map[toDateKey(h.year || year, h.month || month, h.day)] = h.name
        })
        setHolidays(map)
      })
      .catch(() => {})
  }, [year, month])

  return { holidays }
}
