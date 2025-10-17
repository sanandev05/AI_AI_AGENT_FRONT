"use client"

import { HubConnection, HubConnectionBuilder, LogLevel, HttpTransportType, HubConnectionState } from '@microsoft/signalr'
import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AGENT_CONFIG, { ENDPOINTS } from '../config/agent.config'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7210'

// Event union from backend doc
export type RunsEvent =
  | { $type: 'RunStarted'; runId: string; goal: string }
  | { $type: 'PermissionRequested'; runId: string; stepId: string; tool: string; reason?: string }
  | { $type: 'PermissionGranted'; runId: string; stepId: string }
  | { $type: 'PermissionDenied'; runId: string; stepId: string; reason?: string }
  | { $type: 'StepStarted'; runId: string; stepId: string; tool: string }
  | { $type: 'ToolOutput'; runId: string; stepId: string; summary: string }
  | { $type: 'StepSucceeded'; runId: string; stepId: string }
  | { $type: 'StepFailed'; runId: string; stepId: string; message: string; attempt?: number }
  | { $type: 'RunSucceeded'; runId: string; elapsed: { totalMinutes: number } }
  | { $type: 'RunFailed'; runId: string; message: string }
  | { $type: 'ArtifactCreated'; runId: string; artifact: { fileName: string; size?: number } }

export interface Narration {
  runId: string
  stepId: string // 'PLAN', 'FINAL', or a step id
  message: string
}

export interface RunsHubHandlers {
  onEvent?: (evt: RunsEvent) => void
  onNarration?: (n: Narration) => void
  onError?: (error: string) => void
  onConnectionStateChanged?: (connected: boolean) => void
}

export interface UseRunsHubResult {
  connection: HubConnection | null
  isConnected: boolean
  currentRunId: string | null
  startRun: (goal: string, taskId?: string, model?: { key: string, provider: string }) => Promise<string | null>
  join: (runId: string) => Promise<void>
  approve: (stepId: string) => Promise<void>
  deny: (stepId: string, reason?: string) => Promise<void>
}

export function useRunsHub(handlers: RunsHubHandlers): UseRunsHubResult {
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const connectionRef = useRef<HubConnection | null>(null)
  const isConnectedRef = useRef(false)
  const currentRunIdRef = useRef<string | null>(null)
  const retryCountRef = useRef(0)
  const startingRef = useRef(false)
  const maxRetries = AGENT_CONFIG.SIGNALR_MAX_RETRIES ?? 3

  const initializeConnection = useCallback(async () => {
    // Avoid parallel starts or unnecessary retries
    if (startingRef.current) return
    if (connectionRef.current &&
        (connectionRef.current.state === HubConnectionState.Connected ||
         connectionRef.current.state === HubConnectionState.Connecting)) {
      return
    }
    if (!isAuthenticated || retryCountRef.current >= maxRetries) return

    if (!token) {
      handlers.onError?.('Authentication required for real-time features')
      return
    }

    try {
      startingRef.current = true
      // Use agent-events hub instead of runs hub
      const hubUrl = `${API_BASE}${AGENT_CONFIG.AGENT_EVENTS_HUB_URL}`

      const builder = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token || '',
          // Force WebSockets to avoid flaky negotiate issues across proxies/dev servers
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) => Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000)
        })
        .configureLogging(LogLevel.Warning)

      const connection = builder.build()
      connectionRef.current = connection

      const normalizeEvent = (raw: any): RunsEvent => {
        const t = raw?.$type || raw?.type || raw?.eventType
        if (!t) return raw as RunsEvent
        return { $type: t, ...raw }
      }
      const normalizeNarration = (raw: any): Narration => {
        return {
          runId: raw?.runId ?? raw?.RunId ?? '',
          stepId: raw?.stepId ?? raw?.StepId ?? '',
          message: raw?.message ?? raw?.Message ?? ''
        }
      }

      // Agent Events Hub listeners (matching working test-agent.html pattern)
      connection.on('tool:start', (event: any) => {
        console.log('� tool:start', event);
        handlers.onNarration?.({
          runId: currentRunIdRef.current || '',
          stepId: event.step || '',
          message: `🔧 Starting ${event.tool}...`
        });
      });

      connection.on('tool:end', (event: any) => {
        console.log('✅ tool:end', event);
        handlers.onNarration?.({
          runId: currentRunIdRef.current || '',
          stepId: event.step || '',
          message: `✅ ${event.tool} completed`
        });
      });

      connection.on('final:answer', (event: any) => {
        console.log('🎉 final:answer', event);
        handlers.onNarration?.({
          runId: currentRunIdRef.current || '',
          stepId: 'FINAL',
          message: `🎉 Agent: ${event.text}`
        });
      });

      connection.on('step:start', (event: any) => {
        console.log('� step:start', event);
        handlers.onNarration?.({
          runId: currentRunIdRef.current || '',
          stepId: event.step || '',
          message: `📊 Step ${event.step}: Processing...`
        });
      });

      connection.on('raw:model', (event: any) => {
        console.log('🤖 raw:model', event);
        const text = event.rawText?.substring(0, 200) || '';
        if (text) {
          handlers.onNarration?.({
            runId: currentRunIdRef.current || '',
            stepId: '',
            message: `🤖 Model: ${text}${event.rawText?.length > 200 ? '...' : ''}`
          });
        }
      });

      connection.on('file:created', (event: any) => {
        console.log('📁 file:created', event);
        const runId = currentRunIdRef.current || ''
        const fileName: string | undefined = event?.fileName || event?.name
        const sizeBytes: number | undefined = event?.sizeBytes ?? event?.size

        // 1) Emit a structured event so the UI can show a download chip inline
        if (fileName) {
          handlers.onEvent?.({
            $type: 'ArtifactCreated',
            runId,
            artifact: { fileName, size: sizeBytes }
          })
        }

        // 2) Also keep a lightweight narration line for context
        if (fileName && typeof sizeBytes === 'number') {
          handlers.onNarration?.({
            runId,
            stepId: '',
            message: `📁 Created: ${fileName} (${(sizeBytes / 1024).toFixed(1)} KB)`
          })
        } else if (fileName) {
          handlers.onNarration?.({
            runId,
            stepId: '',
            message: `📁 Created: ${fileName}`
          })
        }
      });

      connection.on('plan:created', (event: any) => {
        console.log('📋 plan:created', event);
        handlers.onNarration?.({
          runId: currentRunIdRef.current || '',
          stepId: 'PLAN',
          message: `📋 Plan created`
        });
      });

      connection.on('plan:updated', (event: any) => {
        console.log('📋 plan:updated', event);
        handlers.onNarration?.({
          runId: currentRunIdRef.current || '',
          stepId: 'PLAN',
          message: `📋 Plan updated`
        });
      });

      connection.on('timeline:log', (event: any) => {
        console.log('📊 timeline:log', event);
        handlers.onNarration?.({
          runId: currentRunIdRef.current || '',
          stepId: '',
          message: `📊 ${event.message}`
        });
      });

      // Legacy event listeners (kept for backward compatibility)
      const onEvt = (raw: any) => {
        console.log('📨 Raw "event" or "Event" received:', raw);
        handlers.onEvent?.(normalizeEvent(raw));
      }
      const onNarr = (raw: any) => {
        console.log('💬 Raw "narration" or "Narration" received:', raw);
        handlers.onNarration?.(normalizeNarration(raw));
      }
      
      connection.on('event', onEvt)
      connection.on('Event', onEvt)
      connection.on('narration', onNarr)
      connection.on('Narration', onNarr)

      connection.onclose((error) => {
        isConnectedRef.current = false
        handlers.onConnectionStateChanged?.(false)
        if (error) {
          const msg = error.message || String(error)
          if (msg.includes('401') || msg.includes('403')) {
            handlers.onError?.('Authentication failed for runs hub. Please sign in again.')
          }
        }
      })

      connection.onreconnecting(() => {
        isConnectedRef.current = false
        handlers.onConnectionStateChanged?.(false)
      })

      connection.onreconnected(async () => {
        isConnectedRef.current = true
        handlers.onConnectionStateChanged?.(true)
        // Re-join current run if any
        if (currentRunIdRef.current) {
          try { await connection.invoke('Join', currentRunIdRef.current) } catch {}
        }
      })

  const startPromise = connection.start()
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), AGENT_CONFIG.SIGNALR_TIMEOUT || 10000))
      await Promise.race([startPromise, timeoutPromise])

      isConnectedRef.current = true
      retryCountRef.current = 0
      handlers.onConnectionStateChanged?.(true)

    } catch (err) {
      retryCountRef.current += 1
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('401') || msg.includes('403')) {
        handlers.onError?.('Authentication failed for real-time features. Please refresh the page.')
        return
      }
      if (retryCountRef.current >= maxRetries) {
        handlers.onError?.(`Runs hub connection failed after ${maxRetries} attempts`)
      } else {
        handlers.onError?.(`Runs hub connection failed: ${msg}`)
      }
      isConnectedRef.current = false
      handlers.onConnectionStateChanged?.(false)
    }
    finally {
      startingRef.current = false
    }
  }, [isAuthenticated, token, handlers, maxRetries])

  const cleanupConnection = useCallback(() => {
    if (connectionRef.current) {
      try { connectionRef.current.stop() } catch {}
      connectionRef.current = null
      isConnectedRef.current = false
    }
  }, [])

  const join = useCallback(async (runId: string) => {
    if (!connectionRef.current || !isConnectedRef.current) return
    try {
      await connectionRef.current.invoke('Join', runId)
      currentRunIdRef.current = runId
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      handlers.onError?.(`Join failed: ${msg}`)
    }
  }, [handlers])

  const startRun = useCallback(async (goal: string, taskId?: string, model?: { key: string, provider: string }) => {
    if (!isAuthenticated) {
      handlers.onError?.('Authentication required to start a run')
      return null
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      console.log('🚀 Starting agent run with goal:', goal)

      // Step 1: Create a new chat
      console.log('📡 Creating new chat...')
      const chatResponse = await fetch(`${API_BASE}/api/chat/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: goal.substring(0, 50) }),
      })

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text()
        console.error('❌ Chat creation failed:', chatResponse.status, errorText)
        throw new Error(`Failed to create chat: ${chatResponse.status}`)
      }

      const chatData = await chatResponse.json()
      const chatId = chatData.chatGuid || chatData.chatId || chatData.id
      currentRunIdRef.current = chatId

      console.log('✅ Chat created with ID:', chatId)

      // Step 2: Subscribe to chat events via SignalR
      if (connectionRef.current && isConnectedRef.current) {
        console.log('📡 Subscribing to chat:', chatId)
        await connectionRef.current.invoke('SubscribeToChat', chatId)
        console.log('✅ Subscribed to chat successfully')
      }

      // Step 3: Start the agent
      console.log('📡 Starting agent with prompt:', goal)
      const agentResponse = await fetch(`${API_BASE}/api/agent/chat/${chatId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: goal,
        }),
      })

      if (!agentResponse.ok) {
        const errorText = await agentResponse.text()
        console.error('❌ Agent start failed:', agentResponse.status, errorText)
        throw new Error(`Failed to start agent: ${agentResponse.status}`)
      }

      console.log('✅ Agent started successfully')
      return chatId
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      handlers.onError?.(`Failed to start run: ${msg}`)
      return null
    }
  }, [isAuthenticated, token, handlers])

  const approve = useCallback(async (stepId: string) => {
    if (!connectionRef.current || !isConnectedRef.current || !currentRunIdRef.current) return
    try {
      await connectionRef.current.invoke('Grant', currentRunIdRef.current, stepId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      handlers.onError?.(`Grant failed: ${msg}`)
    }
  }, [handlers])

  const deny = useCallback(async (stepId: string, reason?: string) => {
    if (!connectionRef.current || !isConnectedRef.current || !currentRunIdRef.current) return
    try {
      await connectionRef.current.invoke('Deny', currentRunIdRef.current, stepId, reason ?? 'Denied by user')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      handlers.onError?.(`Deny failed: ${msg}`)
    }
  }, [handlers])

  // Attempt to initialize when auth state becomes ready
  useEffect(() => {
    if (!authLoading && isAuthenticated && token) {
      initializeConnection()
    }
    // no cleanup here; keep connection alive across re-renders
  }, [authLoading, isAuthenticated, token, initializeConnection])

  // In dev (React StrictMode), components mount/unmount twice; avoid stop/start race.
  // Keep the connection alive and only stop on page unload.
  useEffect(() => {
    const onUnload = () => {
      cleanupConnection()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', onUnload)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', onUnload)
      }
    }
  }, [cleanupConnection])

  return {
    connection: connectionRef.current,
    isConnected: isConnectedRef.current,
    currentRunId: currentRunIdRef.current,
    startRun,
    join,
    approve,
    deny,
  }
}
