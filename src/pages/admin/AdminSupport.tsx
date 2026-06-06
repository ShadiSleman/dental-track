import { useEffect, useState } from 'react'
import { getTickets, replyTicket, updateTicketStatus } from '../../api/admin'
import type { SupportTicket } from '../../types'

const STATUS_STYLE = {
  open: 'bg-blue-900/50 text-blue-400',
  in_progress: 'bg-yellow-900/50 text-yellow-400',
  resolved: 'bg-gray-800 text-gray-500',
}
const STATUS_LABELS = { open: 'פתוח', in_progress: 'בטיפול', resolved: 'נסגר' }

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    getTickets(params)
      .then(({ tickets, total }) => { setTickets(tickets); setTotal(total) })
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return
    setReplying(true)
    try {
      await replyTicket(selected._id, replyText)
      const updated: SupportTicket = {
        ...selected,
        status: 'in_progress',
        replies: [...selected.replies, { sender: 'Admin', text: replyText, at: new Date().toISOString() }],
      }
      setTickets((prev) => prev.map((t) => (t._id === selected._id ? updated : t)))
      setSelected(updated)
      setReplyText('')
    } finally {
      setReplying(false)
    }
  }

  const handleClose = async (t: SupportTicket) => {
    await updateTicketStatus(t._id, 'resolved')
    const updated = { ...t, status: 'resolved' as const }
    setTickets((prev) => prev.map((x) => (x._id === t._id ? updated : x)))
    if (selected?._id === t._id) setSelected(updated)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">תמיכה</h1>
        <p className="text-gray-400 text-sm">{total} פניות</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === k ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            statusFilter === '' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          הכל
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Tickets list */}
        <div className="space-y-2">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-20 animate-pulse" />
            ))
          ) : tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-12">אין פניות</p>
          ) : tickets.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelected(t)}
              className={`w-full text-right bg-gray-900 rounded-xl p-4 border transition-colors ${
                selected?._id === t._id ? 'border-primary-500' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-white text-sm">{t.subject}</span>
                <span className={`badge text-xs ${STATUS_STYLE[t.status]}`}>
                  {STATUS_LABELS[t.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400">{t.from.name} · {t.from.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(t.createdAt).toLocaleDateString('he-IL')}
              </p>
            </button>
          ))}
        </div>

        {/* Ticket detail */}
        {selected ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">{selected.subject}</h3>
              {selected.status !== 'resolved' && (
                <button
                  onClick={() => handleClose(selected)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded"
                >
                  סגור פנייה
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
              {/* Original message */}
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2">{selected.from.name} · הודעה מקורית</p>
                <p className="text-sm text-gray-200">{selected.body}</p>
              </div>

              {/* Replies */}
              {selected.replies.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 ${r.sender === 'Admin' ? 'bg-primary-900/40 mr-4' : 'bg-gray-800 ml-4'}`}
                >
                  <p className="text-xs text-gray-400 mb-1">{r.sender}</p>
                  <p className="text-sm text-gray-200">{r.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(r.at).toLocaleString('he-IL')}</p>
                </div>
              ))}
            </div>

            {selected.status !== 'resolved' && (
              <div className="p-4 border-t border-gray-800 flex gap-2">
                <textarea
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none"
                  rows={2}
                  placeholder="כתוב תשובה..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  שלח
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-600 bg-gray-900 rounded-xl border border-gray-800 min-h-64">
            בחר פנייה
          </div>
        )}
      </div>
    </div>
  )
}
