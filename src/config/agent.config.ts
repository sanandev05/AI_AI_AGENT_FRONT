// Environment configuration for AI Agent features
export const AGENT_CONFIG = {
  // Toggle SignalR real-time features on/off
  ENABLE_SIGNALR: process.env.NEXT_PUBLIC_ENABLE_SIGNALR !== 'false',
  
  // SignalR connection settings
  // Updated hub path per new backend spec
  SIGNALR_HUB_URL: '/hub/runs',
  AGENT_EVENTS_HUB_URL: '/hubs/agent-events',
  SIGNALR_TIMEOUT: 20000,
  SIGNALR_MAX_RETRIES: 5,
  
  // Fallback settings when SignalR is unavailable
  ENABLE_AGENT_POLLING: process.env.NEXT_PUBLIC_ENABLE_AGENT_POLLING === 'true',
  AGENT_POLL_INTERVAL: 2000,
  
  // Feature flags
  ENABLE_FILE_MANAGEMENT: process.env.NEXT_PUBLIC_ENABLE_FILE_MANAGEMENT !== 'false',
  ENABLE_WEB_SEARCH: process.env.NEXT_PUBLIC_ENABLE_WEB_SEARCH !== 'false',
}

// Backend endpoints
export const ENDPOINTS = {
  // Chat-related (existing)
  CHAT_STREAM: '/api/chat/stream',
  CHAT_CREATE: '/api/chat/create',
  CHAT_WEB_SEARCH: '/api/chat/web-search',
  UPLOAD_IMAGE: '/api/chat/upload-image',

  // Legacy agent endpoint (kept for compatibility; not used in new runs flow)
  AGENT_CHAT: '/api/agent/chat',

  // New runs API
  // Default creation endpoint is task-scoped: POST /tasks/{taskId}/runs
  // You can override with NEXT_PUBLIC_RUNS_CREATE_PATH_TEMPLATE using {taskId} placeholder.
  RUNS_CREATE: (taskId: string) => {
    const tpl = process.env.NEXT_PUBLIC_RUNS_CREATE_PATH_TEMPLATE
    if (tpl && tpl.includes('{taskId}')) {
      return tpl.replace('{taskId}', encodeURIComponent(taskId))
    }
    return `/tasks/${encodeURIComponent(taskId)}/runs`
  },
  RUN_FILES: (runId: string) => `/api/runs/${runId}/files`,
  RUN_FILE_DOWNLOAD: (runId: string, fileName: string) => `/api/runs/${runId}/files/${encodeURIComponent(fileName)}`,
  RUN_FILES_ZIP: (runId: string) => `/api/runs/${runId}/files/zip`,
  RUN_FILES_PROVENANCE: (runId: string) => `/api/runs/${runId}/files/provenance`,

  // Global files (existing)
  FILES_LIST: '/api/Files',
  FILES_DOWNLOAD: '/api/Files',
  FILES_DELETE: '/api/Files',
  FILE_DOWNLOAD_BY_NAME: (name: string) => `/api/Files/${encodeURIComponent(name)}`,
} as const

export default AGENT_CONFIG