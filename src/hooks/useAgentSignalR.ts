"use client"

import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useRef, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7210"

export interface AgentEvent {
  chatId: string
  step?: number
  userPrompt?: string
  historyCount?: number
  rawText?: string
  tool?: string
  args?: any
  result?: any
  fileName?: string
  downloadUrl?: string
  sizeBytes?: number
  plan?: AgentPlan
  text?: string
}

export interface AgentPlan {
  chatId: string
  goal: string
  steps: AgentPlanStep[]
}

export interface AgentPlanStep {
  id: number
  action: string
  rationale: string
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed'
}

export interface AgentEventHandlers {
  onStepStart?: (event: AgentEvent) => void
  onRawModel?: (event: AgentEvent) => void
  onToolStart?: (event: AgentEvent) => void
  onToolEnd?: (event: AgentEvent) => void
  onFileCreated?: (event: AgentEvent) => void
  onPlanCreated?: (event: AgentEvent) => void
  onPlanUpdated?: (event: AgentEvent) => void
  onFinalAnswer?: (event: AgentEvent) => void
  onError?: (error: string) => void
  onConnectionStateChanged?: (connected: boolean) => void
}

export interface UseAgentSignalRResult {
  connection: HubConnection | null
  isConnected: boolean
  subscribeToChat: (chatId: string) => Promise<void>
  unsubscribeFromChat: (chatId: string) => Promise<void>
  startAgentLoop: (chatId: string, prompt: string) => Promise<void>
}

export function useAgentSignalR(handlers: AgentEventHandlers): UseAgentSignalRResult {
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const connectionRef = useRef<HubConnection | null>(null)
  const isConnectedRef = useRef(false)
  const subscribedChatsRef = useRef<Set<string>>(new Set())
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Initialize connection
  const initializeConnection = useCallback(async () => {
    if (connectionRef.current || !isAuthenticated || retryCountRef.current >= maxRetries) return
    
    // Ensure we have a valid token before attempting connection
    if (!token) {
      console.warn('[SignalR] No JWT token available, cannot connect')
      handlers.onError?.('Authentication required for real-time features')
      return
    }

    try {
      const hubUrl = `${API_BASE}/hubs/agent-events`
      console.log('[SignalR] Initializing connection to:', hubUrl, 'Attempt:', retryCountRef.current + 1)
      
      const connectionBuilder = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => {
            // Always get fresh token for each request
            const currentToken = token
            if (!currentToken) {
              console.error('[SignalR] No token available for request')
              return ''
            }
            console.log('[SignalR] Providing JWT token for authentication')
            return currentToken
          },
          skipNegotiation: false,
          transport: 1, // WebSockets only
          headers: {
            'Authorization': `Bearer ${token}` // Also include in headers for fallback
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff with JWT re-authentication
            console.log(`[SignalR] Reconnect attempt ${retryContext.previousRetryCount + 1}`)
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000)
          }
        })
        .configureLogging(LogLevel.Warning)

      const connection = connectionBuilder.build()
      connectionRef.current = connection

      // Set up event handlers
      connection.on('step:start', (event: AgentEvent) => {
        console.log('[SignalR] step:start:', event)
        handlers.onStepStart?.(event)
      })

      connection.on('raw:model', (event: AgentEvent) => {
        console.log('[SignalR] raw:model:', event)
        handlers.onRawModel?.(event)
      })

      connection.on('tool:start', (event: AgentEvent) => {
        console.log('[SignalR] tool:start:', event)
        handlers.onToolStart?.(event)
      })

      connection.on('tool:end', (event: AgentEvent) => {
        console.log('[SignalR] tool:end:', event)
        handlers.onToolEnd?.(event)
      })

      connection.on('file:created', (event: AgentEvent) => {
        console.log('[SignalR] file:created:', event)
        handlers.onFileCreated?.(event)
      })

      connection.on('plan:created', (event: AgentEvent) => {
        console.log('[SignalR] plan:created:', event)
        handlers.onPlanCreated?.(event)
      })

      connection.on('plan:updated', (event: AgentEvent) => {
        console.log('[SignalR] plan:updated:', event)
        handlers.onPlanUpdated?.(event)
      })

      connection.on('final:answer', (event: AgentEvent) => {
        console.log('[SignalR] final:answer:', event)
        handlers.onFinalAnswer?.(event)
      })

      // Connection state handlers
      connection.onclose((error) => {
        console.log('[SignalR] Connection closed:', error)
        isConnectedRef.current = false
        handlers.onConnectionStateChanged?.(false)
        
        // Check if closure was due to auth failure
        if (error?.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.error('[SignalR] Connection closed due to authentication failure')
          handlers.onError?.('Authentication failed. Please login again.')
        }
      })

      connection.onreconnecting((error) => {
        console.log('[SignalR] Reconnecting...', error)
        isConnectedRef.current = false
        handlers.onConnectionStateChanged?.(false)
        
        // Log authentication context during reconnection
        if (token) {
          console.log('[SignalR] Reconnecting with valid JWT token')
        } else {
          console.warn('[SignalR] Reconnecting without JWT token - may fail')
        }
      })

      connection.onreconnected(() => {
        console.log('[SignalR] Reconnected successfully')
        isConnectedRef.current = true
        handlers.onConnectionStateChanged?.(true)
        
        // Resubscribe to chats after successful reconnection
        subscribedChatsRef.current.forEach(async (chatId) => {
          try {
            console.log(`[SignalR] Resubscribing to chat ${chatId} with fresh JWT token`)
            await connection.invoke('SubscribeToChat', chatId)
          } catch (error) {
            console.error(`[SignalR] Failed to resubscribe to chat ${chatId}:`, error)
          }
        })
      })

      // Start connection with timeout and JWT validation
      console.log('[SignalR] Starting connection with JWT authentication')
      const connectionPromise = connection.start()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds - JWT auth may have failed')), 10000)
      )
      
      await Promise.race([connectionPromise, timeoutPromise])
      
      isConnectedRef.current = true
      retryCountRef.current = 0 // Reset retry count on successful connection
      handlers.onConnectionStateChanged?.(true)
      console.log('[SignalR] Connection established successfully')
      
    } catch (error) {
      console.error('[SignalR] Failed to initialize connection:', error)
      retryCountRef.current += 1
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check for authentication-specific errors
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || 
          errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        console.error('[SignalR] Authentication failed - JWT token may be invalid or expired')
        handlers.onError?.('Authentication failed for real-time features. Please refresh the page.')
        return // Don't retry on auth failures
      }
      
      if (retryCountRef.current >= maxRetries) {
        console.warn(`[SignalR] Max retries (${maxRetries}) reached. SignalR features will be disabled.`)
        handlers.onError?.(`SignalR connection failed after ${maxRetries} attempts. Agent features may be limited.`)
      } else {
        console.log(`[SignalR] Will retry connection with fresh JWT token (attempt ${retryCountRef.current + 1}/${maxRetries})`)
        handlers.onError?.(`Failed to connect to agent events (attempt ${retryCountRef.current}/${maxRetries}): ${errorMessage}`)
      }
      
      isConnectedRef.current = false
      handlers.onConnectionStateChanged?.(false)
    }
  }, [isAuthenticated, token, handlers, maxRetries])

  // Clean up connection
  const cleanupConnection = useCallback(() => {
    if (connectionRef.current) {
      console.log('[SignalR] Cleaning up connection')
      try {
        connectionRef.current.stop()
      } catch (error) {
        console.warn('[SignalR] Error during cleanup:', error)
      }
      connectionRef.current = null
      isConnectedRef.current = false
      subscribedChatsRef.current.clear()
      retryCountRef.current = 0
    }
  }, [])

  // Subscribe to chat events
  const subscribeToChat = useCallback(async (chatId: string) => {
    if (!connectionRef.current || !isConnectedRef.current) {
      console.warn('[SignalR] Cannot subscribe - connection not ready')
      return
    }

    if (!token) {
      console.warn('[SignalR] Cannot subscribe - no JWT token available')
      handlers.onError?.('Authentication required for chat subscription')
      return
    }

    try {
      console.log(`[SignalR] Subscribing to chat: ${chatId} (with JWT auth)`)
      await connectionRef.current.invoke('SubscribeToChat', chatId)
      subscribedChatsRef.current.add(chatId)
      console.log(`[SignalR] Successfully subscribed to chat: ${chatId}`)
    } catch (error) {
      console.error(`[SignalR] Failed to subscribe to chat ${chatId}:`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        handlers.onError?.('Authentication failed for chat subscription. Please refresh the page.')
      } else {
        handlers.onError?.(`Failed to subscribe to chat: ${errorMessage}`)
      }
    }
  }, [handlers, token])

  // Unsubscribe from chat events
  const unsubscribeFromChat = useCallback(async (chatId: string) => {
    if (!connectionRef.current || !isConnectedRef.current) {
      return
    }

    try {
      console.log(`[SignalR] Unsubscribing from chat: ${chatId}`)
      await connectionRef.current.invoke('UnsubscribeFromChat', chatId)
      subscribedChatsRef.current.delete(chatId)
      console.log(`[SignalR] Successfully unsubscribed from chat: ${chatId}`)
    } catch (error) {
      console.error(`[SignalR] Failed to unsubscribe from chat ${chatId}:`, error)
    }
  }, [])

  // Start agent loop
  const startAgentLoop = useCallback(async (chatId: string, prompt: string) => {
    if (!isAuthenticated) {
      handlers.onError?.('Authentication required to start agent loop')
      return
    }

    if (!token) {
      handlers.onError?.('JWT token required to start agent loop')
      return
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      console.log(`[SignalR] Starting agent loop for chat ${chatId} with JWT authentication`)
      
      const response = await fetch(`${API_BASE}/api/agent/chat/${chatId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        const errorText = await response.text()
        
        if (response.status === 401) {
          throw new Error('Authentication failed - JWT token may be expired. Please refresh the page.')
        } else if (response.status === 403) {
          throw new Error('Authorization failed - insufficient permissions.')
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      }

      const result = await response.json()
      console.log('[SignalR] Agent loop started successfully:', result)
      
    } catch (error) {
      console.error('[SignalR] Failed to start agent loop:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      handlers.onError?.(`Failed to start agent: ${errorMessage}`)
    }
  }, [isAuthenticated, token, handlers])

  // Initialize connection on mount
  useEffect(() => {
    let mounted = true
    
    const tryInitialize = async () => {
      if (isAuthenticated && token && mounted) {
        await initializeConnection()
      }
    }
    
    if (!authLoading) {
      tryInitialize()
    }

    return () => {
      mounted = false
      cleanupConnection()
    }
  }, [isAuthenticated, token, initializeConnection, cleanupConnection])

  return {
    connection: connectionRef.current,
    isConnected: isConnectedRef.current,
    subscribeToChat,
    unsubscribeFromChat,
    startAgentLoop
  }
}