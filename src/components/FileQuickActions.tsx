'use client'

import React from 'react'
import { FileText, Image as ImageIcon, Music, FileSpreadsheet, Play, AlertCircle } from 'lucide-react'
import { type UploadedFile } from '@/services/fileAPI'
import { getAvailableToolsForFile, getToolRequirements, type ToolMapping } from '@/utils/fileToolMapper'
import { AgentType } from '@/config/agentTypes'

interface FileQuickActionsProps {
  file: UploadedFile
  onActionClick: (file: UploadedFile, tool: ToolMapping) => void
  disabled?: boolean
  missingConfigs?: string[]
  selectedAgentType?: AgentType | null
  onRunWithAgent?: (file: UploadedFile, agent: AgentType) => void
}

export default function FileQuickActions({
  file,
  onActionClick,
  disabled = false,
  missingConfigs = []
  , selectedAgentType = null,
  onRunWithAgent
}: FileQuickActionsProps) {
  const availableTools = getAvailableToolsForFile(file)

  const getFileIcon = (category?: string) => {
    switch (category) {
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'audio':
        return <Music className="w-4 h-4" />
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      case 'presentation':
        return <FileSpreadsheet className="w-4 h-4 rotate-90" />
      case 'email':
        return <FileText className="w-4 h-4" />
      case 'calendar':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const isToolDisabled = (tool: ToolMapping) => {
    const requirements = getToolRequirements(tool.tool)
    if (requirements.requiresApiKey && requirements.configKey) {
      return missingConfigs.includes(requirements.configKey)
    }
    return false
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      {/* Run with selected agent */}
      {selectedAgentType && onRunWithAgent && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => onRunWithAgent(file, selectedAgentType)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs rounded-md font-medium border ${disabled ? 'text-gray-400 bg-gray-100 border-gray-200' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
            title={`Run ${selectedAgentType.name} on this file`}
          >
            Run with {selectedAgentType.name}
          </button>
        </div>
      )}
      {/* File Info Header */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 p-2 bg-white dark:bg-gray-800 rounded">
          {getFileIcon(file.category)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.fileName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Quick actions available
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {availableTools.length === 0 && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Uploaded and ready. No quick actions available for this type.
          </span>
        )}
        {availableTools.map((tool) => {
          const toolDisabled = isToolDisabled(tool)
          const requirements = getToolRequirements(tool.tool)
          
          return (
            <button
              key={tool.tool}
              onClick={() => !disabled && !toolDisabled && onActionClick(file, tool)}
              disabled={disabled || toolDisabled}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${disabled || toolDisabled
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-md'
                }
                border border-gray-200 dark:border-gray-700
              `}
              title={toolDisabled ? `Missing configuration: ${requirements.displayName}` : tool.description}
            >
              <span className="text-lg">{tool.icon}</span>
              <span>{tool.displayName}</span>
              {!toolDisabled && (
                <Play className="w-3 h-3" />
              )}
              {toolDisabled && (
                <AlertCircle className="w-3 h-3 text-yellow-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Warning for missing configs */}
      {availableTools.some(tool => isToolDisabled(tool)) && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Some actions require API keys. Configure them in settings to enable all features.
          </p>
        </div>
      )}
    </div>
  )
}
