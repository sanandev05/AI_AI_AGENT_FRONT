"use client"

import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'
import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AGENT_CONFIG from '../config/agent.config'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7210'

export interface AgentEventsHandlers {
  onConnected?: () => void
  onDisconnected?: (error?: string) => void
  onError?: (message: string) => void
}

export interface UseAgentEventsHubResult {
  connection: HubConnection | null
  isConnected: boolean
  subscribeToChat: (chatId: string) => Promise<void>
  unsubscribeFromChat: (chatId: string) => Promise<void>
}

export function useAgentEventsHub(handlers: AgentEventsHandlers = {}): UseAgentEventsHubResult {
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const connectionRef = useRef<HubConnection | null>(null)
  const connectedRef = useRef(false)
  const retryRef = useRef(0)

  const init = useCallback(async () => {
    if (connectionRef.current || !isAuthenticated) return
    if (!token) {
      handlers.onError?.('Authentication required for AgentEvents hub')
      return
    }

    try {
      const hubUrl = `${API_BASE}${AGENT_CONFIG.AGENT_EVENTS_HUB_URL}`
      const builder = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token || '',
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)

      const connection = builder.build()
      connectionRef.current = connection

      connection.onclose((err) => {
        connectedRef.current = false
        handlers.onDisconnected?.(err?.message)
      })
      connection.onreconnected(() => {
        connectedRef.current = true
        handlers.onConnected?.()
      })

      await connection.start()
      connectedRef.current = true
      handlers.onConnected?.()
    } catch (e) {
      retryRef.current += 1
      handlers.onError?.(`AgentEvents connection failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [isAuthenticated, token, handlers])

  const cleanup = useCallback(() => {
    if (connectionRef.current) {
      try { connectionRef.current.stop() } catch {}
      connectionRef.current = null
      connectedRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const go = async () => {
      if (!authLoading && isAuthenticated && token && mounted) {
        await init()
      }
    }
    go()
    return () => { mounted = false; cleanup() }
  }, [authLoading, isAuthenticated, token, init, cleanup])

  const subscribeToChat = useCallback(async (chatId: string) => {
    if (!connectionRef.current || !connectedRef.current) return
    try { await connectionRef.current.invoke('SubscribeToChat', chatId) } catch (e) {
      handlers.onError?.(`Subscribe failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [handlers])

  const unsubscribeFromChat = useCallback(async (chatId: string) => {
    if (!connectionRef.current || !connectedRef.current) return
    try { await connectionRef.current.invoke('UnsubscribeFromChat', chatId) } catch (e) {
      handlers.onError?.(`Unsubscribe failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [handlers])

  return {
    connection: connectionRef.current,
    isConnected: connectedRef.current,
    subscribeToChat,
    unsubscribeFromChat,
  }
}
