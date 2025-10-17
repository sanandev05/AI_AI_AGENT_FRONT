"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { 
  Bot, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  Zap,
  Brain,
  ChevronRight,
  ChevronDown,
  Loader
} from 'lucide-react'
import { useRunsHub } from '../hooks/useRunsHub'
import { ENDPOINTS } from '../config/agent.config'
import type { RunsEvent, Narration } from '../hooks/useRunsHub'
import ArtifactDisplay, { type ArtifactData } from './ArtifactDisplay'

// Keep plan types for UI compatibility; new events don't send full plan structure
interface AgentPlan {
  chatId: string
  goal: string
  steps: AgentPlanStep[]
}
interface AgentPlanStep {
  id: number
  action: string
  rationale: string
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed'
}

export interface AgentChatProps {
  chatId: string
  darkMode?: boolean
  onFileCreated?: (fileName: string, downloadUrl: string) => void
  onMessageAdded?: (message: { role: 'user' | 'assistant', content: string }) => void
}

interface AgentMessage {
  id: string
  type: 'user' | 'agent' | 'step' | 'tool' | 'file' | 'plan' | 'final' | 'system'
  content: string
  timestamp: Date
  step?: number
  tool?: string
  toolArgs?: any
  toolResult?: any
  fileName?: string
  downloadUrl?: string
  fileSize?: number
  plan?: AgentPlan
  rawContent?: string[]
  stepId?: string
}

export type AgentChatHandle = {
  // Start an agent run with the provided goal text
  start: (goal: string) => Promise<void>
}

const AgentChat = forwardRef<AgentChatHandle, AgentChatProps>(function AgentChat(
  { chatId, darkMode = false, onFileCreated, onMessageAdded }: AgentChatProps,
  ref
) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7210'
  
  const addDebugLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-20), `[${timestamp}] ${msg}`])
    console.log(`[AgentChat Debug] ${msg}`)
  }

  // Helper to add message to main chat
  const addToMainChat = useCallback((role: 'user' | 'assistant', content: string) => {
    if (onMessageAdded) {
      onMessageAdded({ role, content })
    }
  }, [onMessageAdded])

  // SignalR event handlers
  const runsHub = useRunsHub({
    onEvent: (evt: RunsEvent) => {
      addDebugLog(`🎯 Event: ${evt.$type}`)
      console.log('🎯 Event received:', evt.$type, evt)
      switch (evt.$type) {
        case 'RunStarted': {
          addDebugLog(`Run started with goal: ${evt.goal}`)
          setMessages(prev => [...prev, {
            id: `run-${evt.runId}-${Date.now()}`,
            type: 'system',
            content: `🎯 Run started: ${evt.goal}`,
            timestamp: new Date()
          }])
          break
        }
        case 'PermissionRequested': {
          setMessages(prev => [...prev, {
            id: `perm-${evt.stepId}-${Date.now()}`,
            type: 'tool',
            content: `Permission requested for ${evt.tool}${evt.reason ? ` — ${evt.reason}` : ''}`,
            timestamp: new Date(),
            stepId: evt.stepId,
            tool: evt.tool
          }])
          break
        }
        case 'PermissionGranted': {
          setMessages(prev => [...prev, {
            id: `perm-granted-${evt.stepId}-${Date.now()}`,
            type: 'step',
            content: `Permission granted for step ${evt.stepId}`,
            timestamp: new Date()
          }])
          break
        }
        case 'PermissionDenied': {
          setMessages(prev => [...prev, {
            id: `perm-denied-${evt.stepId}-${Date.now()}`,
            type: 'step',
            content: `Permission denied for step ${evt.stepId}${evt.reason ? ` — ${evt.reason}` : ''}`,
            timestamp: new Date()
          }])
          break
        }
        case 'StepStarted': {
          setMessages(prev => [...prev, {
            id: `step-${evt.stepId}-${Date.now()}`,
            type: 'step',
            content: `Step started (${evt.tool})`,
            timestamp: new Date(),
          }])
          break
        }
        case 'ToolOutput': {
          setMessages(prev => [...prev, {
            id: `tool-output-${evt.stepId}-${Date.now()}`,
            type: 'agent',
            content: evt.summary,
            timestamp: new Date(),
          }])
          break
        }
        case 'StepSucceeded': {
          setMessages(prev => [...prev, {
            id: `step-succeeded-${evt.stepId}-${Date.now()}`,
            type: 'step',
            content: `Step ${evt.stepId} completed successfully`,
            timestamp: new Date(),
          }])
          break
        }
        case 'StepFailed': {
          setMessages(prev => [...prev, {
            id: `step-failed-${evt.stepId}-${Date.now()}`,
            type: 'agent',
            content: `Step ${evt.stepId} failed: ${evt.message}`,
            timestamp: new Date(),
          }])
          break
        }
        case 'RunSucceeded': {
          setMessages(prev => [...prev, {
            id: `run-succeeded-${evt.runId}-${Date.now()}`,
            type: 'final',
            content: `Run succeeded in ${evt.elapsed.totalMinutes.toFixed?.(2) ?? evt.elapsed.totalMinutes} minutes` as string,
            timestamp: new Date(),
          }])
          setIsAgentRunning(false)
          break
        }
        case 'RunFailed': {
          setMessages(prev => [...prev, {
            id: `run-failed-${evt.runId}-${Date.now()}`,
            type: 'final',
            content: `Run failed: ${evt.message}`,
            timestamp: new Date(),
          }])
          setIsAgentRunning(false)
          break
        }
        case 'ArtifactCreated': {
          const fileName = evt.artifact?.fileName
          const size = evt.artifact?.size
          const message: AgentMessage = {
            id: `artifact-${Date.now()}`,
            type: 'file',
            content: `Created file: ${fileName}`,
            timestamp: new Date(),
            fileName,
            fileSize: size,
            // Backend provides global download via /api/Files/{name}
            downloadUrl: fileName ? `${API_BASE}${ENDPOINTS.FILE_DOWNLOAD_BY_NAME(fileName)}` : undefined,
          }
          setMessages(prev => [...prev, message])
          if (fileName) onFileCreated?.(fileName, `${API_BASE}${ENDPOINTS.FILE_DOWNLOAD_BY_NAME(fileName)}`)
          break
        }
      }
    },
    onNarration: (n: Narration) => {
      addDebugLog(`💬 Narration: ${n.message.substring(0, 50)}...`)
      console.log('📢 Narration received:', n)
      
      // Add to main chat as assistant message
      addToMainChat('assistant', n.message)
      
      // Append narration as an agent message (for agent panel if needed)
      setMessages(prev => [...prev, {
        id: `narration-${n.runId}-${n.stepId}-${Date.now()}`,
        type: 'agent',
        content: n.message,
        timestamp: new Date(),
        stepId: n.stepId
      }])
      // If this is the final answer, mark the run as complete
      if (n.stepId === 'FINAL' || n.message.startsWith('🎉 Agent:')) {
        addDebugLog(`✅ Run completed with final answer`)
        setIsAgentRunning(false)
      }
    },
    onError: (error: string) => {
      addDebugLog(`⚠️ Error: ${error}`)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'agent',
        content: `⚠️ Connection Issue: ${error}`,
        timestamp: new Date()
      }])
    },
    onConnectionStateChanged: (connected: boolean) => {
      addDebugLog(`🔌 Connection: ${connected ? 'connected' : 'disconnected'}`)
      setConnectionStatus(connected ? 'connected' : 'disconnected')
    }
  })

  // Expose imperative start(goal) to parent so it can use the main input
  useImperativeHandle(ref, () => ({
    start: async (goal: string) => {
      const text = (goal || '').trim()
      if (!text || isAgentRunning) return

      const userMessage: AgentMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: text,
        timestamp: new Date()
      }

      // Add user message to main chat
      addToMainChat('user', text)

      setMessages(prev => [...prev, userMessage])
      setIsAgentRunning(true)
      addDebugLog(`🚀 Starting agent run with goal: ${text}`)

      try {
        // Start a new run with the goal text, scoping to the current chat as taskId
        addDebugLog(`📡 Calling startRun API...`)
        const runId = await runsHub.startRun(text, chatId)
        if (!runId) {
          addDebugLog(`❌ No runId returned`)
          throw new Error('Run could not be started')
        }
        addDebugLog(`✅ Run created: ${runId}`)
        // Provide immediate feedback while waiting for server events
        setMessages(prev => [...prev, {
          id: `join-${runId}-${Date.now()}`,
          type: 'system',
          content: `Joined run ${runId}. Waiting for agent events...`,
          timestamp: new Date()
        }])
      } catch (error) {
        addDebugLog(`❌ Failed to start: ${error}`)
        console.error('Failed to start run:', error)
        setIsAgentRunning(false)
      }
    }
  }), [isAgentRunning, runsHub])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStepStatusIcon = (status: AgentPlanStep['status']) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={14} className="text-green-500" />
      case 'InProgress': return <RefreshCw size={14} className="text-blue-500 animate-spin" />
      case 'Failed': return <AlertCircle size={14} className="text-red-500" />
      default: return <Clock size={14} className="text-gray-400" />
    }
  }

  const toggleStepExpanded = (stepId: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }

  // Detect URLs in narration to render quick download/open chips when back-end embeds links
  const extractUrls = (text: string): string[] => {
    if (!text) return []
    // Basic URL matcher; excludes trailing punctuation/parenthesis
    const urlRegex = /(https?:\/\/[^\s)]+[^\s.,)])/g
    const matches = text.match(urlRegex)
    return matches || []
  }

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'
          }`}>
            <Brain size={18} />
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              AI Agent
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Orchestrated LLM with tools & planning
            </p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`px-2 py-1 rounded text-xs ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title="Toggle debug logs"
          >
            {showDebug ? '🔍 Hide Debug' : '🔍 Debug'}
          </button>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            connectionStatus === 'connected'
              ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
              : connectionStatus === 'connecting'
                ? darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                : darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' 
                ? 'bg-green-500' 
                : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-orange-500'
            }`} />
            <span className="font-medium">
              {connectionStatus === 'connected' ? 'Real-time' : 
               connectionStatus === 'connecting' ? 'Connecting' : 'Limited Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className={`border-b p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🔍 Debug Logs ({debugLogs.length})
            </h4>
            <button
              onClick={() => setDebugLogs([])}
              className={`text-xs px-2 py-1 rounded ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Clear
            </button>
          </div>
          <div className={`max-h-40 overflow-y-auto text-xs font-mono ${
            darkMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'
          } p-2 rounded`}>
            {debugLogs.length === 0 ? (
              <div className={darkMode ? 'text-gray-500' : 'text-gray-400'}>No logs yet...</div>
            ) : (
              debugLogs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Brain size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h4 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              AI Agent Ready
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Give me a complex task and I'll break it down, use tools, and deliver results
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            {/* Message Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'user'
                ? darkMode ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                : message.type === 'step'
                  ? darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                  : message.type === 'tool'
                    ? darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                    : message.type === 'file'
                      ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                      : message.type === 'plan'
                        ? darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                        : message.type === 'final'
                          ? darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {message.type === 'user' && <span className="text-sm font-medium">U</span>}
              {message.type === 'agent' && <Bot size={16} />}
              {message.type === 'step' && <Play size={16} />}
              {message.type === 'tool' && <Zap size={16} />}
              {message.type === 'file' && <FileText size={16} />}
              {message.type === 'plan' && <Brain size={16} />}
              {message.type === 'final' && <CheckCircle size={16} />}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className={`p-3 rounded-lg ${
                message.type === 'user'
                  ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'
              }`}>
                {/* Basic content */}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                {/* If narration contains URLs, show quick download/open chips */}
                {message.type === 'agent' && typeof message.content === 'string' && extractUrls(message.content).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extractUrls(message.content).map((u) => (
                      <a
                        key={u}
                        href={u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                        title="Open/download file"
                      >
                        <Download className="w-3 h-3" />
                        <span className="truncate max-w-[220px]">{u}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Raw model output (legacy) */}
                {message.rawContent && message.rawContent.length > 0 && (
                  <div className={`mt-2 p-2 rounded border-l-4 text-xs font-mono ${
                    darkMode ? 'bg-gray-700 border-blue-400' : 'bg-gray-50 border-blue-500'
                  }`}>
                    {message.rawContent.join('')}
                  </div>
                )}

                {/* Approval actions for permission requests */}
                {message.stepId && message.type === 'tool' && message.content.startsWith('Permission requested') && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => runsHub.approve(message.stepId!)}
                      className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => runsHub.deny(message.stepId!, 'Denied by user')}
                      className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      Deny
                    </button>
                  </div>
                )}

                {/* Tool arguments */}
                {message.toolArgs && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tool Arguments
                    </summary>
                    <pre className={`mt-1 p-2 rounded text-xs overflow-x-auto ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      {JSON.stringify(message.toolArgs, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Tool results */}
                {message.toolResult && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tool Result
                    </summary>
                    <pre className={`mt-1 p-2 rounded text-xs overflow-x-auto ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      {JSON.stringify(message.toolResult, null, 2)}
                    </pre>
                  </details>
                )}

                {/* File download - Use ArtifactDisplay for better UI */}
                {message.fileName && message.downloadUrl && (
                  <div className="mt-2">
                    <ArtifactDisplay
                      artifact={{
                        id: message.id,
                        fileName: message.fileName,
                        fileSize: message.fileSize,
                        downloadUrl: message.downloadUrl
                      }}
                      showPreview={false}
                      compact={true}
                    />
                  </div>
                )}

                {/* Legacy file download display (fallback) */}
                {false && message.fileName && message.downloadUrl && (
                  <div className={`mt-2 p-2 border rounded flex items-center justify-between ${
                    darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <div>
                        <div className="text-sm font-medium">{message.fileName}</div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatFileSize(message.fileSize)}
                        </div>
                      </div>
                    </div>
                    <a
                      href={message.downloadUrl}
                      download={message.fileName}
                      className={`p-1 rounded hover:bg-black/10 ${
                        darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'
                      }`}
                      title="Download file"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                )}

                {/* Plan display */}
                {message.plan && (
                  <div className={`mt-2 border rounded ${
                    darkMode ? 'border-gray-600' : 'border-gray-300'
                  }`}>
                    <div className={`p-2 border-b font-medium text-sm ${
                      darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
                    }`}>
                      📋 Execution Plan: {message.plan.goal}
                    </div>
                    <div className="p-2 space-y-1">
                      {message.plan.steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-2">
                          <div className="flex items-center gap-1 min-w-0">
                            {getStepStatusIcon(step.status)}
                            <button
                              onClick={() => toggleStepExpanded(step.id)}
                              className={`flex items-center gap-1 text-xs hover:bg-black/5 rounded p-1 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              {expandedSteps.has(step.id) ? 
                                <ChevronDown size={12} /> : 
                                <ChevronRight size={12} />
                              }
                              <span className="truncate">Step {step.id}: {step.action}</span>
                            </button>
                          </div>
                          {expandedSteps.has(step.id) && (
                            <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {step.rationale}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString()}
                {message.step && ` • Step ${message.step}`}
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Status (uses main chat input; no extra textbox here) */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isAgentRunning ? '🤖 Agent is working...' : 'Use the main input above to start the Agent'}
            {connectionStatus !== 'connected' && !isAgentRunning && (
              <span className={`ml-2 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                (Limited mode - no real-time updates)
              </span>
            )}
          </div>
          {isAgentRunning && (
            <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <Loader size={14} className="animate-spin" />
              <span>Running…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default AgentChat
