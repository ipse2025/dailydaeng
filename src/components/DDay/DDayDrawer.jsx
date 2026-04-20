import { useState } from 'react'
import dayjs from 'dayjs'
import { useDDays } from '../../hooks/useDDays'
import { calcDDay, formatDDay, calendarLabel, lunarToSolarMD } from '../../utils/ddayCalc'

const CURRENT_YEAR = dayjs().year()
const YEAR_OPTIONS  = Array.from({ length: 21 }, (_, i) => CURRENT_YEAR - 2 + i)    // -2 ~ +18
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAY_OPTIONS   = Array.from({ length: 31 }, (_, i) => i + 1)
const CAL_OPTIONS   = [{ v: 'solar', label: '양력' }, { v: 'lunar', label: '음력' }]

const DEFAULT_FORM = {
  calendar: 'solar',
  year:  CURRENT_YEAR,
  month: dayjs().month() + 1,
  day:   dayjs().date(),
  label: '',
}

export default function DDayDrawer({ onClose }) {
  const { ddays, add, remove } = useDDays()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)

  const resetForm = () => { setForm(DEFAULT_FORM); setShowForm(false) }

  const submit = async () => {
    if (!form.label.trim()) { window.alert('이름을 입력해 주세요'); return }
    const days = calcDDay(form)
    if (days === null) { window.alert('날짜가 올바르지 않아요 (음력 범위 확인)'); return }
    await add(form)
    resetForm()
  }

  return (
    <div className="animate-fade-in"
         style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.35)',
                  display:'flex' }}
         onClick={onClose}>

      <aside className="animate-slide-in-left" onClick={e => e.stopPropagation()}
             style={{
               width:'min(86vw, 320px)', height:'100%',
               background:'var(--color-surface)',
               boxShadow:'4px 0 20px rgba(0,0,0,0.15)',
               display:'flex', flexDirection:'column',
               paddingTop:   'env(safe-area-inset-top)',
               paddingBottom:'max(env(safe-area-inset-bottom), 16px)',
               paddingLeft:  'env(safe-area-inset-left)',
             }}>

        {/* 헤더 */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 16px', borderBottom:'1px solid var(--color-border)',
        }}>
          <span style={{ fontWeight:900, fontSize:'calc(16px * var(--font-scale))', color:'var(--color-text1)' }}>
            📆 D-Day
          </span>
          <button onClick={onClose}
                  style={{ fontSize:20, background:'none', border:'none', cursor:'pointer',
                           color:'var(--color-text2)', padding:4 }}>✕</button>
        </div>

        {/* 목록 + 추가 영역 */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 18px',
                      display:'flex', flexDirection:'column', gap:10 }}>

          {ddays.length === 0 && !showForm && (
            <div style={{ textAlign:'center', color:'var(--color-text2)',
                          fontSize:'calc(12px * var(--font-scale))', padding:'24px 8px', lineHeight:1.5 }}>
              등록된 D-Day 가 없어요.<br/>아래 <b>+ 추가</b>를 눌러 새로 만들어 보세요.
            </div>
          )}

          {ddays.map(d => <DDayRow key={d.id} item={d} onRemove={() => remove(d.id)} />)}

          {!showForm && (
            <button onClick={() => setShowForm(true)}
                    style={{
                      marginTop:4, padding:'12px 0', borderRadius:12,
                      border:'1.5px dashed var(--color-primary)',
                      background:'transparent', color:'var(--color-primary)',
                      fontWeight:700, fontSize:'calc(13px * var(--font-scale))',
                      cursor:'pointer',
                    }}>
              + 추가
            </button>
          )}

          {showForm && (
            <DDayForm form={form} setForm={setForm}
                      onCancel={resetForm} onSubmit={submit} />
          )}
        </div>
      </aside>
    </div>
  )
}

function DDayRow({ item, onRemove }) {
  const days = calcDDay(item)
  const label = formatDDay(days)
  const isPast = days !== null && days < 0
  const isToday = days === 0

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'10px 12px', borderRadius:12,
      background:'var(--color-bg)', border:'1px solid var(--color-border)',
    }}>
      <div style={{
        minWidth:58, textAlign:'center',
        padding:'4px 0', borderRadius:8,
        background: isToday ? 'var(--color-primary)' : (isPast ? 'var(--color-border)' : 'var(--color-primary)'),
        color: isToday ? '#fff' : (isPast ? 'var(--color-text2)' : '#fff'),
        fontWeight:900, fontSize:'calc(13px * var(--font-scale))',
        opacity: isPast ? 0.7 : 1,
      }}>
        {label}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontWeight:700, fontSize:'calc(13px * var(--font-scale))', color:'var(--color-text1)',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {item.label || '(이름 없음)'}
        </div>
        <div style={{ fontSize:'calc(10px * var(--font-scale))', color:'var(--color-text2)', marginTop:2 }}>
          {calendarLabel(item.calendar)} {item.year}.{String(item.month).padStart(2,'0')}.{String(item.day).padStart(2,'0')}
          {item.calendar === 'lunar' && (() => {
            const s = lunarToSolarMD(item.year, item.month, item.day)
            if (!s) return null
            return (
              <span style={{ marginLeft:6, color:'var(--color-text3)' }}>
                (양력 {String(s.month).padStart(2,'0')}. {String(s.day).padStart(2,'0')})
              </span>
            )
          })()}
        </div>
      </div>
      <button onClick={onRemove} aria-label="삭제"
              style={{
                width:28, height:28, borderRadius:'50%',
                border:'1.5px solid var(--color-border)',
                background:'var(--color-surface)',
                color:'var(--color-text2)', fontSize:18, fontWeight:700, lineHeight:1,
                cursor:'pointer', padding:0,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>−</button>
    </div>
  )
}

function DDayForm({ form, setForm, onCancel, onSubmit }) {
  const set = (patch) => setForm(prev => ({ ...prev, ...patch }))

  return (
    <div style={{
      padding:12, borderRadius:12,
      background:'var(--color-bg)', border:'1px solid var(--color-border)',
      display:'flex', flexDirection:'column', gap:10,
    }}>
      <div style={{ display:'flex', gap:4, flexWrap:'nowrap' }}>
        <Wheel value={form.year} onChange={v => set({ year: Number(v) })}
               options={YEAR_OPTIONS} width={62} />
        <Wheel value={form.month} onChange={v => set({ month: Number(v) })}
               options={MONTH_OPTIONS} width={48} />
        <Wheel value={form.day} onChange={v => set({ day: Number(v) })}
               options={DAY_OPTIONS} width={48} />
        <Wheel value={form.calendar} onChange={v => set({ calendar: v })}
               options={CAL_OPTIONS.map(o => o.v)}
               render={v => CAL_OPTIONS.find(o => o.v === v)?.label}
               width={60} />
      </div>

      <input
        type="text" value={form.label} maxLength={30}
        onChange={e => set({ label: e.target.value })}
        placeholder="이름 (예: 크리스마스)"
        style={{
          width:'100%', padding:'10px 12px', borderRadius:10,
          border:'1.5px solid var(--color-border)',
          background:'var(--color-surface)', color:'var(--color-text1)',
          fontSize:'calc(13px * var(--font-scale))',
          fontFamily:"'Noto Sans KR', sans-serif", outline:'none',
        }}
      />

      <div style={{ display:'flex', gap:8, marginTop:2 }}>
        <button onClick={onCancel}
                style={{
                  flex:1, padding:'10px 0', borderRadius:10,
                  border:'1.5px solid var(--color-border)',
                  background:'var(--color-surface)', color:'var(--color-text2)',
                  fontWeight:600, fontSize:'calc(13px * var(--font-scale))',
                  cursor:'pointer',
                }}>
          취소
        </button>
        <button onClick={onSubmit}
                style={{
                  flex:1, padding:'10px 0', borderRadius:10,
                  border:'none', background:'var(--color-primary)', color:'#fff',
                  fontWeight:700, fontSize:'calc(13px * var(--font-scale))',
                  cursor:'pointer',
                }}>
          저장
        </button>
      </div>
    </div>
  )
}

function Wheel({ value, onChange, options, render, width = 60 }) {
  return (
    <select value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              width, padding:'10px 2px', flexShrink:0,
              borderRadius:10,
              border:'1.5px solid var(--color-border)',
              background:'var(--color-surface)', color:'var(--color-text1)',
              fontSize:'calc(13px * var(--font-scale))', textAlign:'center',
              fontFamily:"'Noto Sans KR', sans-serif", outline:'none',
            }}>
      {options.map(o => <option key={o} value={o}>{render ? render(o) : o}</option>)}
    </select>
  )
}
