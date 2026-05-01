'use client';

import { useState, useRef, useEffect } from 'react';

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
    { role: 'assistant', content: `Hello${userName ? `, ${userName}` : ''}! I am EAVI, your AI assistant for East Africa Vision Institute. I can see you're logged in as ${userRole || 'a user'}. How can I assist you today?`, isDiagnostic: false, responseLabel: 'Information' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
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

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setLoadingMessage('Analyzing system data...');

    try {
      // Update loading message after initial delay
      setTimeout(() => {
        setLoadingMessage('Using Supabase memory...');
      }, 1500);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage, userId, campus, userRole, userName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        console.error('Status:', response.status, response.statusText);
        
        let errorMessage = 'Failed to get response';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        isDiagnostic: data.isDiagnostic,
        responseLabel: data.responseLabel,
        dataType: data.dataType,
        usedMemory: data.usedMemory
      }]);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to get response. Please try again.';
      setError(errorMsg);
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAnalyzeSystem = async () => {
    const analyzeMessage = 'Analyze the entire system for any issues or inconsistencies';
    setMessages(prev => [...prev, { role: 'user', content: analyzeMessage }]);
    setLoading(true);
    setLoadingMessage('Analyzing system data...');

    try {
      // Update loading message for system analysis
      setTimeout(() => {
        setLoadingMessage('Checking Supabase tables...');
      }, 1000);
      setTimeout(() => {
        setLoadingMessage('Analyzing system logs...');
      }, 2500);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: analyzeMessage, userId, campus, userRole, userName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        let errorMessage = 'Failed to get response';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        isDiagnostic: true,
        responseLabel: 'Full System Analysis',
        dataType: data.dataType,
        usedMemory: data.usedMemory
      }]);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to analyze system. Please try again.';
      setError(errorMsg);
      console.error('System analysis error:', err);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };
  
  // Format structured diagnostic response
  const formatDiagnosticResponse = (content: string): string => {
    // Check if content already has structured format
    if (content.includes('Possible Issue:') || content.includes('Cause:') || content.includes('Evidence:')) {
      return content;
    }
    
    // If it's a diagnostic response without structure, wrap it
    return content;
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-96 md:h-[500px] bg-white md:rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-purple-600 text-white p-4 md:rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">EAVI</h3>
                <p className="text-purple-200 text-sm">East Africa Vision Institute AI Assistant</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-500/50 rounded text-xs">EAVI AI</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-2 hover:bg-purple-500/50 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.isDiagnostic
                      ? 'bg-amber-50 text-gray-800 border-2 border-amber-300'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {msg.role === 'assistant' && msg.responseLabel && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`text-xs font-semibold ${
                        msg.isDiagnostic ? 'text-amber-600' : 'text-purple-600'
                      }`}>
                        {msg.responseLabel}
                        {msg.dataType && <span className="text-gray-500 font-normal ml-2">({msg.dataType})</span>}
                      </div>
                      {msg.usedMemory && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Using memory</span>
                      )}
                      {msg.isDiagnostic && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Diagnostic mode</span>
                      )}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.isDiagnostic ? (
                      <div className="space-y-2">
                        {msg.content.split('\n').map((line, i) => {
                          // Highlight structured diagnostic labels
                          if (line.match(/^(Possible Issue|Cause|Evidence|Suggested Fix):/i)) {
                            const [label, ...rest] = line.split(':');
                            return (
                              <div key={i} className="mt-3 first:mt-0">
                                <span className="font-bold text-amber-700">{label}:</span>
                                <span className="text-gray-700">{rest.join(':')}</span>
                              </div>
                            );
                          }
                          return <div key={i} className="text-gray-700">{line}</div>;
                        })}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-lg max-w-[80%]">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                    <span className="text-xs text-purple-600 ml-2 font-medium">{loadingMessage || 'Analyzing...'}</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 md:p-4 border-t border-gray-200 bg-white md:rounded-b-2xl space-y-3">
            <button
              onClick={handleAnalyzeSystem}
              disabled={loading}
              className="w-full px-4 py-3 md:py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-sm font-medium"
            >
              🔍 Analyze System
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question or describe an issue..."
                className="flex-1 px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-3 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
