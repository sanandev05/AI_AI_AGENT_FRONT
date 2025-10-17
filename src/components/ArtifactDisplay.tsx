'use client'

import React from 'react'
import { Download, FileText, Image as ImageIcon, Music, FileSpreadsheet, ExternalLink } from 'lucide-react'
import { formatFileSize } from '@/services/fileAPI'

export interface ArtifactData {
  id: string
  fileName: string
  fileSize?: number
  mimeType?: string
  downloadUrl: string
  preview?: {
    type: 'text' | 'image' | 'summary'
    content: string
  }
  metadata?: {
    pages?: number
    duration?: string
    transcriptLength?: number
    [key: string]: any
  }
}

interface ArtifactDisplayProps {
  artifact: ArtifactData
  showPreview?: boolean
  compact?: boolean
}

export default function ArtifactDisplay({ 
  artifact, 
  showPreview = true,
  compact = false 
}: ArtifactDisplayProps) {
  const getFileIcon = () => {
    if (!artifact.mimeType) return <FileText className="w-5 h-5" />
    
    if (artifact.mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
    if (artifact.mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (artifact.mimeType === 'application/pdf') return <FileText className="w-5 h-5" />
    if (artifact.mimeType.includes('spreadsheet') || artifact.mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-5 h-5" />
    }
    return <FileText className="w-5 h-5" />
  }

  const handleDownload = () => {
    window.open(artifact.downloadUrl, '_blank')
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {artifact.fileName}
          </p>
          {artifact.fileSize && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(artifact.fileSize)}
            </p>
          )}
        </div>
        <button
          onClick={handleDownload}
          className="flex-shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {artifact.fileName}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {artifact.fileSize && (
              <span>{formatFileSize(artifact.fileSize)}</span>
            )}
            {artifact.metadata?.pages && (
              <span>• {artifact.metadata.pages} pages</span>
            )}
            {artifact.metadata?.duration && (
              <span>• {artifact.metadata.duration}</span>
            )}
            {artifact.metadata?.transcriptLength && (
              <span>• {artifact.metadata.transcriptLength} words</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <a
            href={artifact.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </a>
        </div>
      </div>

      {/* Preview */}
      {showPreview && artifact.preview && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900">
          {artifact.preview.type === 'image' && (
            <div className="flex justify-center">
              <img
                src={artifact.preview.content}
                alt={artifact.fileName}
                className="max-w-full max-h-96 rounded-lg object-contain"
              />
            </div>
          )}
          
          {artifact.preview.type === 'text' && (
            <div className="max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                {artifact.preview.content}
              </pre>
            </div>
          )}
          
          {artifact.preview.type === 'summary' && (
            <div className="prose dark:prose-invert max-w-none">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {artifact.preview.content}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadata Footer */}
      {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(artifact.metadata).map(([key, value]) => {
              // Skip already displayed metadata
              if (['pages', 'duration', 'transcriptLength'].includes(key)) return null
              
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {String(value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
