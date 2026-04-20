import { useState, useEffect, useCallback } from 'react'
import { getDDays, addDDay, removeDDay } from '../api/ddays'

export function useDDays() {
  const [ddays, setDDays] = useState([])

  useEffect(() => {
    getDDays().then(setDDays).catch(() => {})
  }, [])

  const add = useCallback(async (payload) => {
    const created = await addDDay(payload)
    setDDays(prev => [...prev, created])
    return created
  }, [])

  const remove = useCallback(async (id) => {
    await removeDDay(id)
    setDDays(prev => prev.filter(d => d.id !== id))
  }, [])

  return { ddays, add, remove }
}
