import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getAdminStats } from '../../api/admin'

interface Stats {
  totalUsers: number
  totalLabs: number
  totalClinics: number
  totalOrders: number
  openOrders: number
  delayedOrders: number
  mrr: number
  recentSignups: { name: string; email: string; role: string; createdAt: string }[]
  ordersByMonth: { month: string; count: number }[]
  topLabs: { name: string; orders: number }[]
}

const KPI = ({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string
}) => (
  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-gray-900 rounded-xl h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return <p className="text-gray-400">שגיאה בטעינת נתונים</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">דשבורד מנהל</h1>
        <p className="text-gray-400 text-sm">סקירה כללית של המערכת</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="משתמשים פעילים" value={stats.totalUsers} color="text-blue-400" />
        <KPI label="מעבדות" value={stats.totalLabs} color="text-purple-400" />
        <KPI label="מרפאות" value={stats.totalClinics} color="text-teal-400" />
        <KPI label="MRR" value={`${stats.mrr.toLocaleString('he-IL')} ₪`} color="text-emerald-400" sub="הכנסה חודשית" />
        <KPI label="עבודות סה&quot;כ" value={stats.totalOrders} />
        <KPI label="עבודות פתוחות" value={stats.openOrders} color="text-yellow-400" />
        <KPI
          label="עבודות מאחרות"
          value={stats.delayedOrders}
          color={stats.delayedOrders > 0 ? 'text-red-400' : 'text-gray-400'}
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Orders by month */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">עבודות לפי חודש</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.ordersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top labs */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">מעבדות מובילות</h3>
          <div className="space-y-3">
            {stats.topLabs.map((lab, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{lab.name}</span>
                    <span className="text-gray-400">{lab.orders}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{ width: `${(lab.orders / (stats.topLabs[0]?.orders || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">הצטרפויות אחרונות</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-right pb-2 pr-2">שם</th>
                <th className="text-right pb-2">אימייל</th>
                <th className="text-right pb-2">תפקיד</th>
                <th className="text-right pb-2">תאריך</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats.recentSignups.map((u, i) => (
                <tr key={i} className="text-gray-300">
                  <td className="py-2 pr-2 font-medium">{u.name}</td>
                  <td className="py-2 text-gray-400" dir="ltr">{u.email}</td>
                  <td className="py-2">
                    <span className="badge bg-gray-800 text-gray-300">{u.role}</span>
                  </td>
                  <td className="py-2 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
