// 헤더 우상단 ☁ 버튼 — 클릭 시 드롭다운 (내보내기/가져오기)
// 사용자의 "Daily댕 백업" Google Sheet 한 개에 대해 양방향 동작.
import { useState } from 'react'
import { useGoogleDrive } from '../../hooks/useGoogleDrive'
import {
  exportToSheet, fetchSheetEntries, applySheetEntries, getSheetUrl,
} from '../../api/sheetBackup'
import { BackupIcon, UploadIcon, DownloadIcon } from '../icons/AppIcons'

export default function BackupButton({ haptic }) {
  const [open, setOpen]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const [toast, setToast]     = useState(null)     // { type:'ok'|'err', msg }
  const [confirmImport, setConfirmImport] = useState(null)  // { map, tab, rowCount }

  const { requestAccessToken, clearCachedToken } = useGoogleDrive()

  const showToast = (type, msg, ms = 3000) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), ms)
  }

  // 캐시 토큰이 서버에서 무효화된 경우(401) → 캐시 비우고 새 토큰으로 1회 재시도
  const withAuthRetry = async (fn) => {
    let token = await requestAccessToken()
    try {
      return await fn(token)
    } catch (e) {
      if (!/\b401\b/.test(e.message)) throw e
      clearCachedToken()
      token = await requestAccessToken()
      return await fn(token)
    }
  }

  const handleExport = async () => {
    setOpen(false)
    if (busy) return
    setBusy(true)
    try {
      const res  = await withAuthRetry((token) => exportToSheet(token))
      const when = new Date(res.at).toLocaleString('ko-KR')
      showToast('ok', `시트에 백업됨 · ${res.rowCount}행 · ${when}`, 4500)
    } catch (e) {
      showToast('err', `내보내기 실패: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async () => {
    setOpen(false)
    if (busy) return
    setBusy(true)
    try {
      const res = await withAuthRetry((token) => fetchSheetEntries(token))
      const dateCount = Object.keys(res.map).length
      if (dateCount === 0) {
        showToast('err', '시트에 데이터가 없습니다.')
        return
      }
      setConfirmImport(res)
    } catch (e) {
      showToast('err', `가져오기 실패: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const confirmApply = () => {
    try {
      applySheetEntries(confirmImport.map)
      setConfirmImport(null)
      showToast('ok', '복원되었습니다. 새로고침합니다...', 1500)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      showToast('err', `복원 실패: ${e.message}`)
      setConfirmImport(null)
    }
  }

  return (
    <div style={{ position:'relative' }}>
      <button
        aria-label="백업"
        onClick={() => { haptic?.(); setOpen(v => !v) }}
        style={{
          width:28, height:28, borderRadius:7, background:'#0EA5E9', color:'#fff',
          border:'none', cursor:'pointer', fontSize:14,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'Noto Sans KR',sans-serif", flexShrink:0,
          opacity: busy ? 0.6 : 1,
        }}
      ><BackupIcon size={16} color="#fff" /></button>

      {open && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:30 }} onClick={() => setOpen(false)} />
          <div style={{
            position:'absolute', right:0, top:36, zIndex:31,
            background:'var(--color-surface)',
            border:'1px solid var(--color-border)',
            borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
            padding:6, minWidth:150,
          }}>
            <MenuItem icon={<UploadIcon   size={18} color="#0EA5E9" />} label="내보내기" desc="시트에 백업"   onClick={handleExport} />
            <MenuItem icon={<DownloadIcon size={18} color="#0EA5E9" />} label="가져오기" desc="시트에서 복원" onClick={handleImport} />
          </div>
        </>
      )}

      {/* 복원 확인 모달 */}
      {confirmImport && (
        <div style={{
          position:'fixed', inset:0, zIndex:50,
          background:'rgba(0,0,0,0.45)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:20,
        }}>
          <div style={{
            background:'var(--color-surface)', borderRadius:12,
            maxWidth:340, width:'100%', padding:20,
          }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:8, color:'var(--color-text1)' }}>
              시트 백업으로 복원
            </div>
            <div style={{ fontSize:13, color:'var(--color-text2)', lineHeight:1.5, marginBottom:14 }}>
              시트 <b>"{confirmImport.tab}"</b> 탭에서{' '}
              <b>{Object.keys(confirmImport.map).length}일</b>치 일정을 불러왔습니다.<br />
              현재 기기의 일정 데이터가 <b>시트 내용으로 통째 교체</b>됩니다.<br />
              계속하시겠습니까?
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmImport(null)} style={btnStyle('#E5E7EB', '#374151')}>취소</button>
              <button onClick={confirmApply}                 style={btnStyle('#EF4444', '#fff')}>복원</button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{
          position:'fixed', left:'50%', bottom:40, transform:'translateX(-50%)',
          background: toast.type === 'ok' ? '#10B981' : '#EF4444',
          color:'#fff', padding:'10px 16px', borderRadius:8,
          fontSize:13, fontWeight:500, zIndex:60,
          boxShadow:'0 4px 14px rgba(0,0,0,0.2)',
          maxWidth:'90%',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', display:'flex', alignItems:'center', gap:10,
      padding:'8px 10px', borderRadius:6, border:'none', background:'transparent',
      cursor:'pointer', textAlign:'left',
    }}
      onMouseDown={e => e.currentTarget.style.background = 'rgba(14,165,233,0.08)'}
      onMouseUp={e => e.currentTarget.style.background = 'transparent'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize:18 }}>{icon}</span>
      <div style={{ display:'flex', flexDirection:'column', lineHeight:1.2 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--color-text1)' }}>{label}</span>
        <span style={{ fontSize:10, color:'var(--color-text2)' }}>{desc}</span>
      </div>
    </button>
  )
}

function btnStyle(bg, color) {
  return {
    padding:'8px 16px', borderRadius:6, border:'none',
    background:bg, color, fontWeight:600, fontSize:13, cursor:'pointer',
  }
}
