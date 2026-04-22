import { useState } from 'react'
import {
  HOUR_OPTIONS, MINUTE_OPTIONS,
  EXERCISE_MIN_OPTIONS, EXPENSE_CATEGORIES,
  normalizeScheduleItems, normalizeExpenseItems,
  sumExpenseItems,
} from '../../utils/dateUtils'
import { CloseIcon } from '../icons/AppIcons'

export default function EntryModal({ date, entry, onSave, onClose }) {
  const { year, month, day } = date

  const [scheduleItems, setScheduleItems] = useState(() => {
    const items = normalizeScheduleItems(entry)
    return items.length > 0 ? items : [{ time: '', text: '' }]
  })
  const [exerciseText, setExerciseText] = useState(entry.exercise || '')
  const [exerciseMin,  setExerciseMin]  = useState(entry.exercise_min || 0)
  const [expenseItems, setExpenseItems] = useState(() => {
    const items = normalizeExpenseItems(entry)
    return items.length > 0 ? items : [{ category: EXPENSE_CATEGORIES[0], amount: 0, text: '' }]
  })

  // ── schedule 편집 ────────────────────
  const updateScheduleItem = (i, field, val) => {
    setScheduleItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }
  const addScheduleItem = () => setScheduleItems(prev => [...prev, { time: '', text: '' }])
  const removeScheduleItem = (i) => {
    setScheduleItems(prev => prev.length === 1 ? [{ time: '', text: '' }] : prev.filter((_, idx) => idx !== i))
  }
  const updateScheduleTime = (i, field, val) => {
    // field: 'hour' | 'minute'
    const cur = scheduleItems[i]
    const [h0, m0] = (cur.time || ':').split(':')
    const h = field === 'hour'   ? val : (h0 || '')
    const m = field === 'minute' ? val : (m0 || '')
    const time = (h && m) ? `${h}:${m}` : (h || m ? `${h || '00'}:${m || '00'}` : '')
    updateScheduleItem(i, 'time', time)
  }

  // ── expense 편집 ─────────────────────
  const updateExpenseItem = (i, field, val) => {
    setExpenseItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }
  const addExpenseItem = () => setExpenseItems(prev => [...prev, { category: EXPENSE_CATEGORIES[0], amount: 0, text: '' }])
  const removeExpenseItem = (i) => {
    setExpenseItems(prev => prev.length === 1
      ? [{ category: EXPENSE_CATEGORIES[0], amount: 0, text: '' }]
      : prev.filter((_, idx) => idx !== i))
  }

  const handleSave = () => {
    const cleanSchedule = scheduleItems
      .map(it => ({ time: it.time || '', text: (it.text || '').trim() }))
      .filter(it => it.time || it.text)
    const cleanExpense = expenseItems
      .map(it => ({ category: it.category, amount: parseInt(it.amount, 10) || 0, text: (it.text || '').trim() }))
      .filter(it => it.amount > 0)

    // 레거시 호환을 위해 단일 schedule text 도 작성
    const first = cleanSchedule[0]
    const legacySchedule = first ? (first.time ? `${first.time} ${first.text}` : first.text) : ''
    const legacyExpense = sumExpenseItems(cleanExpense)

    onSave({
      schedule:       legacySchedule,
      schedule_items: cleanSchedule,
      exercise:       exerciseText.trim(),
      exercise_min:   parseInt(exerciseMin, 10) || 0,
      expense:        legacyExpense,
      expense_items:  cleanExpense,
    })
    onClose()
  }

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          padding: '0 0 env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
          maxHeight: '90vh', overflowY: 'auto',
        }}>

        <div style={{ display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:4 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--color-border)' }} />
        </div>

        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'8px 18px 10px',
          borderBottom:'1px solid var(--color-border)',
        }}>
          <span style={{ fontWeight:900, fontSize:`calc(16px * var(--font-scale))`, color:'var(--color-text1)' }}>
            {year}년 {month}월 {day}일
          </span>
          <button onClick={onClose} style={{ color:'var(--color-text2)', background:'none', border:'none', cursor:'pointer', display:'inline-flex', padding:0 }} aria-label="닫기"><CloseIcon size={20} color="var(--color-text2)" /></button>
        </div>

        <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* 일정 (다중) */}
          <Field label="📅 일정" color="#6366F1">
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {scheduleItems.map((it, i) => {
                const [h, m] = (it.time || ':').split(':')
                return (
                  <div key={i} style={{ display:'flex', gap:4, alignItems:'center' }}>
                    <WheelSelect value={h || ''} onChange={v => updateScheduleTime(i, 'hour', v)}
                                 options={HOUR_OPTIONS} placeholder="시" width={58} />
                    <span style={{ color:'var(--color-text2)', fontWeight:700 }}>:</span>
                    <WheelSelect value={m || ''} onChange={v => updateScheduleTime(i, 'minute', v)}
                                 options={MINUTE_OPTIONS} placeholder="분" width={58} />
                    <input
                      value={it.text}
                      onChange={e => updateScheduleItem(i, 'text', e.target.value)}
                      placeholder="예: 치과"
                      style={{ ...inputStyle, flex:1 }}
                    />
                    <IconButton onClick={() => removeScheduleItem(i)} label="−" color="#EF4444" />
                  </div>
                )
              })}
              <button type="button" onClick={addScheduleItem} style={addBtnStyle}>＋ 일정 추가</button>
            </div>
          </Field>

          {/* 운동 (단일, 소요시간 10분 단위 휠) */}
          <Field label="🏃 운동" color="#10B981">
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <WheelSelect
                value={String(exerciseMin)}
                onChange={v => setExerciseMin(parseInt(v, 10) || 0)}
                options={EXERCISE_MIN_OPTIONS.map(m => String(m))}
                renderLabel={v => v === '0' ? '분' : `${v}분`}
                placeholder="분"
                width={82}
              />
              <input
                value={exerciseText}
                onChange={e => setExerciseText(e.target.value)}
                placeholder="예: 런닝 5km"
                style={{ ...inputStyle, flex:1 }}
              />
              <IconButton
                onClick={() => { setExerciseText(''); setExerciseMin(0) }}
                label="−" color="#EF4444"
              />
            </div>
          </Field>

          {/* 지출 (다중, 카테고리 드롭다운) */}
          <Field label="💰 지출" color="#F59E0B">
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {expenseItems.map((it, i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', gap:4,
                                       padding:'6px', borderRadius:10,
                                       background:'var(--color-bg)', border:'1px solid var(--color-border)' }}>
                  <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    <select
                      value={it.category}
                      onChange={e => updateExpenseItem(i, 'category', e.target.value)}
                      style={{ ...inputStyle, width: 108, flexShrink: 0, padding:'10px 4px', background:'var(--color-surface)' }}
                    >
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div style={{ flex:1, position:'relative' }}>
                      <input
                        value={it.amount ? String(it.amount) : ''}
                        onChange={e => updateExpenseItem(i, 'amount', e.target.value.replace(/[^0-9]/g,''))}
                        placeholder="0"
                        inputMode="numeric"
                        style={{ ...inputStyle, paddingRight: 28, background:'var(--color-surface)' }}
                      />
                      <span style={{
                        position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                        color:'var(--color-text2)', fontSize:`calc(13px * var(--font-scale))`,
                      }}>원</span>
                    </div>
                    <IconButton onClick={() => removeExpenseItem(i)} label="−" color="#EF4444" />
                  </div>
                  <input
                    value={it.text || ''}
                    onChange={e => updateExpenseItem(i, 'text', e.target.value)}
                    placeholder="세부내용 (예: 다이소)"
                    style={{ ...inputStyle, padding:'8px 12px', fontSize:`calc(13px * var(--font-scale))`, background:'var(--color-surface)' }}
                  />
                </div>
              ))}
              <button type="button" onClick={addExpenseItem} style={addBtnStyle}>＋ 지출 추가</button>
              {sumExpenseItems(expenseItems) > 0 && (
                <div style={{ fontSize:`calc(11px * var(--font-scale))`, color:'#F59E0B', marginTop:3, paddingLeft:2 }}>
                  합계 {sumExpenseItems(expenseItems).toLocaleString()}원
                </div>
              )}
            </div>
          </Field>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            style={{
              width:'100%', padding:'13px 0', borderRadius:12,
              background:'var(--color-primary)', color:'#fff',
              fontWeight:700, fontSize:`calc(15px * var(--font-scale))`,
              border:'none', cursor:'pointer', marginTop:4,
            }}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, color, children }) {
  return (
    <div>
      <label style={{
        display:'block', marginBottom:6,
        fontWeight:700, fontSize:`calc(13px * var(--font-scale))`,
        color,
      }}>{label}</label>
      {children}
    </div>
  )
}

function WheelSelect({ value, onChange, options, placeholder, width = 70, renderLabel }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...inputStyle,
        width,
        flexShrink: 0,
        padding: '10px 4px',
        appearance: 'auto',
        textAlign: 'center',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(t => (
        <option key={t} value={t}>{renderLabel ? renderLabel(t) : t}</option>
      ))}
    </select>
  )
}

function IconButton({ onClick, label, color }) {
  return (
    <button type="button" onClick={onClick}
            style={{
              width:30, height:38, borderRadius:8, flexShrink:0,
              background:'transparent', border:`1.5px solid ${color}`,
              color, fontWeight:900, fontSize:18, lineHeight:1,
              cursor:'pointer',
            }}>
      {label}
    </button>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text1)',
  fontSize: `calc(14px * var(--font-scale))`,
  outline: 'none',
  fontFamily: "'Noto Sans KR', sans-serif",
}

const addBtnStyle = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1.5px dashed var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text2)',
  fontWeight: 600,
  fontSize: `calc(12px * var(--font-scale))`,
  cursor: 'pointer',
  alignSelf: 'flex-start',
}
