"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useAuth } from '@/contexts/AuthContext'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useJwtSignalR(hubPathOrUrl: string) {
  const { token, isAuthenticated } = useAuth()
  const connectionRef = useRef<HubConnection | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ user: string; message: string }>>([])

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7210'
  const hubUrl = hubPathOrUrl.startsWith('http') ? hubPathOrUrl : `${API_BASE}${hubPathOrUrl}`

  const start = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setStatus('disconnected')
      setError('Authentication required: missing JWT token')
      return
    }
    if (connectionRef.current) return

    try {
      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token || '',
          headers: { Authorization: `Bearer ${token}` },
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build()

      connection.on('ReceiveMessage', (user: string, message: string) => {
        setMessages(prev => [...prev, { user, message }])
      })

      connection.onreconnecting(err => {
        setStatus('connecting')
        setError(err?.message ?? null)
      })
      connection.onreconnected(() => {
        setStatus('connected')
        setError(null)
      })
      connection.onclose(err => {
        setStatus('disconnected')
        setError(err?.message ?? null)
        connectionRef.current = null
      })

      await connection.start()
      connectionRef.current = connection
      setStatus('connected')
      setError(null)
    } catch (err) {
      setStatus('disconnected')
      setError(err instanceof Error ? err.message : String(err))
      connectionRef.current = null
    }
  }, [hubUrl, isAuthenticated, token])

  const stop = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop().catch(() => {})
      connectionRef.current = null
      setStatus('disconnected')
    }
  }, [])

  const sendMessage = useCallback(async (user: string, message: string) => {
    if (!connectionRef.current) throw new Error('Not connected')
    await connectionRef.current.invoke('SendMessage', user, message)
  }, [])

  useEffect(() => {
    start()
    return () => { stop() }
  }, [start, stop])

  return { status, error, messages, sendMessage }
}
