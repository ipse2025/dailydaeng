import { useState, useRef } from 'react'
import { THEMES, BG_THEMES, FONT_SCALES } from '../../styles/theme'
import { useBgImage } from '../../hooks/useBgImage'

const SHIFT_TYPES = ['주','야','비','휴']
const SHIFT_LABELS = { '주':'주간','야':'야간','비':'비번','휴':'휴무' }

export default function SettingsPanel({ settings, onUpdate, onClose }) {
  const [local, setLocal] = useState({ ...settings })
  const { bgImage, setFromFile, remove: removeBgImage } = useBgImage()
  const fileInputRef = useRef(null)
  const [bgImageError, setBgImageError] = useState(null)

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }))

  const setBadge = (type, field, val) => {
    setLocal(prev => ({
      ...prev,
      badges: {
        ...prev.badges,
        [type]: { ...prev.badges[type], [field]: val }
      }
    }))
  }

  const handleApply = () => {
    onUpdate(local)
    onClose()
  }

  const opacityPct = Math.round((local.bgImageOpacity ?? 0.3) * 100)
  const handlePickFile = () => fileInputRef.current?.click()
  const handleFileChange = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''   // 같은 파일 재선택 가능하도록
    if (!f) return
    setBgImageError(null)
    try { await setFromFile(f) }
    catch (err) { setBgImageError(err.message) }
  }

  return (
    <div className="animate-fade-in"
         style={{
           position:'fixed', inset:0, zIndex:80,
           background:'rgba(0,0,0,0.35)',
           display:'flex', justifyContent:'flex-end',
         }}
         onClick={onClose}>
      <div
        className="animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          width:'min(280px,90vw)', height:'100%',
          background:'var(--color-surface)',
          overflowY:'auto', padding:'0 0 24px',
          boxShadow:'-4px 0 20px rgba(0,0,0,0.12)',
        }}>

        {/* 헤더 */}
        <div style={{
          background:'#1E293B', padding:'16px 16px 14px',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontWeight:700, color:'#fff', fontSize:`calc(14px * var(--font-scale))` }}>⚙ 화면 설정</span>
          <button onClick={onClose} style={{ color:'#94A3B8', background:'none', border:'none', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'14px 14px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* 버튼 색깔 */}
          <Section title="버튼 색깔">
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {Object.entries(THEMES).map(([key, t]) => (
                <button key={key} onClick={() => set('primaryColor', t.primary)}
                        style={{
                          width:28, height:28, borderRadius:'50%',
                          background: t.primary, border:'none', cursor:'pointer',
                          outline: local.primaryColor===t.primary ? `3px solid ${t.primary}` : '2px solid transparent',
                          outlineOffset: 2,
                        }} title={t.label} />
              ))}
            </div>
          </Section>

          <Divider />

          {/* 배경색 */}
          <Section title="배경색">
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.entries(BG_THEMES).map(([key, t]) => (
                <button key={key} onClick={() => set('bgTheme', key)}
                        style={{
                          width:34, height:22, borderRadius:6,
                          background: t.bg,
                          border: `2px solid ${local.bgTheme===key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          cursor:'pointer',
                        }} title={t.label} />
              ))}
            </div>
          </Section>

          <Divider />

          {/* 배경 이미지 */}
          <Section title="배경 이미지">
            {bgImage && (
              <div style={{
                width:'100%', aspectRatio:'16/10', borderRadius:8,
                marginBottom:8, overflow:'hidden',
                border:'1px solid var(--color-border)',
                backgroundImage:`url(${bgImage})`,
                backgroundSize:'cover', backgroundPosition:'center',
              }} />
            )}
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              <button onClick={handlePickFile} style={imgBtnStyle('var(--color-primary)', '#fff', 1)}>
                📷 {bgImage ? '이미지 변경' : '이미지 선택'}
              </button>
              {bgImage && (
                <button onClick={() => { removeBgImage(); setBgImageError(null) }}
                        style={imgBtnStyle('#EF4444', '#fff', 0)}>
                  ✕ 제거
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*"
                   onChange={handleFileChange} style={{ display:'none' }} />

            {bgImageError && (
              <div style={{ fontSize:11, color:'#EF4444', marginBottom:8 }}>
                {bgImageError}
              </div>
            )}

            {/* 투명도 */}
            <div style={{ marginTop:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                            fontSize:`calc(11px * var(--font-scale))`,
                            color:'var(--color-text2)', marginBottom:4 }}>
                <span>투명도</span>
                <span style={{ fontWeight:700, color:'var(--color-text1)' }}>{opacityPct}%</span>
              </div>
              <input
                type="range" min={10} max={100} step={5}
                value={opacityPct}
                onChange={e => set('bgImageOpacity', parseInt(e.target.value, 10) / 100)}
                style={{ width:'100%', accentColor:'var(--color-primary)' }}
              />
              <div style={{ display:'flex', justifyContent:'space-between',
                            fontSize:10, color:'var(--color-text3)', marginTop:2 }}>
                <span>10%</span><span>100%</span>
              </div>
            </div>
          </Section>

          <Divider />

          {/* 글자 크기 */}
          <Section title="글자 크기">
            <input
              type="range" min={0} max={3} step={1}
              value={FONT_SCALES.findIndex(f => f.value === local.fontScale)}
              onChange={e => set('fontScale', FONT_SCALES[e.target.value].value)}
              style={{ width:'100%', accentColor:'var(--color-primary)' }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              {FONT_SCALES.map(f => (
                <span key={f.label} style={{
                  fontSize:10, color: local.fontScale===f.value ? 'var(--color-primary)' : 'var(--color-text3)'
                }}>{f.label}</span>
              ))}
            </div>
          </Section>

          <Divider />

          {/* 근무 뱃지 스타일 */}
          <Section title="근무 뱃지 스타일">
            {SHIFT_TYPES.map(type => {
              const cfg = local.badges?.[type] || {}
              return (
                <div key={type} style={{
                  padding:'10px 10px', borderRadius:10, marginBottom:8,
                  background:'var(--color-bg)',
                  border:'1px solid var(--color-border)',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    {/* 뱃지 미리보기 */}
                    <div className={`shift-badge ${type}`} style={{ width:26, height:26, fontSize:13 }}>{type}</div>
                    <span style={{ fontWeight:700, fontSize:`calc(12px * var(--font-scale))`, color:'var(--color-text1)' }}>
                      {SHIFT_LABELS[type]}
                    </span>
                  </div>

                  {/* 배경색 */}
                  <Row label="배경색">
                    <input type="color" value={cfg.fill||'#888888'}
                           onChange={e => setBadge(type,'fill',e.target.value)}
                           style={colorPickerStyle} />
                  </Row>
                  {/* 글자색 */}
                  <Row label="글자색">
                    <input type="color" value={cfg.text||'#FFFFFF'}
                           onChange={e => setBadge(type,'text',e.target.value)}
                           style={colorPickerStyle} />
                  </Row>
                  {/* 외곽선 색 */}
                  <Row label="외곽선 색">
                    <input type="color" value={cfg.outline||'#000000'}
                           onChange={e => setBadge(type,'outline',e.target.value)}
                           style={colorPickerStyle} />
                  </Row>
                  {/* 외곽선 굵기 — 0.5 ~ 2.0 pt, 0.5 단위 스테퍼 */}
                  <Row label="외곽선 굵기">
                    <Stepper value={cfg.outlineW ?? 0.5} min={0.5} max={2.0} step={0.5}
                             onChange={v => setBadge(type,'outlineW',v)} />
                  </Row>
                </div>
              )
            })}
          </Section>

          {/* 적용 버튼 */}
          <button onClick={handleApply} style={{
            width:'100%', padding:'13px 0', borderRadius:12,
            background:'var(--color-primary)', color:'#fff',
            fontWeight:700, fontSize:`calc(15px * var(--font-scale))`,
            border:'none', cursor:'pointer',
          }}>
            설정 적용
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontWeight:700, fontSize:`calc(12px * var(--font-scale))`, color:'var(--color-text1)', marginBottom:8 }}>{title}</div>
      {children}
    </div>
  )
}
function Divider() {
  return <div style={{ height:1, background:'var(--color-border)' }} />
}
function Row({ label, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, gap:8 }}>
      <span style={{ fontSize:`calc(11px * var(--font-scale))`, color:'var(--color-text2)', flexShrink:0 }}>{label}</span>
      {children}
    </div>
  )
}

function Stepper({ value, min, max, step, onChange }) {
  const atMin = value <= min + 1e-9
  const atMax = value >= max - 1e-9
  const btn = (active) => ({
    width: 26, height: 26, borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: active ? 'var(--color-surface)' : 'var(--color-bg)',
    color: active ? 'var(--color-text1)' : 'var(--color-text3)',
    cursor: active ? 'pointer' : 'default',
    fontWeight: 900, fontSize: 13, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <button disabled={atMin}
              onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
              style={btn(!atMin)}>＜</button>
      <span style={{
        minWidth: 40, textAlign:'center',
        fontSize:`calc(12px * var(--font-scale))`, fontWeight:700,
        color:'var(--color-text1)',
      }}>
        {value.toFixed(1)}pt
      </span>
      <button disabled={atMax}
              onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}
              style={btn(!atMax)}>＞</button>
    </div>
  )
}
const colorPickerStyle = {
  width:28, height:22, padding:0, border:'1px solid var(--color-border)',
  borderRadius:4, cursor:'pointer', background:'none',
}

function imgBtnStyle(bg, color, flex) {
  return {
    flex: flex || 'none',
    padding:'8px 10px', borderRadius:8,
    background:bg, color, border:'none', cursor:'pointer',
    fontWeight:600, fontSize:`calc(11px * var(--font-scale))`,
    whiteSpace:'nowrap',
  }
}
