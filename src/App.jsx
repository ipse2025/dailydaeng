import { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import './styles/globals.css'

import { useCalendar }     from './hooks/useCalendar'
import { useEntries }      from './hooks/useEntries'
import { useHolidays }     from './hooks/useHolidays'
import { useShiftPattern } from './hooks/useShiftPattern'
import { useSettings }     from './hooks/useSettings'
import { useTelegramSDK }  from './hooks/useTelegramSDK'
import { buildCalendarGrid, normalizeExpenseItems, normalizeScheduleItems, toDateKey, formatScheduleItem } from './utils/dateUtils'
import { getEntryByKey }   from './api/entries'
import { normalizeNotifier } from './utils/notifier'
import { calcDDay }        from './utils/ddayCalc'
import { useDDays }        from './hooks/useDDays'

import CalendarGrid         from './components/Calendar/CalendarGrid'
import MonthYearPicker      from './components/Calendar/MonthYearPicker'
import EntryModal           from './components/Entry/EntryModal'
import SettingsPanel        from './components/Settings/SettingsPanel'
import ShiftSetupPanel      from './components/Shift/ShiftSetupPanel'
import BotPanel             from './components/BotSettings/BotPanel'
import WeeklyExpensesModal  from './components/Expense/WeeklyExpensesModal'
import MonthlyExpensesModal from './components/Expense/MonthlyExpensesModal'
import InAppBanner          from './components/Notifier/InAppBanner'
import DDayDrawer           from './components/DDay/DDayDrawer'
import BackupButton         from './components/Backup/BackupButton'
import BackgroundLayer      from './components/Background/BackgroundLayer'
import { useBgImage }       from './hooks/useBgImage'
import { CloverIcon, HeartIcon } from './components/icons/NotifierIcons'

export default function App() {
  const { haptic }                   = useTelegramSDK()
  const { year, month, goTo, goPrev, goNext } = useCalendar()
  const { holidays }                 = useHolidays(year, month)
  const { entries, updateEntry, getEntry, getWeekStats } = useEntries(year, month)
  const { shiftMap, shiftConfig, applyShift } = useShiftPattern(year, month, holidays)
  const { settings, updateSettings } = useSettings()
  const { ddays } = useDDays()
  const { bgImage } = useBgImage()

  const weeks = buildCalendarGrid(year, month)

  const [activeCell,   setActiveCell]   = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showShift,    setShowShift]    = useState(false)
  const [showPicker,   setShowPicker]   = useState(false)
  const [showBot,      setShowBot]      = useState(false)
  const [showDDay,     setShowDDay]     = useState(false)
  const [weekDetail,   setWeekDetail]   = useState(null)   // { weekNum, weekDays }
  const [showMonthly,  setShowMonthly]  = useState(false)
  // 두 종류 배너 독립 상태
  const [scheduleBanner, setScheduleBanner] = useState(null)  // string[] | null
  const [ddayBanner,     setDDayBanner]     = useState(null)  // string[] | null

  // 인앱 배너 노출 판단: 알리미 enabled + 지정 시각 경과 + dismiss 안 함 + 오늘 대상 존재
  useEffect(() => {
    let mounted = true
    const check = async () => {
      const n = normalizeNotifier(settings?.notifier)
      const now = dayjs()
      const h = parseInt(n.hour, 10)
      const m = parseInt(n.minute, 10)
      if (Number.isNaN(h) || Number.isNaN(m)) {
        if (mounted) { setScheduleBanner(null); setDDayBanner(null) }
        return
      }
      const alarmTime = now.hour(h).minute(m).second(0).millisecond(0)
      const afterAlarm = !now.isBefore(alarmTime)
      const today = toDateKey(now.year(), now.month()+1, now.date())

      // 개인 일정 알림
      if (n.schedule.enabled && afterAlarm && n.schedule.dismissedDate !== today) {
        const entry = await getEntryByKey(today)
        const items = normalizeScheduleItems(entry || {})
        const lines = items.map(formatScheduleItem).filter(Boolean)
        if (mounted) setScheduleBanner(lines.length > 0 ? lines : null)
      } else if (mounted) {
        setScheduleBanner(null)
      }

      // D-Day 알림 (오늘이 D-DAY인 항목)
      if (n.dday.enabled && afterAlarm && n.dday.dismissedDate !== today) {
        const todayItems = (ddays || []).filter(d => calcDDay(d) === 0)
        if (mounted) setDDayBanner(todayItems.length > 0 ? todayItems.map(d => d.label || '(이름 없음)') : null)
      } else if (mounted) {
        setDDayBanner(null)
      }
    }
    check()
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { mounted = false; document.removeEventListener('visibilitychange', onVis) }
  }, [settings, entries, ddays])

  const dismissKind = async (kind, setter) => {
    setter(null)
    const now = dayjs()
    const today = toDateKey(now.year(), now.month()+1, now.date())
    const cur = normalizeNotifier(settings?.notifier)
    await updateSettings({ notifier: { ...cur, [kind]: { ...cur[kind], dismissedDate: today } } })
  }
  const dismissScheduleBanner = () => dismissKind('schedule', setScheduleBanner)
  const dismissDDayBanner     = () => dismissKind('dday',     setDDayBanner)

  const handleCellTap = (cell) => { haptic('light'); setActiveCell(cell) }
  const handleSaveEntry = async (fields) => {
    await updateEntry(activeCell.year, activeCell.month, activeCell.day, fields)
    setActiveCell(null)
  }
  const closeDropdowns = () => { setShowShift(false); setShowPicker(false) }

  // 월간 총 지출 (헤더 $ 버튼 아래 표시)
  const monthlyTotal = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2,'0')}`
    let total = 0
    Object.values(entries).forEach(e => {
      if (!e.date_key?.startsWith(prefix)) return
      const items = normalizeExpenseItems(e)
      items.forEach(it => { total += parseInt(it.amount, 10) || 0 })
    })
    return total
  }, [entries, year, month])

  return (
    <>
    <BackgroundLayer bgImage={bgImage} opacity={settings?.bgImageOpacity ?? 0.3} />
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column',
                  background:'transparent', overflow:'hidden',
                  position:'relative', zIndex:10,
                  paddingTop:  'env(safe-area-inset-top)',
                  paddingLeft: 'env(safe-area-inset-left)',
                  paddingRight:'env(safe-area-inset-right)',
                  paddingBottom:'max(env(safe-area-inset-bottom), 20px)' }}>

      {/* ── 헤더 ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 12px', background:'var(--color-surface)',
        borderBottom:'1px solid var(--color-border)', flexShrink:0,
        position:'relative', zIndex:20,
      }}>
        {/* 햄버거 → D-Day 드로어 */}
        <div onClick={() => { haptic(); closeDropdowns(); setShowDDay(true) }}
             aria-label="D-Day 열기"
             style={{ display:'flex', flexDirection:'column', gap:5,
                      cursor:'pointer', padding:'4px 2px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:19, height:2.5, borderRadius:2, background:'var(--color-text1)' }} />
          ))}
        </div>

        {/* 연/월 드롭다운 */}
        <div style={{ position:'relative' }}>
          <button onClick={() => { haptic(); closeDropdowns(); setShowPicker(v=>!v) }}
                  style={{ display:'flex', alignItems:'center', gap:6,
                           background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>
            <span style={{ fontWeight:900, fontSize:`calc(19px * var(--font-scale))`, color:'var(--color-text1)' }}>
              {year}.{String(month).padStart(2,'0')}
            </span>
            <span style={{ color:'var(--color-primary)', fontSize:12 }}>{showPicker?'▲':'▼'}</span>
          </button>
          <div style={{ height:2, background:'var(--color-primary)', opacity:0.2, borderRadius:1 }} />
          {showPicker && (
            <MonthYearPicker year={year} month={month}
              onSelect={(y,m)=>{ goTo(y,m); setShowPicker(false) }}
              onClose={()=>setShowPicker(false)} />
          )}
        </div>

        {/* 우측 버튼 5개 */}
        <div style={{ display:'flex', gap:3, position:'relative' }}>
          <div style={{ position:'relative' }}>
            <Btn bg="var(--color-primary)" onClick={()=>{ haptic(); setShowPicker(false); setShowShift(v=>!v) }}>📅</Btn>
            {showShift && (
              <ShiftSetupPanel shiftConfig={shiftConfig}
                onApply={cfg=>{ applyShift(cfg); setShowShift(false) }}
                onClose={()=>setShowShift(false)} />
            )}
          </div>
          <Btn bg="#9CA3AF" onClick={()=>{ haptic(); closeDropdowns(); setShowSettings(true) }}>⚙</Btn>
          <IconBtn src="/alarm/icon-96.png" alt="알리미 설정"
                   onClick={()=>{ haptic(); closeDropdowns(); setShowBot(true) }} />
          <DollarBtn total={monthlyTotal}
                     onClick={() => { haptic(); closeDropdowns(); setShowMonthly(true) }} />
          <BackupButton haptic={haptic} />
        </div>
      </div>

      {/* ── 달력 + 인앱 배너 ── */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
        <CalendarGrid
          year={year} month={month} weeks={weeks}
          shiftMap={shiftMap} entries={entries} holidays={holidays}
          getWeekStats={getWeekStats}
          onCellTap={handleCellTap} onMonthChange={goTo}
          onSwipePrev={() => { haptic('light'); goPrev() }}
          onSwipeNext={() => { haptic('light'); goNext() }}
          onWeekClick={(weekNum, weekDays) => { haptic('light'); setWeekDetail({ weekNum, weekDays }) }}
        />
        {(scheduleBanner || ddayBanner) && (
          <div style={{ position:'absolute', top:8, left:8, right:8, zIndex:25,
                        display:'flex', flexDirection:'column', gap:6 }}>
            {scheduleBanner && (
              <InAppBanner
                icon={<CloverIcon size={26} />}
                iconBg="#DCFCE7"
                accent="#22C55E"
                title="오늘의 일정"
                lines={scheduleBanner}
                count={scheduleBanner.length}
                onDismiss={dismissScheduleBanner}
              />
            )}
            {ddayBanner && (
              <InAppBanner
                icon={<HeartIcon size={26} />}
                iconBg="#FEE2E2"
                accent="#EF4444"
                title="오늘의 D-Day"
                lines={ddayBanner}
                count={ddayBanner.length}
                onDismiss={dismissDDayBanner}
              />
            )}
          </div>
        )}
      </div>

      {/* ── 모달·패널 ── */}
      {activeCell && (
        <EntryModal date={activeCell}
          entry={getEntry(activeCell.year, activeCell.month, activeCell.day)}
          onSave={handleSaveEntry} onClose={()=>setActiveCell(null)} />
      )}
      {showSettings && (
        <SettingsPanel settings={settings} onUpdate={updateSettings} onClose={()=>setShowSettings(false)} />
      )}
      {showBot && <BotPanel onClose={()=>setShowBot(false)} />}
      {showDDay && <DDayDrawer onClose={()=>setShowDDay(false)} />}
      {weekDetail && (
        <WeeklyExpensesModal
          weekNum={weekDetail.weekNum}
          weekDays={weekDetail.weekDays}
          entries={entries}
          onClose={() => setWeekDetail(null)}
        />
      )}
      {showMonthly && (
        <MonthlyExpensesModal
          year={year} month={month} entries={entries}
          onClose={() => setShowMonthly(false)}
        />
      )}

      {/* 드롭다운 외부 닫기 레이어 */}
      {(showShift||showPicker) && (
        <div style={{ position:'fixed', inset:0, zIndex:15 }} onClick={closeDropdowns} />
      )}
    </div>
    </>
  )
}

function Btn({ bg, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width:28, height:28, borderRadius:7, background:bg, color:'#fff',
      border:'none', cursor:'pointer', fontSize:14,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Noto Sans KR',sans-serif", flexShrink:0,
    }}>{children}</button>
  )
}

function IconBtn({ src, alt, onClick }) {
  return (
    <button onClick={onClick} aria-label={alt} style={{
      width:28, height:28, borderRadius:7,
      background:'#EAE9E9', border:'1px solid rgba(0,0,0,0.08)',
      cursor:'pointer', padding:0, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
    }}>
      <img src={src} alt=""
           style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
    </button>
  )
}

function DollarBtn({ total, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:28, height:28, borderRadius:7, background:'#F59E0B', color:'#fff',
      border:'none', cursor:'pointer',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:"'Noto Sans KR',sans-serif", flexShrink:0, lineHeight:1, gap:1,
      padding: 0,
    }}>
      <span style={{ fontSize:13, fontWeight:900 }}>$</span>
      <span style={{ fontSize:6, fontWeight:700 }}>{shortTotal(total)}</span>
    </button>
  )
}

function shortTotal(n) {
  if (!n) return '0'
  if (n >= 10000) {
    const man = n / 10000
    return man >= 10 ? `${Math.floor(man)}만` : `${Math.round(man*10)/10}만`
  }
  if (n >= 1000) return `${Math.round(n/100)/10}천`
  return `${n}`
}
