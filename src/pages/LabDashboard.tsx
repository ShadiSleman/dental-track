import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllOrders, getOrder } from '../api/workOrders'
import { useOrdersStore } from '../store/ordersStore'
import WorkOrderCard from '../components/WorkOrderCard'
import type { WorkOrder } from '../types'

type FilterKey = 'all' | 'new' | 'open' | 'delayed' | 'pending_approval' | 'shipping' | 'done'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',              label: 'הכל' },
  { key: 'new',              label: 'חדשות 📥' },
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
    (o.firstName?.toLowerCase().includes(lq)      ?? false) ||
    (o.lastName?.toLowerCase().includes(lq)       ?? false) ||
    o.patientCode.toLowerCase().includes(lq)                ||
    o.orderNumber.toLowerCase().includes(lq)                ||
    (o.doctor?.name?.toLowerCase().includes(lq)   ?? false) ||   // חיפוש לפי שם רופא
    (o.birthDate ? new Date(o.birthDate).toLocaleDateString('he-IL').includes(lq) : false)
  )
}

const PAGE_SIZE = 20

/** Group orders by doctor name → Map<doctorName, WorkOrder[]> */
function groupByDoctor(orders: WorkOrder[]): Map<string, WorkOrder[]> {
  const map = new Map<string, WorkOrder[]>()
  for (const o of orders) {
    const name = o.doctor?.name ?? 'לא ידוע'
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(o)
  }
  return map
}

/** Summary badge colors per stage bucket */
function stageBucket(o: WorkOrder) {
  if (o.currentStage === 'delivered') return 'done'
  if (o.isDelayed) return 'delayed'
  if (o.requiresDoctorApproval) return 'approval'
  return 'active'
}

export default function LabDashboard() {
  const { orders, setOrders, upsertOrder, loading, setLoading } = useOrdersStore()
  const [filter, setFilter]         = useState<FilterKey>('all')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [groupMode, setGroupMode]   = useState(true)
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set())
  const [doctorFilter, setDoctorFilter] = useState('')          // '' = all doctors

  useEffect(() => {
    setLoading(true)
    getAllOrders()
      .then((data) => {
        setOrders(data)
        // Background-prefetch full detail for the 5 most recent orders (especially for mobile)
        // Staggered to avoid hammering the API; orders already fully cached are skipped
        const cached = useOrdersStore.getState().orders
        let delay = 1200
        data.slice(0, 5).forEach((o: WorkOrder) => {
          const inCache = cached.find((c) => c._id === o._id) as (WorkOrder & { stageHistory?: unknown[] }) | undefined
          if (!inCache?.stageHistory) {
            setTimeout(() => {
              getOrder(o._id).then(upsertOrder).catch(() => {})
            }, delay)
            delay += 800 // stagger: 1.2s, 2s, 2.8s, 3.6s, 4.4s
          }
        })
      })
      .finally(() => setLoading(false))
  }, [setOrders, setLoading, upsertOrder])

  // Reset page on filter/search/groupMode/doctor change
  useEffect(() => { setPage(1) }, [filter, search, groupMode, doctorFilter])

  // Unique doctor list from loaded orders
  const doctorOptions = Array.from(
    new Map(orders.map(o => [o.doctor?._id, o.doctor?.name ?? 'לא ידוע'])).entries()
  ).sort((a, b) => (a[1] ?? '').localeCompare(b[1] ?? '', 'he'))

  const toggleCollapse = (name: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  const collapseAll = () => setCollapsed(new Set(groupByDoctor(filtered).keys()))
  const expandAll   = () => setCollapsed(new Set())

  const filtered = orders.filter((o: WorkOrder) => {
    const matchFilter =
      filter === 'all'              ? true :
      filter === 'new'              ? o.currentStage === 'scan_received' :
      filter === 'open'             ? (o.currentStage !== 'delivered' && o.currentStage !== 'scan_received') :
      filter === 'pending_approval' ? o.requiresDoctorApproval :
      filter === 'delayed'          ? o.isDelayed :
      filter === 'shipping'         ? o.currentStage === 'with_courier' :
      /* done */                      o.currentStage === 'delivered'
    const matchDoctor = !doctorFilter || o.doctor?._id === doctorFilter
    return matchFilter && matchSearch(o, search) && matchDoctor
  })

  const newOrders       = orders.filter((o: WorkOrder) => o.currentStage === 'scan_received').length
  const open            = orders.filter((o: WorkOrder) => o.currentStage !== 'delivered' && o.currentStage !== 'scan_received').length
  const delayed         = orders.filter((o: WorkOrder) => o.isDelayed).length
  const done            = orders.filter((o: WorkOrder) => o.currentStage === 'delivered').length
  const pendingApproval = orders.filter((o: WorkOrder) => o.requiresDoctorApproval).length
  const shipping        = orders.filter((o: WorkOrder) => o.currentStage === 'with_courier').length

  const KpiCard = ({ count, label, filterKey, icon, colorClass, numColor }: {
    count: number; label: string; filterKey: FilterKey; icon: string; colorClass?: string; numColor: string
  }) => (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setFilter(f => f === filterKey ? 'all' : filterKey)}
      className={`card text-center w-full transition-all ${
        filter === filterKey ? 'ring-2 ring-primary-400 bg-primary-50' : (colorClass || '')
      }`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${filter === filterKey ? 'text-primary-700' : numColor}`}>{count}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </motion.button>
  )

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">לוח עבודות</h2>
          <p className="text-sm text-gray-500">כל העבודות במעבדה</p>
        </div>
        {/* Toggle: group by doctor / flat list */}
        <button
          onClick={() => setGroupMode(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            groupMode
              ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>{groupMode ? '📂' : '📋'}</span>
          {groupMode ? 'לפי רופא' : 'רשימה שטוחה'}
        </button>
      </div>

      {/* KPI cards — clickable */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard count={newOrders}       label="חדשות 📥"      filterKey="new"              icon="🆕" colorClass="bg-indigo-50 border-indigo-200" numColor="text-indigo-600" />
        <KpiCard count={open}            label="פתוחות"        filterKey="open"             icon="📋" colorClass=""                               numColor="text-primary-600" />
        <KpiCard count={pendingApproval} label="ממתין לאישור"  filterKey="pending_approval" icon="⏳" colorClass="bg-yellow-50 border-yellow-200" numColor="text-yellow-600" />
        <KpiCard count={delayed}         label="מאחרות"         filterKey="delayed"          icon="🚨" colorClass="bg-red-50 border-red-200"       numColor="text-red-500" />
      </div>

      {/* Search + Doctor filter */}
      <div className="flex gap-2">
        {/* Text search */}
        <div className="relative flex-1">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            className="input pr-9 w-full"
            placeholder="חיפוש לפי מטופל, רופא, מספר עבודה..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >✕</button>
          )}
        </div>

        {/* Doctor dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={doctorFilter}
            onChange={e => setDoctorFilter(e.target.value)}
            className={`input appearance-none pl-8 pr-3 cursor-pointer min-w-[130px] ${
              doctorFilter ? 'border-[#1a3a6b] bg-blue-50 text-[#1a3a6b] font-medium' : ''
            }`}
          >
            <option value="">👨‍⚕️ כל הרופאים</option>
            {doctorOptions.map(([id, name]) => (
              <option key={id} value={id ?? ''}>{name}</option>
            ))}
          </select>
          {doctorFilter && (
            <button
              onClick={() => setDoctorFilter('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[#1a3a6b] hover:text-gray-600 text-xs font-bold"
            >✕</button>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {(search || doctorFilter) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">{filtered.length} תוצאות</span>
          {search && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              🔍 "{search}"
              <button onClick={() => setSearch('')} className="hover:text-blue-900">✕</button>
            </span>
          )}
          {doctorFilter && (
            <span className="flex items-center gap-1 text-xs bg-[#1a3a6b]/10 text-[#1a3a6b] border border-[#1a3a6b]/20 px-2 py-0.5 rounded-full">
              👨‍⚕️ {doctorOptions.find(([id]) => id === doctorFilter)?.[1]}
              <button onClick={() => setDoctorFilter('')} className="hover:text-blue-900">✕</button>
            </span>
          )}
          <button
            onClick={() => { setSearch(''); setDoctorFilter('') }}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
          >נקה הכל</button>
        </div>
      )}

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
            <div key={i} className="card animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>{search ? 'לא נמצאו תוצאות לחיפוש' : 'אין עבודות'}</p>
        </div>
      ) : groupMode ? (
        /* ─── Group by doctor ─── */
        <DoctorGroupView
          filtered={filtered}
          collapsed={collapsed}
          onToggle={toggleCollapse}
          onCollapseAll={collapseAll}
          onExpandAll={expandAll}
        />
      ) : (
        /* ─── Flat list ─── */
        <>
          <div className="space-y-3">
            {filtered.slice(0, page * PAGE_SIZE).map((o: WorkOrder) => (
              <WorkOrderCard key={o._id} order={o} />
            ))}
          </div>
          {filtered.length > page * PAGE_SIZE && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-full py-3 text-sm text-primary-600 font-medium bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
            >
              טען עוד ({filtered.length - page * PAGE_SIZE} נותרו)
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ─── DoctorGroupView component ────────────────────────────────────────────── */
function DoctorGroupView({
  filtered,
  collapsed,
  onToggle,
  onCollapseAll,
  onExpandAll,
}: {
  filtered: WorkOrder[]
  collapsed: Set<string>
  onToggle: (name: string) => void
  onCollapseAll: () => void
  onExpandAll: () => void
}) {
  const groups = groupByDoctor(filtered)
  const doctorNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'he'))
  const allCollapsed = doctorNames.every(n => collapsed.has(n))

  return (
    <div className="space-y-3">
      {/* Collapse / Expand all */}
      <div className="flex justify-end gap-2">
        <button
          onClick={allCollapsed ? onExpandAll : onCollapseAll}
          className="text-xs text-[#1a3a6b] underline underline-offset-2 hover:text-blue-700"
        >
          {allCollapsed ? 'פתח הכל' : 'כווץ הכל'}
        </button>
      </div>

      {doctorNames.map(doctorName => {
        const doctorOrders = groups.get(doctorName)!
        const isCollapsed  = collapsed.has(doctorName)

        // Summary counts
        const active   = doctorOrders.filter(o => stageBucket(o) === 'active').length
        const approval = doctorOrders.filter(o => stageBucket(o) === 'approval').length
        const delayed  = doctorOrders.filter(o => stageBucket(o) === 'delayed').length
        const done     = doctorOrders.filter(o => stageBucket(o) === 'done').length

        return (
          <div key={doctorName} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Doctor header row */}
            <button
              onClick={() => onToggle(doctorName)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-l from-[#f0f4ff] to-white hover:from-[#e0eaff] transition-colors text-right"
            >
              {/* Avatar initials */}
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white"
                style={{ background: doctorColor(doctorName) }}>
                {initials(doctorName)}
              </div>

              <div className="flex-1 min-w-0 text-right">
                <p className="font-bold text-gray-900 text-sm truncate">ד"ר {doctorName}</p>
                <div className="flex gap-1.5 flex-wrap mt-0.5">
                  {active   > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-full">{active} פעיל</span>}
                  {approval > 0 && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded-full">{approval} ממתין</span>}
                  {delayed  > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-full">{delayed} מאחר</span>}
                  {done     > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-full">{done} הסתיים</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400 font-medium">{doctorOrders.length}</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </div>
            </button>

            {/* Orders list */}
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-3 space-y-2 bg-gray-50/60">
                    {doctorOrders.map(o => (
                      <WorkOrderCard key={o._id} order={o} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Helpers ─── */
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const DOCTOR_COLORS = [
  '#1a3a6b','#2563eb','#7c3aed','#db2777','#059669',
  '#d97706','#0891b2','#dc2626','#65a30d','#9333ea',
]
function doctorColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return DOCTOR_COLORS[Math.abs(hash) % DOCTOR_COLORS.length]
}
