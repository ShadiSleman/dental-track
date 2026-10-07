import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useNotifStore } from '../store/notifStore'
import { markOneRead } from '../api/notifications'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import type { AppNotification } from '../types'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markOneRead: markOneLocal } = useNotifStore()
  const navigate = useNavigate()

  useOnClickOutside(ref, () => setOpen(false))

  const handleNotifClick = async (n: AppNotification) => {
    setOpen(false)
    if (!n.read) {
      markOneLocal(n._id)
      markOneRead(n._id).catch(() => {})
    }
    if (n.workOrderId) {
      navigate(`/orders/${n.workOrderId}`)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="התראות"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">התראות</h4>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} חדשות
                </span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">אין התראות חדשות</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-right px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 cursor-pointer ${
                      !n.read ? 'bg-blue-50 hover:bg-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                      <div className={!n.read ? '' : 'mr-4'}>
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">לחץ על התראה לפתיחת העבודה</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
