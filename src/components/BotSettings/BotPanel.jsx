import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../../api/settings'
import { HOUR_OPTIONS, MINUTE_OPTIONS } from '../../utils/dateUtils'
import { DEFAULT_NOTIFIER, normalizeNotifier } from '../../utils/notifier'
import { CloverIcon, HeartIcon } from '../icons/NotifierIcons'

export default function BotPanel({ onClose }) {
  const [notifier, setNotifier] = useState(DEFAULT_NOTIFIER)

  useEffect(() => {
    getSettings()
      .then(s => setNotifier(normalizeNotifier(s?.notifier)))
      .catch(() => {})
  }, [])

  const update = async (patch) => {
    const next = { ...notifier, ...patch }
    setNotifier(next)
    await saveSettings({ notifier: next }).catch(() => {})
  }

  const toggleKind = async (kind) => {
    const sub = notifier[kind] || {}
    const nextSub = { ...sub, enabled: !sub.enabled }
    await update({ [kind]: nextSub })
  }

  const anyEnabled = notifier.schedule?.enabled || notifier.dday?.enabled

  return (
    <div className="animate-fade-in"
         style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(0,0,0,0.35)',
                  display:'flex', alignItems:'flex-end' }}
         onClick={onClose}>
      <div className="animate-slide-up" onClick={e => e.stopPropagation()}
           style={{ width:'100%', background:'var(--color-surface)',
                    borderRadius:'20px 20px 0 0',
                    padding:'0 0 max(env(safe-area-inset-bottom), 20px)',
                    boxShadow:'0 -4px 20px rgba(0,0,0,0.12)' }}>

        <div style={{ display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:2 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--color-border)' }} />
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'8px 18px 12px', borderBottom:'1px solid var(--color-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{
              width:24, height:24, borderRadius:6, overflow:'hidden', flexShrink:0,
              background:'#EAE9E9', display:'inline-flex', alignItems:'center', justifyContent:'center',
            }}>
              <img src="/alarm/apple-touch-icon.png" alt=""
                   style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            </span>
            <span style={{ fontWeight:900, fontSize:'calc(16px * var(--font-scale))', color:'var(--color-text1)' }}>
              알리미 설정
            </span>
          </div>
          <button onClick={onClose} style={{ fontSize:20, color:'var(--color-text2)', background:'none', border:'none', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>

          <div style={{ fontSize:'calc(11px * var(--font-scale))', color:'var(--color-text2)', lineHeight:1.5 }}>
            매일 이 시각이 되면, 다음에 앱을 열었을 때 오늘의 일정을 한 번 더 확인시켜 드려요. 앱을 직접 열어야 배너가 뜨고, 알림음은 울리지 않습니다.
          </div>

          {/* 공유 알림 시각 */}
          <div style={{ padding:'12px 14px', borderRadius:12,
                        background:'var(--color-bg)', border:'1px solid var(--color-border)',
                        display:'flex', alignItems:'center', gap:10,
                        opacity: anyEnabled ? 1 : 0.55,
                        transition:'opacity 0.15s' }}>
            <span style={{ fontSize:'calc(12px * var(--font-scale))', color:'var(--color-text2)', flexShrink:0 }}>
              알림 시각
            </span>
            <WheelSelect value={notifier.hour}
                         onChange={v => update({ hour: v })}
                         options={HOUR_OPTIONS} width={62} />
            <span style={{ fontSize:'calc(13px * var(--font-scale))', color:'var(--color-text1)' }}>:</span>
            <WheelSelect value={notifier.minute}
                         onChange={v => update({ minute: v })}
                         options={MINUTE_OPTIONS} width={62} />
          </div>

          {/* 개인 일정 알림 */}
          <NotifierRow
            icon={<CloverIcon size={22} />}
            iconBg="#DCFCE7"
            title="개인 일정 알림"
            desc="일정이 있는 날 첫 진입에 배너 표시"
            enabled={!!notifier.schedule?.enabled}
            onToggle={() => toggleKind('schedule')}
          />

          {/* D-Day 알림 */}
          <NotifierRow
            icon={<HeartIcon size={22} />}
            iconBg="#FEE2E2"
            title="D-Day 알림"
            desc="D-Day 당일 첫 진입에 배너 표시"
            enabled={!!notifier.dday?.enabled}
            onToggle={() => toggleKind('dday')}
          />
        </div>
      </div>
    </div>
  )
}

function NotifierRow({ icon, iconBg, title, desc, enabled, onToggle }) {
  return (
    <div style={{
      padding:'12px 14px', borderRadius:12,
      background:'var(--color-bg)', border:'1px solid var(--color-border)',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <span style={{
          width:32, height:32, borderRadius:8, overflow:'hidden', flexShrink:0,
          background: iconBg,
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          border:'1px solid rgba(0,0,0,0.04)',
        }}>
          {icon}
        </span>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'calc(13px * var(--font-scale))', color:'var(--color-text1)' }}>
            {title}
          </div>
          <div style={{ fontSize:'calc(10px * var(--font-scale))', color:'var(--color-text2)', marginTop:2,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {desc}
          </div>
        </div>
      </div>
      <Toggle on={enabled} onToggle={onToggle} />
    </div>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle}
            style={{ width:46, height:26, borderRadius:13,
                     background: on ? 'var(--color-primary)' : 'var(--color-border)',
                     border:'none', cursor:'pointer', position:'relative',
                     transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left: on ? 22 : 3,
                    width:20, height:20, borderRadius:'50%', background:'#fff',
                    boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.2s' }} />
    </button>
  )
}

function WheelSelect({ value, onChange, options, width = 62 }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width, flexShrink: 0,
        padding: '10px 4px',
        borderRadius: 10,
        border: '1.5px solid var(--color-border)',
        background: 'var(--color-surface)',
        color: 'var(--color-text1)',
        fontSize: `calc(14px * var(--font-scale))`,
        outline: 'none',
        textAlign: 'center',
        appearance: 'auto',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {options.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  )
}
