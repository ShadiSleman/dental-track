import { useEffect, useState } from 'react'
import api from '../../api/client'

interface LabEntry {
  _id: string
  name: string
  email?: string
  phone?: string
  address?: string
  technicianCount: number
  openOrders: number
  plan?: string
  createdAt: string
}

export default function AdminLabs() {
  const [labs, setLabs] = useState<LabEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get<LabEntry[]>('/admin/labs').then((r) => setLabs(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = labs.filter((l) =>
    !search || l.name.includes(search) || l.email?.includes(search),
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">מעבדות</h1>
        <p className="text-gray-400 text-sm">{labs.length} מעבדות רשומות</p>
      </div>

      <input
        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-full max-w-sm"
        placeholder="חיפוש מעבדה..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-32 animate-pulse border border-gray-800" />
            ))
          : filtered.map((lab) => (
              <div key={lab._id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-white">{lab.name}</h3>
                  {lab.plan && (
                    <span className="badge bg-primary-900/50 text-primary-400 text-xs">{lab.plan}</span>
                  )}
                </div>
                {lab.email && <p className="text-xs text-gray-400" dir="ltr">{lab.email}</p>}
                {lab.phone && <p className="text-xs text-gray-400">{lab.phone}</p>}
                {lab.address && <p className="text-xs text-gray-500 mt-1">📍 {lab.address}</p>}
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-400">{lab.technicianCount}</p>
                    <p className="text-xs text-gray-500">טכנאים</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-400">{lab.openOrders}</p>
                    <p className="text-xs text-gray-500">עבודות פתוחות</p>
                  </div>
                  <div className="text-center text-xs text-gray-500 flex flex-col justify-end">
                    <span>הצטרף</span>
                    <span>{new Date(lab.createdAt).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
