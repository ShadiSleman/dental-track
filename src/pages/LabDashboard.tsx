import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getAllOrders } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import WorkOrderCard from '../components/WorkOrderCard'
import type { WorkOrder } from '../types'

type FilterKey = 'all' | 'open' | 'delayed' | 'pending_approval' | 'shipping' | 'done'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',              label: 'הכל' },
  { key: 'open',             label: 'פתוחות' },
  { key: 'pending_approval', label: 'ממתין לאישור' },
  { key: 'delayed',          label: 'מאחרות' },
  { key: 'shipping',         label: 'אצל שליח 🚚' },
  { key: 'done',             label: 'הושלמו' },
]

const matchSearch = (o: WorkOrder, q: string) => {
  if (!q) return true
  const lq = q.toLowerCase()
  return (
    (o.firstName?.toLowerCase().includes(lq) ?? false) ||
    (o.lastName?.toLowerCase().includes(lq) ?? false) ||
    o.patientCode.toLowerCase().includes(lq) ||
    (o.birthDate ? new Date(o.birthDate).toLocaleDateString('he-IL').includes(lq) : false)
  )
}

export default function LabDashboard() {
  const { orders, setOrders, loading, setLoading } = useOrdersStore()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getAllOrders().then(setOrders).finally(() => setLoading(false))
  }, [setOrders, setLoading])

  const filtered = orders.filter((o: WorkOrder) => {
    const matchFilter =
      filter === 'all'              ? true :
      filter === 'open'             ? o.currentStage !== 'delivered' :
      filter === 'pending_approval' ? o.requiresDoctorApproval :
      filter === 'delayed'          ? o.isDelayed :
      filter === 'shipping'         ? o.currentStage === 'with_courier' :
      /* done */                      o.currentStage === 'delivered'
    return matchFilter && matchSearch(o, search)
  })

  const open            = orders.filter((o: WorkOrder) => o.currentStage !== 'delivered').length
  const delayed         = orders.filter((o: WorkOrder) => o.isDelayed).length
  const done            = orders.filter((o: WorkOrder) => o.currentStage === 'delivered').length
  const pendingApproval = orders.filter((o: WorkOrder) => o.requiresDoctorApproval).length
  const shipping        = orders.filter((o: WorkOrder) => o.currentStage === 'with_courier').length

  const KpiCard = ({ count, label, filterKey, colorClass }: {
    count: number; label: string; filterKey: FilterKey; colorClass?: string
  }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setFilter(f => f === filterKey ? 'all' : filterKey)}
      className={`card text-center w-full transition-all ${
        filter === filterKey ? 'ring-2 ring-primary-500 bg-primary-50' : (colorClass || '')
      }`}
    >
      <p className={`text-2xl font-bold ${
        filter === filterKey ? 'text-primary-700' :
        colorClass?.includes('red') ? 'text-red-500' :
        colorClass?.includes('yellow') ? 'text-yellow-600' :
        colorClass?.includes('emerald') ? 'text-emerald-500' :
        colorClass?.includes('teal') ? 'text-teal-600' :
        'text-primary-600'
      }`}>{count}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </motion.button>
  )

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">לוח עבודות</h2>
        <p className="text-sm text-gray-500">כל העבודות במעבדה</p>
      </div>

      {/* KPI cards — clickable */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard count={open}            label="פתוחות"          filterKey="open" />
        <KpiCard count={pendingApproval} label="ממתין לאישור"    filterKey="pending_approval" colorClass="bg-yellow-50 border-yellow-200" />
        <KpiCard count={delayed}         label="מאחרות"           filterKey="delayed"  colorClass="bg-red-50 border-red-200" />
        <KpiCard count={shipping}        label="אצל שליח 🚚"     filterKey="shipping" colorClass="bg-teal-50 border-teal-200" />
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          className="input pr-9"
          placeholder="חיפוש לפי שם פרטי, שם משפחה, תאריך לידה..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
          <p>{search ? 'לא נמצאו תוצאות לחיפוש' : 'אין עבודות'}</p>
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
