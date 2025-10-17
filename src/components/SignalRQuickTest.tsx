"use client"

import React, { useState } from 'react'
import { useJwtSignalR } from '@/hooks/useJwtSignalR'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7210'

export default function SignalRQuickTest({ hubPath = '/hub/runs' }: { hubPath?: string }) {
  const hubUrl = hubPath.startsWith('http') ? hubPath : `${API_BASE}${hubPath}`
  const { status, error, messages, sendMessage } = useJwtSignalR(hubUrl)
  const [user, setUser] = useState('TestUser')
  const [text, setText] = useState('Hello, Hub!')

  return (
    <div className="p-4 border rounded-md space-y-3">
      <div>
        <div><strong>Hub URL:</strong> {hubUrl}</div>
        <div><strong>Status:</strong> {status}</div>
        {error && <div className="text-orange-600"><strong>Error:</strong> {error}</div>}
      </div>

      <div className="flex gap-2">
        <input className="border px-2 py-1" value={user} onChange={e => setUser(e.target.value)} placeholder="User" />
        <input className="border px-2 py-1 flex-1" value={text} onChange={e => setText(e.target.value)} placeholder="Message" />
        <button
          className={`px-3 py-1 rounded ${status === 'connected' ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          disabled={status !== 'connected'}
          onClick={() => sendMessage(user, text)}
        >
          SendMessage
        </button>
      </div>

      <div>
        <strong>Messages</strong>
        <div id="messages" className="mt-2 space-y-1">
          {messages.map((m, i) => (
            <div key={i} className="text-sm">{m.user}: {m.message}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
