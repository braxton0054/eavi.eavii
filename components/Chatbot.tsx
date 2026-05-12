"use client";
// components/ChatBot.tsx
// Drop this anywhere in your layout — it floats in the bottom-right corner.
// Usage: <ChatBot userId={session.user.id} userName={profile.full_name} userRole={profile.user_role} />

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: Date;
}

interface ChatBotProps {
  userId: string;
  userName?: string;
  userRole?: "super_admin" | "admin" | "lecturer" | "staff" | "student";
  campus?: string;
  userEmail?: string;
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  student: [
    "What is my current fee balance?",
    "When is my next payment due?",
    "What are my current semester units?",
    "When does the next term start?",
  ],
  admin: [
    "How many active students are enrolled?",
    "Show pending fee payments",
    "List upcoming exam dates",
    "Which students are on financial hold?",
  ],
  lecturer: [
    "What classes am I assigned to?",
    "Show my unit assignments this term",
    "When are the CAT dates?",
    "List students in my class",
  ],
  default: [
    "What courses do you offer?",
    "How do I apply for admission?",
    "What are the fee structures?",
    "When is the next intake?",
  ],
};

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#94a3b8",
            display: "inline-block",
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code style="background:#1e293b;padding:1px 5px;border-radius:3px;font-size:0.85em;font-family:monospace">$1</code>')
    .replace(/^- (.+)/gm, '<li style="margin-left:12px;margin-bottom:3px">• $1</li>')
    .replace(/\n\n/g, "</p><p style='margin:6px 0'>")
    .replace(/\n/g, "<br/>");
}

export default function ChatBot({ userId, userName = "User", userRole = "student" }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = SUGGESTED_QUESTIONS[userRole] || SUGGESTED_QUESTIONS.default;

  // Load history on mount
  useEffect(() => {
    if (!userId || historyLoaded) return;
    fetch(`/api/chat?userId=${userId}`)
      .then((r) => r.json())
      .then(({ history }) => {
        if (history?.length) {
          setMessages(
            history.map((h: { role: "user" | "assistant"; message: string; created_at: string }, i: number) => ({
              id: `hist-${i}`,
              role: h.role,
              text: h.message,
              ts: new Date(h.created_at),
            }))
          );
        } else {
          // Welcome message
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              text: `Hello **${userName}**! 👋 I'm the EAVI College Assistant. I can help you with fee balances, course info, exam schedules, and more.\n\nWhat can I help you with today?`,
              ts: new Date(),
            },
          ]);
        }
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, [userId, userName, historyLoaded]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!open && messages.length > 0 && messages[messages.length - 1]?.role === "assistant") {
      setUnread((u) => u + 1);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setInput("");

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text: text.trim(),
        ts: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      // Build history for context (last 20 messages)
      const recentHistory = messages
        .slice(-20)
        .map((m) => ({ role: m.role, message: m.text }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), userId, history: recentHistory }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: data.reply || "Sorry, I couldn't process that. Please try again.",
            ts: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            ts: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, userId]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: "cleared",
        role: "assistant",
        text: "Chat cleared. How can I help you?",
        ts: new Date(),
      },
    ]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        .chat-msg { animation: fadeIn 0.25s ease forwards; }
        .chat-input:focus { outline: none; }
        .suggestion-chip:hover { background: #0f766e !important; color: white !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      {/* Floating Button */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          left: 0,
          top: 0,
          zIndex: 9999,

          fontFamily: "'DM Sans', sans-serif",
          display: open ? "block" : "contents",
        }}
      >
        {/* Chat Window */}
        {open && (
          <div
            style={{
              position: "absolute",
              bottom: 90,
              right: 20,
              width: "min(calc(100vw - 40px), 400px)",
              height: "min(calc(100vh - 140px), 600px)",
              background: "#0f172a",
              borderRadius: 20,
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🎓
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>
                  EAVI Assistant
                </div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 1 }}>
                  {loading ? "Thinking..." : "Online · College AI"}
                </div>
              </div>
              <button
                onClick={clearHistory}
                title="Clear chat"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  cursor: "pointer",
                  padding: "5px 8px",
                  fontSize: 13,
                  marginRight: 4,
                }}
              >
                🗑
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  cursor: "pointer",
                  padding: "5px 8px",
                  fontSize: 15,
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {!historyLoaded ? (
                <div style={{ color: "#64748b", textAlign: "center", marginTop: 40, fontSize: 14 }}>
                  Loading your chat history...
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="chat-msg"
                    style={{
                      display: "flex",
                      flexDirection: msg.role === "user" ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      gap: 8,
                    }}
                  >
                    {msg.role === "assistant" && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#0d9488,#0891b2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        🎓
                      </div>
                    )}
                    <div style={{ maxWidth: "78%" }}>
                      <div
                        style={{
                          background: msg.role === "user" ? "linear-gradient(135deg,#0d9488,#0891b2)" : "#1e293b",
                          color: msg.role === "user" ? "white" : "#e2e8f0",
                          borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          padding: "10px 14px",
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                      />
                      <div
                        style={{
                          color: "#475569",
                          fontSize: 10.5,
                          marginTop: 4,
                          textAlign: msg.role === "user" ? "right" : "left",
                          paddingLeft: 4,
                          paddingRight: 4,
                        }}
                      >
                        {formatTime(msg.ts)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="chat-msg" style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#0d9488,#0891b2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                    }}
                  >
                    🎓
                  </div>
                  <div
                    style={{
                      background: "#1e293b",
                      borderRadius: "18px 18px 18px 4px",
                      padding: "12px 16px",
                    }}
                  >
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions (show only when few messages) */}
            {messages.length <= 1 && (
              <div
                style={{
                  padding: "0 14px 10px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => sendMessage(s)}
                    style={{
                      background: "transparent",
                      border: "1px solid #0d9488",
                      color: "#0d9488",
                      borderRadius: 20,
                      padding: "5px 11px",
                      fontSize: 11.5,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid #1e293b",
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
                background: "#0f172a",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="chat-input"
                style={{
                  flex: 1,
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 14,
                  padding: "10px 14px",
                  color: "#e2e8f0",
                  fontSize: 13.5,
                  fontFamily: "'DM Sans', sans-serif",
                  resize: "none",
                  lineHeight: 1.5,
                  maxHeight: 100,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background:
                    !input.trim() || loading
                      ? "#1e293b"
                      : "linear-gradient(135deg,#0d9488,#0891b2)",
                  border: "none",
                  cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                  color: "white",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: open
              ? "#1e293b"
              : "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
            border: "none",
            cursor: "pointer",
            boxShadow: open
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(13,148,136,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color: "white",
            transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            animation: !open ? "pulse 2s ease-in-out infinite" : "none",
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 10000,
          }}
        >
          {open ? "✕" : "🎓"}
          {unread > 0 && !open && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#ef4444",
                color: "white",
                borderRadius: "50%",
                width: 20,
                height: 20,
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {unread}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
