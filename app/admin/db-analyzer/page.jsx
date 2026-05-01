'use client'
import { useState } from 'react'
import SchemaPanel from '@/components/SchemaPanel'
import HealthDashboard from '@/components/HealthDashboard'
import SuggestedPrompts from '@/components/SuggestedPrompts'
import MessageContent from '@/components/MessageContent'
import FixCard from '@/components/FixCard'

export default function DBAnalyzerPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [healthKey, setHealthKey] = useState(0) // forces HealthDashboard to refresh

  const handleSend = async (text) => {
    const userMessage = text || input
    if (!userMessage.trim()) return

    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    })

    const data = await res.json()

    setMessages([
      ...newMessages,
      {
        role: 'assistant',
        content: data.reply,
        fixes: data.fixes || [],
      },
    ])
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>

      {/* Left panel */}
      <div style={{ width: 220, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <SchemaPanel />
        <div style={{ borderTop: '1px solid #e5e7eb' }}>
          <HealthDashboard key={healthKey} />
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {messages.length === 0 && (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '4rem', fontSize: 14 }}>
              Ask anything about your database
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '75%',
                background: m.role === 'user' ? '#111' : '#f9fafb',
                color: m.role === 'user' ? 'white' : '#111',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 14,
              }}>
                {m.role === 'assistant' ? (
                  <>
                    <MessageContent content={m.content} />
                    {m.fixes && m.fixes.map((fix, fi) => (
                      <FixCard
                        key={fi}
                        fix={fix}
                        onApplied={() => setHealthKey(k => k + 1)}
                      />
                    ))}
                  </>
                ) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>
              Analyzing your database...
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '1rem' }}>
          <SuggestedPrompts onSelect={(text) => handleSend(text)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your database..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              style={{ padding: '10px 18px', borderRadius: 8, background: '#111', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
