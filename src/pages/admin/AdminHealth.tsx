import { useEffect, useState } from 'react'
import { getSystemHealth } from '../../api/admin'

interface Health {
  uptime: number
  dbStatus: string
  socketClients: number
  recentErrors: { message: string; route: string; createdAt: string }[]
  nodeVersion: string
  region: string
}

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

export default function AdminHealth() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = () => {
    setLoading(true)
    getSystemHealth()
      .then(setHealth)
      .finally(() => { setLoading(false); setLastRefresh(new Date()) })
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">מצב המערכת</h1>
          <p className="text-gray-400 text-sm">רענון אוטומטי כל 30 שניות</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            עדכון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
          </span>
          <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg">
            🔄 רענן
          </button>
        </div>
      </div>

      {loading && !health ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : health ? (
        <>
          {/* Status cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400">API Server</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">Online</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Uptime: {formatUptime(health.uptime)}</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400">MongoDB</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full ${health.dbStatus === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className={`font-semibold ${health.dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {health.dbStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400">Socket.io</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">{health.socketClients}</p>
              <p className="text-xs text-gray-500 mt-1">חיבורים פעילים</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400">סביבה</p>
              <p className="text-white font-medium mt-2 text-sm">{health.nodeVersion}</p>
              <p className="text-xs text-gray-500 mt-1">{health.region}</p>
            </div>
          </div>

          {/* Recent errors */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">שגיאות אחרונות</h3>
              <span className={`badge text-xs ${health.recentErrors.length > 0 ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                {health.recentErrors.length} שגיאות
              </span>
            </div>
            {health.recentErrors.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">✅ אין שגיאות אחרונות</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {health.recentErrors.map((err, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex justify-between items-start">
                      <p className="text-red-400 text-sm font-mono">{err.message}</p>
                      <span className="text-xs text-gray-500 shrink-0 mr-3">
                        {new Date(err.createdAt).toLocaleString('he-IL')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{err.route}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-red-400">שגיאה בטעינת מצב המערכת</p>
      )}
    </div>
  )
}
