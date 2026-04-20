import { HOLIDAYS } from './holidaysData'

// 공휴일 조회 (정적 데이터)
export const getHolidays = async (year, month) => {
  const list = HOLIDAYS[year] || []
  return list
    .filter(h => h.month === month)
    .map(h => ({ year, month: h.month, day: h.day, name: h.name }))
}
