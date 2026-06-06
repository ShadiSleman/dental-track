import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getSubscriptions, updateSubscription } from '../../api/admin'
import type { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../types'
import { PLAN_LABELS, PLAN_PRICES } from '../../types'

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  active:    'bg-emerald-900/50 text-emerald-400',
  trial:     'bg-blue-900/50 text-blue-400',
  overdue:   'bg-red-900/50 text-red-400',
  cancelled: 'bg-gray-800 text-gray-500',
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'פעיל', trial: 'ניסיון', overdue: 'פגר תשלום', cancelled: 'בוטל',
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    getSubscriptions(params)
      .then(({ subscriptions, total }) => { setSubs(subscriptions); setTotal(total) })
      .finally(() => setLoading(false))
  }, [statusFilter])

  const mrr = subs
    .filter((s) => s.status === 'active')
    .reduce((acc, s) => acc + (s.price || PLAN_PRICES[s.plan] || 0), 0)

  const handleStatusChange = async (sub: Subscription, status: SubscriptionStatus) => {
    const updated = await updateSubscription(sub._id, { status })
    setSubs((prev) => prev.map((x) => (x._id === sub._id ? updated : x)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">מנויים</h1>
        <p className="text-gray-400 text-sm">{total} חשבונות · MRR: {mrr.toLocaleString('he-IL')} ₪</p>
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.keys(PLAN_LABELS) as SubscriptionPlan[]).map((plan) => {
          const count = subs.filter((s) => s.plan === plan && s.status === 'active').length
          return (
            <div key={plan} className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
              <p className="text-lg font-bold text-white">{count}</p>
              <p className="text-xs text-gray-500 mt-1">{PLAN_LABELS[plan].split(' — ')[0]}</p>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'active', 'trial', 'overdue', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s === '' ? 'הכל' : STATUS_LABELS[s as SubscriptionStatus]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-950">
                <th className="text-right px-4 py-3">חשבון</th>
                <th className="text-right px-4 py-3">סוג</th>
                <th className="text-right px-4 py-3">תכנית</th>
                <th className="text-right px-4 py-3">מחיר</th>
                <th className="text-right px-4 py-3">סטטוס</th>
                <th className="text-right px-4 py-3">חידוש</th>
                <th className="text-right px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : subs.map((sub) => (
                <tr key={sub._id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">{sub.accountName}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{sub.accountModel}</td>
                  <td className="px-4 py-3 text-xs">{PLAN_LABELS[sub.plan]?.split(' — ')[0]}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">
                    {(sub.price || PLAN_PRICES[sub.plan] || 0).toLocaleString('he-IL')} ₪
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${STATUS_STYLE[sub.status]}`}>
                      {STATUS_LABELS[sub.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(sub.renewsAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={sub.status}
                      onChange={(e) => handleStatusChange(sub, e.target.value as SubscriptionStatus)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
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
