import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSubscriptions, updateSubscription } from '../../api/admin'

const VAT = 0.18

type SubStatus = 'active' | 'trial' | 'overdue' | 'cancelled'

const STATUS_STYLE: Record<SubStatus, string> = {
  active:    'bg-emerald-900/50 text-emerald-400',
  trial:     'bg-blue-900/50 text-blue-400',
  overdue:   'bg-red-900/50 text-red-400',
  cancelled: 'bg-gray-800 text-gray-500',
}
const STATUS_LABELS: Record<SubStatus, string> = {
  active: 'פעיל', trial: 'ניסיון', overdue: 'פגר תשלום', cancelled: 'בוטל',
}

const PLAN_DISPLAY: Record<string, { label: string; color: string; monthly: boolean }> = {
  lab_lifetime_3y: { label: 'חבילת השקה (3 שנים)', color: 'text-yellow-400', monthly: false },
  lab_starter:     { label: 'Starter',              color: 'text-blue-400',   monthly: true  },
  lab_standard:    { label: 'Standard',             color: 'text-purple-400', monthly: true  },
  lab_pro:         { label: 'Pro',                  color: 'text-emerald-400',monthly: true  },
  lab_basic:       { label: 'Basic',                color: 'text-gray-400',   monthly: true  },
  enterprise:      { label: 'Enterprise',           color: 'text-red-400',    monthly: false },
}

interface SubRow {
  _id: string
  labId?: string
  labName?: string
  plan: string
  status: string
  price: number
  priceExVat: number
  priceIncVat: number
  startedAt: string
  renewsAt: string
  validUntil: string
  createdAt: string
}

function daysUntil(dateStr: string) {
  const d = new Date(dateStr)
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

export default function AdminSubscriptions() {
  const [subs, setSubs]       = useState<SubRow[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    getSubscriptions(params)
      .then(({ subscriptions, total }) => { setSubs(subscriptions as unknown as SubRow[]); setTotal(total) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [statusFilter])

  const totalPaid    = subs.filter(s => s.status === 'active').reduce((a, s) => a + s.priceExVat, 0)
  const totalPaidVat = subs.filter(s => s.status === 'active').reduce((a, s) => a + s.priceIncVat, 0)

  const handleStatusChange = async (sub: SubRow, status: SubStatus) => {
    await updateSubscription(sub._id, { status })
    load()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">💳 מנויים ותשלומים</h1>
          <p className="text-gray-400 text-sm">{total} רשומות</p>
        </div>
        <Link
          to="/admin/labs"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          🏭 מעבדה + מנוי חדש
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="מנויים פעילים"   value={subs.filter(s => s.status === 'active').length}   color="text-emerald-400" />
        <SummaryCard label="בניסיון"         value={subs.filter(s => s.status === 'trial').length}    color="text-blue-400" />
        <SummaryCard label="פגר תשלום"       value={subs.filter(s => s.status === 'overdue').length}  color="text-red-400" />
        <SummaryCard
          label="סה״כ גבייה (ללא מע״מ)"
          value={`₪${totalPaid.toLocaleString('he-IL')}`}
          color="text-yellow-400"
        />
      </div>

      {/* VAT note */}
      {totalPaid > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-0.5">סה״כ גבייה ללא מע״מ</p>
            <p className="font-bold text-white">₪{totalPaid.toLocaleString('he-IL')}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">מע״מ 18%</p>
            <p className="font-bold text-blue-400">₪{Math.round(totalPaid * VAT).toLocaleString('he-IL')}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-0.5">סה״כ כולל מע״מ</p>
            <p className="font-bold text-emerald-400">₪{totalPaidVat.toLocaleString('he-IL')}</p>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'active', 'trial', 'overdue', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s === '' ? 'הכל' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Cards list — mobile friendly */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-900 rounded-2xl animate-pulse border border-gray-800" />)}
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">💳</p>
          <p>אין מנויים</p>
          <Link to="/admin/labs" className="text-blue-400 text-sm underline mt-2 inline-block">הוסף מעבדה חדשה</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map(sub => {
            const plan      = PLAN_DISPLAY[sub.plan] ?? { label: sub.plan, color: 'text-gray-400', monthly: true }
            const endDate   = sub.validUntil ?? sub.renewsAt
            const days      = endDate ? daysUntil(endDate) : null
            const isExpired = days !== null && days < 0
            const isWarn    = days !== null && days >= 0 && days < 60
            const isOpen    = expanded === sub._id

            return (
              <div key={sub._id} className={`rounded-2xl border transition-colors ${
                isExpired ? 'border-red-900/60 bg-red-950/20'
                : isWarn  ? 'border-yellow-900/40 bg-yellow-950/10'
                :           'border-gray-800 bg-gray-900'
              }`}>
                {/* Row header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : sub._id)}
                  className="w-full text-right px-4 py-4 flex items-center gap-3"
                >
                  {/* Lab avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
                    🏭
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{sub.labName ?? '—'}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[sub.status as SubStatus] ?? 'bg-gray-800 text-gray-400'}`}>
                        {STATUS_LABELS[sub.status as SubStatus] ?? sub.status}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${plan.color}`}>
                      {plan.label} · {plan.monthly ? `₪${sub.priceExVat.toLocaleString('he-IL')}/חודש` : `₪${sub.priceExVat.toLocaleString('he-IL')} חד-פעמי`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {days !== null && (
                      <p className={`text-xs font-medium ${isExpired ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {isExpired ? `פג לפני ${Math.abs(days)} ימים` : `${days} ימים נותרו`}
                      </p>
                    )}
                    <p className={`text-xs text-gray-500 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</p>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-4">
                    {/* Date row */}
                    <div className="grid grid-cols-2 gap-3">
                      <InfoBox label="📅 תחילת מנוי" value={new Date(sub.startedAt ?? sub.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })} />
                      <InfoBox
                        label={isExpired ? '⚠️ פג תוקף' : '📅 סיום מנוי'}
                        value={endDate ? new Date(endDate).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                        valueColor={isExpired ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-emerald-400'}
                      />
                    </div>

                    {/* Payment row */}
                    <div className="grid grid-cols-3 gap-3">
                      <InfoBox
                        label="💰 ללא מע״מ"
                        value={`₪${sub.priceExVat.toLocaleString('he-IL')}`}
                        valueColor="text-white"
                      />
                      <InfoBox
                        label="📊 מע״מ 18%"
                        value={`₪${Math.round(sub.priceExVat * VAT).toLocaleString('he-IL')}`}
                        valueColor="text-blue-400"
                      />
                      <InfoBox
                        label="✅ כולל מע״מ"
                        value={`₪${sub.priceIncVat.toLocaleString('he-IL')}`}
                        valueColor="text-emerald-400"
                      />
                    </div>

                    {/* Status change */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">שנה סטטוס:</span>
                      <select
                        value={sub.status}
                        onChange={e => handleStatusChange(sub, e.target.value as SubStatus)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      {sub.labId && (
                        <Link
                          to="/admin/labs"
                          className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 flex-shrink-0"
                        >
                          פרטי מעבדה ←
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function InfoBox({ label, value, valueColor = 'text-gray-300' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-gray-800/60 rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${valueColor}`}>{value}</p>
    </div>
  )
}
