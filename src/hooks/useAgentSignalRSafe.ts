"use client"

import { useAgentSignalR, AgentEventHandlers, UseAgentSignalRResult } from './useAgentSignalR'
import { useAuth } from '../contexts/AuthContext'
import AGENT_CONFIG from '../config/agent.config'

// Mock implementation when SignalR is disabled
const createMockSignalR = (handlers: AgentEventHandlers): UseAgentSignalRResult => {
  console.log('[SignalR] Mock mode - SignalR features disabled')
  
  const { token, isAuthenticated } = useAuth()
  
  return {
    connection: null,
    isConnected: false,
    subscribeToChat: async () => {
      console.log('[SignalR] Mock: subscribeToChat called (no-op)')
    },
    unsubscribeFromChat: async () => {
      console.log('[SignalR] Mock: unsubscribeFromChat called (no-op)')
    },
    startAgentLoop: async (chatId: string, prompt: string) => {
      console.log('[SignalR] Mock: startAgentLoop called, falling back to HTTP only')
      
      if (!isAuthenticated || !token) {
        handlers.onError?.('Authentication required for agent execution')
        return
      }
      
      // Still make the HTTP request to start the agent
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7210"
        const response = await fetch(`${API_BASE}/api/agent/chat/${chatId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prompt })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('[SignalR] Mock: Agent started successfully with JWT auth:', result)
          // Notify that we're in polling mode
          handlers.onError?.('Agent started in HTTP-only mode. Real-time updates are not available.')
        } else if (response.status === 401) {
          throw new Error('Authentication failed - JWT token may be expired. Please refresh the page.')
        } else if (response.status === 403) {
          throw new Error('Authorization failed - insufficient permissions.')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error('[SignalR] Mock: Agent start failed:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        handlers.onError?.(`Failed to start agent: ${errorMessage}`)
      }
    }
  }
}

// Smart hook that uses SignalR when available, falls back to mock when disabled
export function useAgentSignalRSafe(handlers: AgentEventHandlers): UseAgentSignalRResult {
  const shouldUseSignalR = AGENT_CONFIG.ENABLE_SIGNALR
  
  if (shouldUseSignalR) {
    return useAgentSignalR(handlers)
  } else {
    return createMockSignalR(handlers)
  }
}