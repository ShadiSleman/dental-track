import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import { getOrder, approveOrder, rejectOrder, updateStage, assignTechnician, uploadOrderFiles, deleteOrder } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import { useAuthStore } from '../store/authStore'
import ProgressTimeline from '../components/ProgressTimeline'
import ChatPanel from '../components/ChatPanel'
import type { WorkOrder, Stage } from '../types'
import { STAGES } from '../types'

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { upsertOrder, orders } = useOrdersStore()

  // Show cached order immediately — skip spinner if we have data with stageHistory
  const cachedOrder = orders.find((o: WorkOrder) => o._id === id) ?? null
  const hasFull = !!(cachedOrder && Array.isArray((cachedOrder as WorkOrder & { stageHistory?: unknown[] }).stageHistory))
  const [order, setOrder] = useState<WorkOrder | null>(cachedOrder)
  const [loading, setLoading] = useState(!cachedOrder) // skip spinner if we have cache
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'files' | 'chat'>('timeline')
  const [stageNote, setStageNote] = useState('')
  const [advancing, setAdvancing] = useState(false)
  const [showStagePanel, setShowStagePanel] = useState(false)
  const [technicians, setTechnicians] = useState<{ _id: string; name: string }[]>([])
  const [assigningTech, setAssigningTech] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    // If we already have full order (with stageHistory) from cache → fetch silently in bg
    // If we only have slim list-cache or nothing → fetch and show spinner
    if (hasFull) {
      // Background refresh — user sees content immediately
      getOrder(id).then((o) => { setOrder(o); upsertOrder(o) }).catch(() => {})
    } else {
      getOrder(id)
        .then((o) => { setOrder(o); upsertOrder(o) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [id]) // eslint-disable-line

  // Fetch technicians for lab_manager assignment
  useEffect(() => {
    if (user?.role !== 'lab_manager') return
    import('../api/team').then(m => m.getTeam()).then(data => setTechnicians(data.technicians))
      .catch(() => {})
  }, [user])

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="card animate-pulse h-32 bg-gray-100" />
        <div className="card animate-pulse h-64 bg-gray-100" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">עבודה לא נמצאה</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">חזור</button>
      </div>
    )
  }

  const handleApprove = async () => {
    const updated = await approveOrder(order._id)
    setOrder(updated)
    upsertOrder(updated)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    const updated = await rejectOrder(order._id, rejectReason)
    setOrder(updated)
    upsertOrder(updated)
    setShowReject(false)
    setRejectReason('')
  }

  // Stage advancement — for lab_manager / technician
  const stageIdxLocal = STAGES.findIndex(s => s.key === order?.currentStage)
  const nextStageKey = (): Stage | null => {
    if (!order) return null
    if (stageIdxLocal === -1 || stageIdxLocal >= STAGES.length - 1) return null
    return STAGES[stageIdxLocal + 1].key
  }
  const prevStageKey = (): Stage | null => {
    if (!order) return null
    if (stageIdxLocal <= 0) return null
    return STAGES[stageIdxLocal - 1].key
  }

  const handleAdvanceStage = async (targetStage: Stage) => {
    if (!order) return
    setAdvancing(true)
    try {
      const updated = await updateStage(order._id, targetStage, stageNote)
      setOrder(updated)
      upsertOrder(updated)
      setStageNote('')
      setShowStagePanel(false)
    } finally {
      setAdvancing(false)
    }
  }

  const handleAssignTechnician = async (techId: string) => {
    if (!order) return
    setAssigningTech(true)
    try {
      const updated = await assignTechnician(order._id, techId)
      setOrder(updated)
      upsertOrder(updated)
    } finally {
      setAssigningTech(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    if (!confirm(`למחוק את העבודה ${order.orderNumber}?\n\nכל הנתונים יימחקו לצמיתות.`)) return
    if (!confirm(`אישור סופי — למחוק לצמיתות את עבודה ${order.orderNumber}?`)) return
    setDeleting(true)
    try {
      await deleteOrder(order._id)
      navigate('/dashboard')
    } catch {
      alert('שגיאה במחיקה — נסה שוב')
      setDeleting(false)
    }
  }

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !e.target.files || e.target.files.length === 0) return
    setUploadingFiles(true)
    setUploadError('')
    try {
      const fd = new FormData()
      Array.from(e.target.files).forEach(f => fd.append('files', f))
      const updated = await uploadOrderFiles(order._id, fd)
      setOrder(updated)
      upsertOrder(updated)
    } catch {
      setUploadError('שגיאה בהעלאה — נסה שוב')
    } finally {
      setUploadingFiles(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const stageIdx = STAGES.findIndex((s) => s.key === order.currentStage)
  const progress = Math.round(((stageIdx + 1) / STAGES.length) * 100)
  const daysLeft = order.dueDate
    ? Math.ceil((new Date(order.dueDate).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-4">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 flex items-center gap-1 hover:text-primary-600">
        ← חזרה
      </button>

      {/* Header card */}
      <div className="card space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-gray-400">עבודה #{order.orderNumber}</span>
            <h2 className="text-xl font-bold text-gray-900">{order.patientCode}</h2>
            <p className="text-sm text-gray-500">
              {[order.gender, order.birthDate ? `ת.לידה ${new Date(order.birthDate).toLocaleDateString('he-IL')}` : null, order.scanDate ? `סריקה ${new Date(order.scanDate).toLocaleDateString('he-IL')}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="text-left flex flex-col items-end gap-1">
            {order.isDelayed && <span className="badge bg-red-100 text-red-700 block">מאחר</span>}
            {order.requiresDoctorApproval && (
              <span className="badge bg-yellow-100 text-yellow-700 block">ממתין לאישורך</span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>התקדמות</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs">מרפאה</p>
            <p className="font-medium">{order.clinic?.name}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">מעבדה</p>
            <p className="font-medium">{order.lab?.name}</p>
          </div>
          {order.dueDate && daysLeft !== null && (
          <div>
            <p className="text-gray-400 text-xs">תאריך יעד</p>
            <p className={`font-medium ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 2 ? 'text-orange-500' : ''}`}>
              {new Date(order.dueDate).toLocaleDateString('he-IL')}
              {daysLeft >= 0 ? ` (${daysLeft} ימים)` : ` (פגר ${Math.abs(daysLeft)} ימים)`}
            </p>
          </div>
          )}
          {order.assignedTechnician && (
            <div>
              <p className="text-gray-400 text-xs">טכנאי</p>
              <p className="font-medium">{order.assignedTechnician.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Doctor approval buttons */}
      {user?.role === 'doctor' && order.requiresDoctorApproval && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-yellow-50 border-yellow-300 space-y-3"
        >
          <h3 className="font-semibold text-yellow-800">📋 התכנון מוכן לאישורך</h3>
          {order.notes && <p className="text-sm text-gray-600">{order.notes}</p>}
          <div className="flex gap-2">
            <button onClick={handleApprove} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
              ✅ אישור
            </button>
            <button onClick={() => setShowReject(true)} className="btn-danger flex-1">
              ✕ דחייה
            </button>
          </div>
          {showReject && (
            <div className="space-y-2">
              <textarea
                className="input"
                rows={2}
                placeholder="סיבת הדחייה (יישלח לטכנאי)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleReject} className="btn-danger flex-1">שלח דחייה</button>
                <button onClick={() => setShowReject(false)} className="btn-secondary flex-1">ביטול</button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Lab / Technician — stage advancement */}
      {(user?.role === 'lab_manager' || user?.role === 'technician') && order.currentStage !== 'delivered' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border border-primary-100 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">🔧 קידום עבודה</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                שלב נוכחי: <span className="font-medium text-primary-700">{STAGES.find(s => s.key === order.currentStage)?.label}</span>
              </p>
            </div>
            <button
              onClick={() => setShowStagePanel(v => !v)}
              className="text-xs text-primary-600 font-medium px-3 py-1.5 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              {showStagePanel ? 'סגור' : 'קדם שלב ▸'}
            </button>
          </div>

          <AnimatePresence>
            {showStagePanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Quick actions */}
                <div className="grid grid-cols-1 gap-2">
                  {/* Open order (first step) */}
                  {order.currentStage === 'scan_received' && (
                    <button
                      onClick={() => handleAdvanceStage('order_opened')}
                      disabled={advancing}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                    >
                      📂 פתח עבודה
                    </button>
                  )}
                  {/* Next stage */}
                  {nextStageKey() && order.currentStage !== 'scan_received' && (
                    <button
                      onClick={() => handleAdvanceStage(nextStageKey()!)}
                      disabled={advancing}
                      className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                    >
                      {advancing ? 'מעדכן...' : `▶ קדם ל: ${STAGES.find(s => s.key === nextStageKey())?.label}`}
                    </button>
                  )}
                  {/* Back stage */}
                  {prevStageKey() && order.currentStage !== 'scan_received' && (
                    <button
                      onClick={() => handleAdvanceStage(prevStageKey()!)}
                      disabled={advancing}
                      className="w-full py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                    >
                      ◀ חזור ל: {STAGES.find(s => s.key === prevStageKey())?.label}
                    </button>
                  )}
                  {/* Send to doctor for approval */}
                  {order.currentStage !== 'awaiting_approval' && order.currentStage !== 'scan_received' && (
                    <button
                      onClick={() => handleAdvanceStage('awaiting_approval')}
                      disabled={advancing}
                      className="w-full py-2.5 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                    >
                      📤 שלח לאישור רופא
                    </button>
                  )}
                  {/* Ready to ship */}
                  {!['scan_received','ready_to_ship','with_courier','delivered'].includes(order.currentStage) && (
                    <button
                      onClick={() => handleAdvanceStage('ready_to_ship')}
                      disabled={advancing}
                      className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
                    >
                      📦 מוכן למשלוח
                    </button>
                  )}
                </div>

                {/* Assign technician (lab_manager only) */}
                {user?.role === 'lab_manager' && technicians.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">👤 הקצה לטכנאי</p>
                    <select
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                      value={order.assignedTechnician?._id ?? ''}
                      onChange={e => e.target.value && handleAssignTechnician(e.target.value)}
                      disabled={assigningTech}
                    >
                      <option value="">-- בחר טכנאי --</option>
                      {technicians.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                    {assigningTech && <p className="text-xs text-gray-400 mt-1">מעדכן...</p>}
                  </div>
                )}

                {/* Note */}
                <textarea
                  className="input text-sm"
                  rows={2}
                  placeholder="הערה (אופציונלי)"
                  value={stageNote}
                  onChange={e => setStageNote(e.target.value)}
                />

                {/* All stages picker */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">כל השלבים</summary>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {STAGES.filter(s => s.key !== order.currentStage && s.key !== 'delivered').map(s => (
                      <button
                        key={s.key}
                        onClick={() => handleAdvanceStage(s.key)}
                        disabled={advancing}
                        className="py-1.5 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors disabled:opacity-50 text-right"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </details>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['timeline', 'files', 'chat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'timeline' ? '📈 ציר זמן' : tab === 'files' ? '📁 קבצים' : '💬 צ\'אט'}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div className="card">
          <ProgressTimeline currentStage={order.currentStage} history={order.stageHistory} />
        </div>
      )}

      {activeTab === 'files' && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-gray-700">קבצים ({order.files.length})</h3>
            <div className="flex items-center gap-2">
              {/* Download all */}
              {order.files.length > 0 && (
                <button
                  onClick={() => order.files.forEach(f => {
                    const a = document.createElement('a')
                    a.href = f.url; a.download = f.name; a.target = '_blank'
                    document.body.appendChild(a); a.click(); document.body.removeChild(a)
                  })}
                  className="text-xs text-primary-600 font-medium px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  ⬇️ הורד הכל
                </button>
              )}
              {/* Upload — all users */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUploadFiles}
                accept="image/*,application/pdf,.stl,.obj,.ply"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles}
                className="text-xs text-white font-medium px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1"
              >
                {uploadingFiles ? (
                  <>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    מעלה...
                  </>
                ) : '📎 הוסף קבצים'}
              </button>
            </div>
          </div>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          {order.files.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">אין קבצים מצורפים לעבודה זו</p>
          ) : (
            <div className="space-y-2">
              {order.files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent hover:border-primary-200 hover:bg-primary-50 transition-colors">
                  {/* Thumbnail / icon */}
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    {f.type.includes('image') ? (
                      <img src={f.url} alt={f.name} className="w-14 h-14 object-cover rounded-lg" />
                    ) : (
                      <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-2xl">
                        {f.type.includes('pdf') ? '📄' : '📦'}
                      </div>
                    )}
                  </a>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {f.type.split('/')[1]?.toUpperCase() ?? f.type}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <span>📅</span>
                      <span>{new Date(f.uploadedAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                  {/* Download button */}
                  <a
                    href={f.url}
                    download={f.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
                    title="הורד קובץ"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
          {order.signature && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">חתימת קבלה</p>
              <img src={order.signature} alt="חתימה" className="border rounded-lg max-w-xs" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && <ChatPanel workOrderId={order._id} />}

      {/* Delete — lab_manager + super_admin — very bottom, above mobile nav */}
      {(user?.role === 'lab_manager' || user?.role === 'super_admin') && (
        <div className="pt-8 pb-24 md:pb-8 flex justify-center border-t border-gray-100 mt-4">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 flex items-center gap-1.5 underline underline-offset-2"
          >
            🗑️ {deleting ? 'מוחק...' : 'מחק עבודה זו'}
          </button>
        </div>
      )}
    </div>
  )
}
