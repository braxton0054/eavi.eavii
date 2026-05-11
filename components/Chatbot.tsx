'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isDiagnostic?: boolean;
  responseLabel?: string;
  dataType?: string;
  usedMemory?: boolean;
}

interface ChatbotProps {
  userId?: string;
  campus?: string;
  userEmail?: string;
  userRole?: string;
  userName?: string;
}

export default function Chatbot({ userId = '00000000-0000-0000-0000-000000000000', campus = 'main', userEmail = '', userRole = '', userName = '' }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello${userName ? `, ${userName}` : ''}! I am **EAVI System Diagnostic**. I can help you analyze system data, test API endpoints, check student records, and more.\n\nHow can I assist you today?`, isDiagnostic: false, responseLabel: 'Welcome' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 380, h: 520 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const sizeStart = useRef({ w: 380, h: 520, x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setLoadingMessage('Analyzing...');

    try {
      setTimeout(() => setLoadingMessage('Checking data...'), 1500);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, userId, campus, userRole, userName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to get response';
        try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorData.details || errorMessage; }
        catch (e) { errorMessage = errorText || errorMessage; }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', content: data.response,
        isDiagnostic: data.isDiagnostic, responseLabel: data.responseLabel,
        dataType: data.dataType, usedMemory: data.usedMemory
      }]);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to get response. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };


  const testEndpoints = async () => {
    const SB = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wgbaadgxtjyhpnntogzf.supabase.co';
    const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const sbHeaders = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` };

    const endpoints = [
      { name: 'Chat API',           url: '/api/chat',                method: 'POST', body: { message: 'ping' } },
      { name: 'DB Health',          url: '/api/db-health',           method: 'GET' },
      { name: 'Schema',             url: '/api/schema',              method: 'GET' },
      { name: 'Notifications',      url: '/api/notifications',        method: 'GET' },
      { name: 'Notif. Logs',        url: '/api/notification-logs',    method: 'GET' },
      { name: 'Announcements',      url: '/api/announcements',        method: 'GET' },
      { name: 'Bridge Groups',      url: '/api/bridge-groups',       method: 'GET' },
      { name: 'Bursary',            url: '/api/bursary',              method: 'GET' },
      { name: 'Execute Fix',        url: '/api/execute-fix',         method: 'POST', body: { sql: 'SELECT 1', description: 'test', dry_run: true } },
      { name: 'Send Alert',         url: '/api/send-alert-email',     method: 'POST', body: { alerts: [{ id: 'test', message: 'test', severity: 'info' }], alertType: 'test', systemInfo: { hostname: 'test', uptime: 0 } } },
      { name: 'Courses',            url: `${SB}/rest/v1/courses?select=id,name&limit=3`,        method: 'GET', headers: sbHeaders },
      { name: 'Lecturers',          url: `${SB}/rest/v1/lecturers?select=id,full_name&limit=3`, method: 'GET', headers: sbHeaders },
      { name: 'Applications',       url: `${SB}/rest/v1/applications?select=id,full_name&limit=3`, method: 'GET', headers: sbHeaders },
      { name: 'Student Profiles',   url: `${SB}/rest/v1/student_profiles?select=id&limit=3`,      method: 'GET', headers: sbHeaders },
      { name: 'Fee Payments',       url: `${SB}/rest/v1/fee_payments?select=id,amount&limit=3`,    method: 'GET', headers: sbHeaders },
      { name: 'Classes',            url: `${SB}/rest/v1/classes?select=id,class_name&limit=3`,     method: 'GET', headers: sbHeaders },
      { name: 'Semesters',          url: `${SB}/rest/v1/semesters?select=id,fee&limit=3`,           method: 'GET', headers: sbHeaders },
      { name: 'Guardians',          url: `${SB}/rest/v1/guardians?select=id&limit=3`,               method: 'GET', headers: sbHeaders },
      { name: 'Enrollments',        url: `${SB}/rest/v1/applications?select=id,status&status=eq.enrolled&limit=3`, method: 'GET', headers: sbHeaders },
    ];

    setMessages(prev => [...prev, { role: 'user', content: 'Test all system endpoints' }]);
    setLoading(true);
    setLoadingMessage('Testing endpoints...');

    const results = [];
    for (const ep of endpoints) {
      try {
        const start = performance.now();
        const headers = ep.headers || { 'Content-Type': 'application/json' };
        const res = await fetch(ep.url, { method: ep.method, headers, ...(ep.body ? { body: JSON.stringify(ep.body) } : {}), signal: AbortSignal.timeout(5000) });
        results.push({ name: ep.name, status: res.status, ok: res.ok, time: Math.round(performance.now() - start) });
      } catch (e: any) {
        results.push({ name: ep.name, status: 'ERR', ok: false, time: -1, error: e.message });
      }
    }

    const passed = results.filter(r => r.ok);
    const failed = results.filter(r => !r.ok);
    let content = `### 📊 System Test: ${passed.length}/${results.length}\n\n`;
    if (failed.length > 0) {
      content += '**❌ Failed:**\n';
      for (const r of failed) {
        content += `• ${r.name} — ${r.status} ${(r.error || '').slice(0,40)}\n`;
      }
      content += '\n';
    }
    content += `**✅ Passed (${passed.length}):**\n`;
    for (const r of passed) {
      content += `• ${r.name} (${r.time}ms)\n`;
    }

    setMessages(prev => [...prev, { role: 'assistant', content, isDiagnostic: true, responseLabel: 'System Test' }]);
    setLoading(false);
  };

  // ── Drag handlers ──
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging]);

  // ── Resize handlers ──
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    sizeStart.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dw = e.clientX - sizeStart.current.x;
      const dh = e.clientY - sizeStart.current.y;
      setSize({ w: Math.max(300, sizeStart.current.w + dw), h: Math.max(350, sizeStart.current.h + dh) });
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isResizing]);

  const quickActions = [
    { label: '📊 Test All APIs', action: testEndpoints, color: 'bg-emerald-600 hover:bg-emerald-700' },
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-12 h-12 md:w-14 md:h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50 hover:scale-105 active:scale-95"
        aria-label="Toggle AI assistant"
      >
        {isOpen ? (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden"
          style={{
            left: position.x ? position.x + 'px' : 'auto',
            right: position.x ? 'auto' : '20px',
            bottom: position.y ? position.y + 'px' : '80px',
            top: position.y ? 'auto' : 'auto',
            width: size.w + 'px',
            height: size.h + 'px',
          }}
        >
          {/* Header — drag handle */}
          <div
            className="bg-white border-b border-gray-200 px-4 py-3 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">E</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">EAVI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-gray-500">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Expand to fullscreen */}
                <button
                  onClick={() => setSize(size.w === 780 ? { w: 380, h: 520 } : { w: 780, h: 700 })}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {size.w > 600
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    }
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
                  {/* Label for assistant messages */}
                  {msg.role === 'assistant' && msg.responseLabel && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${msg.isDiagnostic ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {msg.responseLabel}
                      </span>
                      {msg.isDiagnostic && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded border border-amber-200">Diagnostic</span>
                      )}
                      {msg.usedMemory && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200">Memory</span>
                      )}
                    </div>
                  )}
                  <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : msg.isDiagnostic
                      ? 'bg-white text-gray-800 border border-amber-200 shadow-sm rounded-bl-sm'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900 prose-table:text-xs">
                        {msg.content.split('\n').map((line, i) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={i} className="text-sm font-bold text-gray-900 mt-3 mb-1.5">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('| ') && line.endsWith(' |')) {
                            return null; // Skip raw markdown table rows
                          }
                          if (line.startsWith('| ---')) {
                            return null; // Skip markdown table separators
                          }
                          if (line.startsWith('|')) {
                            const cells = line.split('|').filter(c => c.trim());
                            if (cells.length >= 3) {
                              return (
                                <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-0 text-xs">
                                  <span className="w-3">{cells[0].trim()}</span>
                                  <span className="flex-1 font-medium">{cells[1].trim()}</span>
                                  <span className="text-gray-500">{cells[2].trim()}</span>
                                </div>
                              );
                            }
                          }
                          if (line.match(/^\*\*.*\*\*/)) {
                            return <p key={i} className="font-semibold text-gray-900 py-1">{line.replace(/\*\*/g, '')}</p>;
                          }
                          if (line.trim()) {
                            return <p key={i} className="text-gray-700 py-0.5 leading-relaxed">{line}</p>;
                          }
                          return <div key={i} className="h-1.5" />;
                        })}
                      </div>
                    ) : (
                      <p className="leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{loadingMessage || 'Thinking...'}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs max-w-[90%] flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-white md:rounded-b-2xl p-3 space-y-2.5">
            {/* Quick Actions */}
            <div className="flex gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  disabled={loading}
                  className={`flex-1 px-3 py-2 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask a question..."
                className="flex-1 min-h-[40px] max-h-[80px] resize-none text-sm bg-gray-50"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
          >
            <svg className="w-3 h-3 text-gray-400 absolute bottom-1 right-1" viewBox="0 0 12 12" fill="currentColor">
              <path d="M0 12h12V0L0 12z" />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
