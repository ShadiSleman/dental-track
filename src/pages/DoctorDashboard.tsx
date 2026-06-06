import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getMyOrders } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import WorkOrderCard from '../components/WorkOrderCard'
import type { WorkOrder } from '../types'

const TABS = [
  { key: 'all',      label: 'כל העבודות' },
  { key: 'pending',  label: 'ממתין לאישור' },
  { key: 'active',   label: 'בתהליך' },
  { key: 'shipping', label: 'במשלוח' },
  { key: 'done',     label: 'הושלמו' },
]

export default function DoctorDashboard() {
  const { orders, setOrders, loading, setLoading } = useOrdersStore()
  const [tab, setTab] = useState('all')

  useEffect(() => {
    setLoading(true)
    getMyOrders().then(setOrders).finally(() => setLoading(false))
  }, [setOrders, setLoading])

  const filtered = orders.filter((o: WorkOrder) => {
    if (tab === 'all') return true
    if (tab === 'pending') return o.requiresDoctorApproval
    if (tab === 'shipping') return o.currentStage === 'with_courier'
    if (tab === 'done') return o.currentStage === 'delivered'
    return !o.requiresDoctorApproval && o.currentStage !== 'delivered' && o.currentStage !== 'with_courier'
  })

  const approvalCount = orders.filter((o: WorkOrder) => o.requiresDoctorApproval).length
  const delayedCount  = orders.filter((o: WorkOrder) => o.isDelayed).length
  const shippingCount = orders.filter((o: WorkOrder) => o.currentStage === 'with_courier').length

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">העבודות שלי</h2>
        <p className="text-sm text-gray-500">{orders.length} עבודות סה"כ</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{orders.length}</p>
          <p className="text-xs text-gray-500 mt-1">עבודות פעילות</p>
        </div>
        <div className={`card text-center ${approvalCount > 0 ? 'bg-yellow-50 border-yellow-200' : ''}`}>
          <p className={`text-2xl font-bold ${approvalCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
            {approvalCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">ממתין לאישור</p>
        </div>
        <div className={`card text-center ${delayedCount > 0 ? 'bg-red-50 border-red-200' : ''}`}>
          <p className={`text-2xl font-bold ${delayedCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {delayedCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">מאחרים</p>
        </div>
      </div>

      {/* Shipping alert */}
      {shippingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <span className="text-2xl">🚚</span>
          <div>
            <p className="font-medium text-teal-800">{shippingCount} עבודות בדרך אליך</p>
            <p className="text-xs text-teal-600">השליח בדרך למרפאה</p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🦷</p>
          <p>אין עבודות בקטגוריה זו</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o: WorkOrder) => (
            <WorkOrderCard key={o._id} order={o} />
          ))}
        </div>
      )}
    </div>
  )
}
