'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState } from 'react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function MessageContent({ content }) {
  return (
    <ReactMarkdown
      components={{
        code({ inline, className, children }) {
          const lang = (className || '').replace('language-', '')
          if (inline) return <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{children}</code>
          return (
            <div style={{ position: 'relative', marginTop: 8 }}>
              <SyntaxHighlighter language={lang || 'sql'} style={oneLight}>
                {String(children).trim()}
              </SyntaxHighlighter>
              <CopyButton text={String(children).trim()} />
            </div>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
