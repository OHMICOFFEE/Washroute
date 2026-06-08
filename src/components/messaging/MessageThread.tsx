'use client'
import { useState, useEffect, useRef } from 'react'
import { useDemoStore, type DemoMessage } from '@/lib/demo/store'
import { Send, MessageCircle } from 'lucide-react'

interface Props {
  bookingId: string
  role: 'driver' | 'admin' | 'customer'
  roleName: string
}

export default function MessageThread({ bookingId, role, roleName }: Props) {
  const store    = useDemoStore()
  const messages = store.getMessages(bookingId)
  const [text, setText] = useState('')
  const [to, setTo]     = useState<DemoMessage['to']>(role === 'customer' ? 'admin' : 'admin')
  const bottomRef       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    store.markMessagesRead(bookingId, role)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const toOptions: { value: DemoMessage['to']; label: string }[] = role === 'driver'
    ? [{ value: 'admin', label: 'Admin' }, { value: 'customer', label: 'Customer' }, { value: 'all', label: 'Everyone' }]
    : role === 'admin'
    ? [{ value: 'driver', label: 'Driver' }, { value: 'customer', label: 'Customer' }, { value: 'all', label: 'Everyone' }]
    : [{ value: 'admin', label: 'Support' }]

  function send() {
    if (!text.trim()) return
    store.sendMessage({ booking_id: bookingId, from: role, from_name: roleName, to, text: text.trim() })
    setText('')
  }

  const bubbleColor = (from: DemoMessage['from'], isMe: boolean) => {
    if (isMe) {
      if (from === 'admin') return '#007aff'
      if (from === 'driver') return '#ff9500'
      return 'var(--brand-primary)'
    }
    return 'var(--surface-inset)'
  }

  return (
    <div className="flex flex-col" style={{ height: '380px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ background: '#f5f5f7', borderRadius: '12px 12px 0 0', border: '1px solid var(--surface-border)' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageCircle className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No messages yet</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.from === role
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[78%] space-y-1">
                {!isMe && (
                  <p className="text-[10px] font-semibold px-1" style={{ color: 'var(--text-tertiary)' }}>
                    {msg.from_name} → {msg.to === 'all' ? 'Everyone' : msg.to}
                  </p>
                )}
                <div className="px-3 py-2 text-sm"
                  style={{
                    background: bubbleColor(msg.from, isMe),
                    color: isMe ? '#ffffff' : '#1d1d1f',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                  {msg.text}
                </div>
                <p className={`text-[10px] px-1 ${isMe ? 'text-right' : 'text-left'}`}
                  style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(msg.time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 flex gap-2 items-end"
        style={{ background: 'var(--surface-card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--surface-border)', borderTop: 'none' }}>
        {role !== 'customer' && (
          <select className="input text-xs py-2 w-28 shrink-0"
            value={to} onChange={e => setTo(e.target.value as DemoMessage['to'])}>
            {toOptions.map(o => (
              <option key={o.value} value={o.value}>
                {o.value === 'all' ? 'Everyone' : `To: ${o.label}`}
              </option>
            ))}
          </select>
        )}
        <textarea
          className="input flex-1 resize-none text-sm"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type a message..."
          rows={1}
          style={{ minHeight: '40px', maxHeight: '80px', color: '#1d1d1f', background: '#fff' }}
        />
        <button onClick={send} disabled={!text.trim()} className="btn btn-primary px-3 py-2 shrink-0"
          style={{ borderRadius: '10px' }}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
