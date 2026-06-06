import { useEffect, useState } from 'react'
import { getLogs } from '../../api/admin'
import type { AuditLog } from '../../types'

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 30

  const load = () => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (search) params.search = search
    if (actionFilter) params.action = actionFilter
    getLogs(params)
      .then(({ logs, total }) => { setLogs(logs); setTotal(total) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, actionFilter])

  const ACTION_COLORS: Record<string, string> = {
    login: 'text-emerald-400',
    logout: 'text-gray-400',
    failed_login: 'text-red-400',
    order_created: 'text-blue-400',
    stage_updated: 'text-purple-400',
    order_approved: 'text-emerald-400',
    order_rejected: 'text-orange-400',
    file_uploaded: 'text-teal-400',
    user_suspended: 'text-red-400',
    subscription_changed: 'text-yellow-400',
  }

  const exportCsv = () => {
    const rows = [
      ['תאריך', 'משתמש', 'פעולה', 'יעד', 'IP'],
      ...logs.map((l) => [
        new Date(l.createdAt).toLocaleString('he-IL'),
        l.actor?.name ?? '—',
        l.action,
        l.target ?? '—',
        l.ip ?? '—',
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">לוג פעילות</h1>
          <p className="text-gray-400 text-sm">{total} רשומות</p>
        </div>
        <button onClick={exportCsv} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg">
          📥 ייצוא CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load() }} className="flex gap-2 flex-1 min-w-0">
          <input
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 flex-1"
            placeholder="חיפוש לפי משתמש או פעולה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">חיפוש</button>
        </form>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">כל הפעולות</option>
          {Object.keys(ACTION_COLORS).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-950">
                <th className="text-right px-4 py-3">תאריך</th>
                <th className="text-right px-4 py-3">משתמש</th>
                <th className="text-right px-4 py-3">פעולה</th>
                <th className="text-right px-4 py-3">יעד</th>
                <th className="text-right px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-2">
                        <div className="h-3 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-800/40">
                  <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('he-IL')}
                  </td>
                  <td className="px-4 py-2 text-gray-300 text-xs">
                    {log.actor?.name ?? '—'}
                    <span className="text-gray-600 mr-1">({log.actor?.role})</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium ${ACTION_COLORS[log.action] ?? 'text-gray-400'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{log.target ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs" dir="ltr">{log.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-sm">
          <span className="text-gray-500">עמוד {page} מתוך {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-30">הקודם</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}
              className="px-3 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-30">הבא</button>
          </div>
        </div>
      </div>
    </div>
  )
}
