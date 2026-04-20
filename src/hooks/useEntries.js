import { useState, useEffect, useCallback } from 'react'
import { getEntries, saveEntry } from '../api/entries'
import { toDateKey, normalizeExpenseItems } from '../utils/dateUtils'

export function useEntries(year, month) {
  const [entries, setEntries] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getEntries(year, month)
      .then(data => {
        const map = {}
        ;(data || []).forEach(e => { map[e.date_key] = e })
        setEntries(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year, month])

  const updateEntry = useCallback(async (year, month, day, fields) => {
    const key = toDateKey(year, month, day)
    const updated = { ...entries[key], ...fields, date_key: key }
    setEntries(prev => ({ ...prev, [key]: updated }))
    try {
      await saveEntry(updated)
    } catch {
      setEntries(prev => ({ ...prev, [key]: entries[key] }))
    }
  }, [entries])

  const getEntry = useCallback((year, month, day) => {
    return entries[toDateKey(year, month, day)] || {}
  }, [entries])

  // 주간 통계: 카테고리별 지출 합산
  const getWeekStats = useCallback((weekDays) => {
    const byCat = {}
    let expTotal = 0
    weekDays.forEach(({ year, month, day, isCurrentMonth }) => {
      if (!isCurrentMonth) return
      const e = entries[toDateKey(year, month, day)] || {}
      const items = normalizeExpenseItems(e)
      items.forEach(({ category, amount }) => {
        const amt = parseInt(amount, 10) || 0
        if (!amt) return
        byCat[category] = (byCat[category] || 0) + amt
        expTotal += amt
      })
    })
    return { byCat, expTotal }
  }, [entries])

  return { entries, loading, updateEntry, getEntry, getWeekStats }
}
