"use client"

import React from 'react'
import SignalRQuickTest from '@/components/SignalRQuickTest'

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-4">SignalR Quick Test</h1>
      <p className="text-sm text-gray-600 mb-4">This page tries to connect to your hub with JWT auth and lets you send a test message.</p>
      <SignalRQuickTest />
    </div>
  )
}
