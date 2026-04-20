import { useState, useEffect, useCallback } from 'react'
import { getShiftPattern, saveShiftPattern } from '../api/settings'
import { calcShiftPattern, calcDayShift } from '../utils/shiftCalc'

export function useShiftPattern(year, month, holidays) {
  const [shiftConfig, setShiftConfig] = useState(null)
  // { "2026-03-01": "주", ... }
  const [shiftMap, setShiftMap]       = useState({})

  useEffect(() => {
    getShiftPattern()
      .then(cfg => { if (cfg) setShiftConfig(cfg) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!shiftConfig) return
    let map = {}
    if (shiftConfig.type === 'day') {
      map = calcDayShift(year, month, Object.keys(holidays).map(k => ({ dateKey: k })))
    } else if (shiftConfig.type === 'rotation') {
      map = calcShiftPattern(shiftConfig.pattern, shiftConfig.startDate, year, month)
    }
    setShiftMap(map)
  }, [shiftConfig, year, month, holidays])

  const applyShift = useCallback(async (config) => {
    setShiftConfig(config)
    await saveShiftPattern(config).catch(() => {})
  }, [])

  return { shiftMap, shiftConfig, applyShift }
}
