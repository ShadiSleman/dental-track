import { useState, useEffect, useRef } from 'react'
import { getMessages, sendMessage } from '../api/messages'
import { useAuthStore } from '../store/authStore'
import { getSocket } from '../hooks/useSocket'
import type { Message } from '../types'

interface Props {
  workOrderId: string
}

export default function ChatPanel({ workOrderId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const user = useAuthStore((s) => s.user)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMessages(workOrderId).then(setMessages)

    const socket = getSocket()
    if (socket) {
      socket.emit('join_order', workOrderId)
      socket.on('new_message', (msg: Message) => {
        if (msg.workOrderId === workOrderId) {
          setMessages((prev) => [...prev, msg])
        }
      })
    }
    return () => {
      getSocket()?.off('new_message')
    }
  }, [workOrderId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(workOrderId, text.trim())
      setMessages((prev) => [...prev, msg])
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-80 bg-gray-50 rounded-xl border border-gray-200">
      <div className="px-4 py-2 border-b border-gray-200 bg-white rounded-t-xl">
        <h4 className="font-medium text-gray-700 text-sm">צ'אט עם המעבדה</h4>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.sender._id === user?._id
          return (
            <div key={msg._id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-primary-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                }`}
              >
                {!isMe && (
                  <p className="text-xs text-gray-400 mb-1">{msg.sender.name}</p>
                )}
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="הקלד הודעה..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="btn-primary text-sm px-3 py-2"
        >
          שלח
        </button>
      </div>
    </div>
  )
}
