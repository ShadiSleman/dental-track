import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyOrders, updateStage } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import type { WorkOrder, Stage } from '../types'
import { STAGES, WORK_TYPE_LABELS } from '../types'

export default function TechnicianView() {
  const { orders, setOrders, upsertOrder, loading, setLoading } = useOrdersStore()
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    getMyOrders().then(setOrders).finally(() => setLoading(false))
  }, [setOrders, setLoading])

  const active = orders.filter((o: WorkOrder) => o.currentStage !== 'delivered')
  const returned = orders.filter((o: WorkOrder) => o.returnReason)

  const advance = async (order: WorkOrder) => {
    const idx = STAGES.findIndex((s) => s.key === order.currentStage)
    if (idx < 0 || idx >= STAGES.length - 1) return
    const nextStage = STAGES[idx + 1].key as Stage
    const updated = await updateStage(order._id, nextStage)
    upsertOrder(updated)
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-24 bg-gray-100" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      <h2 className="text-xl font-bold text-gray-900">העבודות שלי</h2>

      {/* Returned orders alert */}
      {returned.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <p className="font-semibold text-orange-800 mb-2">⚠️ עבודות חוזרות ({returned.length})</p>
          {returned.map((o: WorkOrder) => (
            <div key={o._id} className="text-sm text-orange-700 mb-1">
              #{o.orderNumber} — {o.returnReason}
            </div>
          ))}
        </div>
      )}

      {active.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>אין עבודות פתוחות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((o: WorkOrder) => {
            const stageInfo = STAGES.find((s) => s.key === o.currentStage)
            const idx = STAGES.findIndex((s) => s.key === o.currentStage)
            const canAdvance = idx < STAGES.length - 1 && o.currentStage !== 'awaiting_approval'

            return (
              <div key={o._id} className="card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-400">#{o.orderNumber}</span>
                    <h3 className="font-semibold text-gray-900">{o.patientCode}</h3>
                    <p className="text-sm text-gray-500">{WORK_TYPE_LABELS[o.workType]}</p>
                  </div>
                  <span className={`badge text-white text-xs ${stageInfo?.color}`}>
                    {stageInfo?.label}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/orders/${o._id}`)}
                    className="btn-secondary text-sm flex-1"
                  >
                    פרטים
                  </button>
                  {canAdvance && (
                    <button
                      onClick={() => advance(o)}
                      className="btn-primary text-sm flex-1"
                    >
                      עדכן שלב הבא ▶
                    </button>
                  )}
                  {o.currentStage === 'awaiting_approval' && (
                    <div className="flex-1 text-center text-sm text-yellow-600 font-medium py-2">
                      ממתין לאישור רופא
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
