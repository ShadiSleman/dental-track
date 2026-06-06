import { useEffect, useState } from 'react'
import { getAdminUsers, updateUser, deleteUser } from '../../api/admin'
import type { User } from '../../types'

const ROLE_LABELS: Record<string, string> = {
  doctor: 'רופא', lab_manager: 'מנהל מעבדה',
  technician: 'טכנאי', courier: 'שליח', super_admin: 'אדמין',
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 20

  const load = () => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (search) params.search = search
    if (roleFilter) params.role = roleFilter
    getAdminUsers(params)
      .then(({ users, total }) => { setUsers(users); setTotal(total) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  const toggleActive = async (u: User) => {
    const updated = await updateUser(u._id, { isActive: !u.isActive })
    setUsers((prev) => prev.map((x) => (x._id === u._id ? updated : x)))
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`למחוק את ${u.name}?`)) return
    await deleteUser(u._id)
    setUsers((prev) => prev.filter((x) => x._id !== u._id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">משתמשים</h1>
          <p className="text-gray-400 text-sm">{total} משתמשים במערכת</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
          <input
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 flex-1"
            placeholder="חיפוש לפי שם / אימייל..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm">
            חיפוש
          </button>
        </form>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">כל התפקידים</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-950">
                <th className="text-right px-4 py-3">שם</th>
                <th className="text-right px-4 py-3">אימייל</th>
                <th className="text-right px-4 py-3">תפקיד</th>
                <th className="text-right px-4 py-3">סטטוס</th>
                <th className="text-right px-4 py-3">כניסה אחרונה</th>
                <th className="text-right px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((u) => (
                <tr key={u._id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-400" dir="ltr">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-gray-800 text-gray-300 text-xs">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${u.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                      {u.isActive ? 'פעיל' : 'מושהה'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('he-IL') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`text-xs px-2 py-1 rounded ${u.isActive ? 'bg-orange-900/40 text-orange-400 hover:bg-orange-900/60' : 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'}`}
                      >
                        {u.isActive ? 'השהה' : 'הפעל'}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60"
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            מציג {(page - 1) * limit + 1}–{Math.min(page * limit, total)} מתוך {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-30"
            >
              הקודם
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-30"
            >
              הבא
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
