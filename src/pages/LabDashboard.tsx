import { useEffect, useState } from 'react'
import { getAllOrders, assignTechnician } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import WorkOrderCard from '../components/WorkOrderCard'
import type { WorkOrder } from '../types'

const FILTERS = [
  { key: 'all',     label: 'הכל' },
  { key: 'open',    label: 'פתוחות' },
  { key: 'delayed', label: 'מאחרות' },
  { key: 'done',    label: 'הושלמו' },
]

export default function LabDashboard() {
  const { orders, setOrders, loading, setLoading } = useOrdersStore()
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getAllOrders().then(setOrders).finally(() => setLoading(false))
  }, [setOrders, setLoading])

  const filtered = orders.filter((o: WorkOrder) => {
    if (filter === 'all') return true
    if (filter === 'open') return o.currentStage !== 'delivered'
    if (filter === 'delayed') return o.isDelayed
    return o.currentStage === 'delivered'
  })

  const open    = orders.filter((o: WorkOrder) => o.currentStage !== 'delivered').length
  const delayed = orders.filter((o: WorkOrder) => o.isDelayed).length
  const done    = orders.filter((o: WorkOrder) => o.currentStage === 'delivered').length

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">לוח עבודות</h2>
        <p className="text-sm text-gray-500">כל העבודות במעבדה</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{open}</p>
          <p className="text-xs text-gray-500 mt-1">פתוחות</p>
        </div>
        <div className={`card text-center ${delayed > 0 ? 'bg-red-50 border-red-200' : ''}`}>
          <p className={`text-2xl font-bold ${delayed > 0 ? 'text-red-500' : 'text-gray-400'}`}>{delayed}</p>
          <p className="text-xs text-gray-500 mt-1">מאחרות</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-500">{done}</p>
          <p className="text-xs text-gray-500 mt-1">הושלמו</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>אין עבודות</p>
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
