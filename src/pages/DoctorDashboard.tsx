import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getMyOrders } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import WorkOrderCard from '../components/WorkOrderCard'
import type { WorkOrder } from '../types'

type TabKey = 'all' | 'pending' | 'active' | 'delayed' | 'shipping' | 'done'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',      label: 'כל העבודות' },
  { key: 'pending',  label: 'ממתין לאישור' },
  { key: 'active',   label: 'בתהליך' },
  { key: 'delayed',  label: 'מאחרים' },
  { key: 'shipping', label: 'בדרך אליך 🚚' },
  { key: 'done',     label: 'הושלמו' },
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

export default function DoctorDashboard() {
  const { orders, setOrders, loading, setLoading } = useOrdersStore()
  const [tab, setTab]       = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getMyOrders().then(setOrders).finally(() => setLoading(false))
  }, [setOrders, setLoading])

  const filtered = orders.filter((o: WorkOrder) => {
    const matchTab =
      tab === 'all'      ? true :
      tab === 'pending'  ? o.requiresDoctorApproval :
      tab === 'delayed'  ? o.isDelayed :
      tab === 'shipping' ? o.currentStage === 'with_courier' :
      tab === 'done'     ? o.currentStage === 'delivered' :
      /* active */         !o.requiresDoctorApproval && o.currentStage !== 'delivered' && o.currentStage !== 'with_courier'
    return matchTab && matchSearch(o, search)
  })

  const approvalCount = orders.filter((o: WorkOrder) => o.requiresDoctorApproval).length
  const delayedCount  = orders.filter((o: WorkOrder) => o.isDelayed).length
  const shippingCount = orders.filter((o: WorkOrder) => o.currentStage === 'with_courier').length
  const activeCount   = orders.filter((o: WorkOrder) =>
    !o.requiresDoctorApproval && o.currentStage !== 'delivered' && o.currentStage !== 'with_courier'
  ).length

  const KpiCard = ({ count, label, tabKey, color }: {
    count: number; label: string; tabKey: TabKey; color: string
  }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setTab(t => t === tabKey ? 'all' : tabKey)}
      className={`card text-center w-full transition-all ${
        tab === tabKey ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      } ${count > 0 ? color : ''}`}
    >
      <p className={`text-2xl font-bold ${
        tab === tabKey ? 'text-primary-700' :
        color.includes('yellow') ? 'text-yellow-600' :
        color.includes('red') ? 'text-red-500' :
        'text-primary-600'
      }`}>{count}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </motion.button>
  )

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">העבודות שלי</h2>
        <p className="text-sm text-gray-500">{orders.length} עבודות סה"כ</p>
      </div>

      {/* KPI cards — clickable */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard count={activeCount}   label="עבודות פעילות"  tabKey="active"   color="" />
        <KpiCard count={approvalCount} label="ממתין לאישור"   tabKey="pending"  color="bg-yellow-50 border-yellow-200" />
        <KpiCard count={delayedCount}  label="מאחרים"          tabKey="delayed"  color="bg-red-50 border-red-200" />
        <KpiCard count={shippingCount} label="בדרך אליך 🚚"   tabKey="shipping" color="bg-teal-50 border-teal-200" />
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
          <p>{search ? 'לא נמצאו תוצאות לחיפוש' : 'אין עבודות בקטגוריה זו'}</p>
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
