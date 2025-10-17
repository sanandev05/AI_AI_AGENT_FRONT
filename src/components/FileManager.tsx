"use client"

import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7210"

interface FileInfo {
  name: string
  size: number
  createdUtc: string
  downloadUrl: string
}

interface FileManagerProps {
  darkMode?: boolean
  onFileSelect?: (file: FileInfo) => void
}

export default function FileManager({ darkMode = false, onFileSelect }: FileManagerProps) {
  const { token, isAuthenticated, isTokenValid } = useAuth()
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)

  // API functions
  const fetchFiles = async () => {
    if (!isAuthenticated || !isTokenValid()) {
      setError("Authentication required")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      
      const response = await fetch(`${API_BASE}/api/Files`, {
        method: "GET",
        headers
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`)
      }
      
      const filesList = await response.json()
      setFiles(filesList || [])
    } catch (error) {
      console.error("Error fetching files:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch files")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadFile = async (fileName: string) => {
    if (!isAuthenticated || !isTokenValid()) {
      setError("Authentication required")
      return
    }

    try {
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      
      const response = await fetch(`${API_BASE}/api/Files/${encodeURIComponent(fileName)}`, {
        method: "GET",
        headers
      })
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading file:", error)
      setError(error instanceof Error ? error.message : "Failed to download file")
    }
  }

  const deleteFile = async (fileName: string) => {
    if (!isAuthenticated || !isTokenValid()) {
      setError("Authentication required")
      return
    }

    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return
    }

    setDeletingFile(fileName)
    
    try {
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      
      const response = await fetch(`${API_BASE}/api/Files/${encodeURIComponent(fileName)}`, {
        method: "DELETE",
        headers
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`)
      }
      
      // Remove from local state
      setFiles(prev => prev.filter(file => file.name !== fileName))
      setError(null)
    } catch (error) {
      console.error("Error deleting file:", error)
      setError(error instanceof Error ? error.message : "Failed to delete file")
    } finally {
      setDeletingFile(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Load files on mount
  useEffect(() => {
    fetchFiles()
  }, [isAuthenticated])

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <FolderOpen size={18} />
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Generated Files
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {files.length} DOCX file{files.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchFiles}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          title="Refresh files"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`m-4 p-3 rounded-lg border flex items-center gap-2 ${
          darkMode
            ? 'bg-red-900/20 border-red-700 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className={`ml-auto p-1 rounded hover:bg-black/10 ${
              darkMode ? 'text-red-400' : 'text-red-600'
            }`}
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && files.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading files...
            </p>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 && !isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <FileText size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h4 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No files generated yet
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Files created by the AI agent will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  onFileSelect ? 'cursor-pointer' : ''
                }`}
                onClick={() => onFileSelect?.(file)}
              >
                <div className="flex items-center gap-3">
                  {/* File Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <FileText size={20} />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {file.name}
                    </h4>
                    <div className={`flex items-center gap-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="flex items-center gap-1">
                        <FolderOpen size={12} />
                        {formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(file.createdUtc)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadFile(file.name)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-green-400'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-green-600'
                      }`}
                      title="Download file"
                    >
                      <Download size={16} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFile(file.name)
                      }}
                      disabled={deletingFile === file.name}
                      className={`p-2 rounded-lg transition-colors ${
                        deletingFile === file.name
                          ? 'opacity-50 cursor-not-allowed'
                          : darkMode
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
                      }`}
                      title="Delete file"
                    >
                      {deletingFile === file.name ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {files.length > 0 && (
        <div className={`p-4 border-t text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total: {files.length} file{files.length !== 1 ? 's' : ''} • {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
          </p>
        </div>
      )}
    </div>
  )
}