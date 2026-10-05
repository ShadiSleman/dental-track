import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { getLabStats } from '../api/workOrders'
import { STAGES, WORK_TYPE_LABELS } from '../types'
import type { Stage, WorkType } from '../types'

interface Stats {
  total: number
  open: number
  delayed: number
  delivered: number
  byStage: { _id: string; count: number }[]
  byType: { _id: string; count: number }[]
  byMonth: { month: string; count: number }[]
  byTech: { _id: string; name: string; orders: number; delayed: number }[]
}

const STAGE_COLOR_MAP: Record<string, string> = {
  scan_received:     '#9ca3af',
  order_opened:      '#60a5fa',
  cad_design:        '#818cf8',
  awaiting_approval: '#facc15',
  approved:          '#34d399',
  manufacturing:     '#22d3ee',
  finishing:         '#c084fc',
  quality_check:     '#fb923c',
  ready_to_ship:     '#2dd4bf',
  with_courier:      '#f472b6',
  delivered:         '#22c55e',
}

const TYPE_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1']

const KPI = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
  <div className="card text-center py-5">
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
)

export default function LabStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getLabStats()
      .then(setStats)
      .catch(() => setError('שגיאה בטעינת הסטטיסטיקות'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="card h-60 animate-pulse bg-gray-100" />)}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📊</p>
        <p>{error || 'שגיאה בטעינת נתונים'}</p>
      </div>
    )
  }

  // Enrich byStage with labels and colors
  const stageData = STAGES.map(s => {
    const found = stats.byStage.find(b => b._id === s.key)
    return { name: s.label, count: found?.count ?? 0, color: STAGE_COLOR_MAP[s.key] }
  }).filter(s => s.count > 0)

  // Enrich byType with labels
  const typeData = stats.byType.map((t, i) => ({
    name: WORK_TYPE_LABELS[t._id as WorkType] ?? t._id,
    count: t.count,
    color: TYPE_COLORS[i % TYPE_COLORS.length],
  }))

  const onTimeRate = stats.total > 0
    ? Math.round(((stats.total - stats.delayed) / stats.total) * 100)
    : 100

  const onTimePie = [
    { name: 'בזמן', value: stats.total - stats.delayed, color: '#22c55e' },
    { name: 'מאחרות', value: stats.delayed, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-6" dir="rtl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">סטטיסטיקות מעבדה</h2>
        <p className="text-sm text-gray-500">סקירת ביצועים ועבודות</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="סה״כ עבודות" value={stats.total} color="text-primary-600" />
        <KPI label="פתוחות" value={stats.open} color="text-blue-500" />
        <KPI label="מאחרות" value={stats.delayed} color={stats.delayed > 0 ? 'text-red-500' : 'text-gray-400'} />
        <KPI label="הושלמו" value={stats.delivered} color="text-emerald-500" sub={`${onTimeRate}% בזמן`} />
      </div>

      {/* Charts row 1 */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Orders by month */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">עבודות לפי חודש</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="עבודות"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* On-time vs delayed */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">בזמן מול מאחרות</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={onTimePie}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {onTimePie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} עבודות`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-2xl font-bold text-emerald-500 -mt-2">{onTimeRate}%</p>
          <p className="text-center text-xs text-gray-400">אחוז עמידה בזמן</p>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Orders by stage */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">עבודות לפי שלב</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} width={90} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(v) => [`${v} עבודות`]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="עבודות">
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by work type */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">עבודות לפי סוג</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(v) => [`${v} עבודות`]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="עבודות">
                {typeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Technician performance */}
      {stats.byTech.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">ביצועי טכנאים</h3>
          <div className="space-y-4">
            {stats.byTech.map((t, i) => {
              const onTime = t.orders - t.delayed
              const pct = Math.round((onTime / t.orders) * 100)
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate">{t.name}</span>
                      <div className="flex gap-3 text-xs text-gray-500 flex-shrink-0 mr-2">
                        <span>{t.orders} עבודות</span>
                        {t.delayed > 0 && <span className="text-red-400">{t.delayed} מאחר</span>}
                        <span className="text-emerald-500 font-medium">{pct}% בזמן</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
