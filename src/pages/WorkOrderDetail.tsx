import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getOrder, approveOrder, rejectOrder, updateStage, uploadStageImages } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import { useAuthStore } from '../store/authStore'
import ProgressTimeline from '../components/ProgressTimeline'
import ChatPanel from '../components/ChatPanel'
import type { WorkOrder } from '../types'
import { WORK_TYPE_LABELS, STAGES } from '../types'

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { upsertOrder } = useOrdersStore()

  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'files' | 'chat'>('timeline')

  useEffect(() => {
    if (!id) return
    getOrder(id)
      .then((o) => { setOrder(o); upsertOrder(o) })
      .finally(() => setLoading(false))
  }, [id, upsertOrder])

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
            <p className="text-gray-500">{WORK_TYPE_LABELS[order.workType]}</p>
          </div>
          <div className="text-left">
            {order.isDelayed && <span className="badge bg-red-100 text-red-700 mb-1 block">מאחר</span>}
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
          {order.files.length === 0 ? (
            <p className="text-gray-400 text-sm">אין קבצים מצורפים</p>
          ) : (
            <div className="space-y-2">
              {order.files.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">
                    {f.type.includes('image') ? '🖼️' : f.type.includes('pdf') ? '📄' : '📦'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{f.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(f.uploadedAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </a>
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
    </div>
  )
}
