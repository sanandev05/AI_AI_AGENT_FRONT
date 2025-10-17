'use client'

import React, { useCallback, useState, useRef } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Music, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react'
import { uploadFile, validateFile, formatFileSize, type UploadedFile } from '@/services/fileAPI'
import { useAuth } from '@/contexts/AuthContext'

interface FileUploadZoneProps {
  onFileUploaded?: (file: UploadedFile) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
  uploadedData?: UploadedFile
}

export default function FileUploadZone({ 
  onFileUploaded, 
  onError,
  disabled = false,
  className = ''
}: FileUploadZoneProps) {
  const { token } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileSpreadsheet className="w-5 h-5" />
    return <FileText className="w-5 h-5" />
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!token) {
      onError?.('Authentication required to upload files')
      return
    }

    const fileArray = Array.from(files)
    const newUploadingFiles = new Map(uploadingFiles)

    for (const file of fileArray) {
      const fileId = `${file.name}-${Date.now()}-${Math.random()}`
      
      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        newUploadingFiles.set(fileId, {
          file,
          progress: 0,
          status: 'error',
          error: validation.error
        })
        onError?.(validation.error || 'File validation failed')
        continue
      }

      // Start upload
      newUploadingFiles.set(fileId, {
        file,
        progress: 0,
        status: 'uploading'
      })
      setUploadingFiles(new Map(newUploadingFiles))

      try {
        const uploadedFile = await uploadFile(file, token, (progress) => {
          const current = newUploadingFiles.get(fileId)
          if (current) {
            newUploadingFiles.set(fileId, { ...current, progress })
            setUploadingFiles(new Map(newUploadingFiles))
          }
        })

        // Map response to UploadedFile format
        const fileData: UploadedFile = {
          id: uploadedFile.fileId,
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
          mimeType: uploadedFile.mimeType,
          uploadedAt: uploadedFile.uploadedAt,
          downloadUrl: uploadedFile.downloadUrl,
          category: getCategory(uploadedFile.mimeType)
        }

        newUploadingFiles.set(fileId, {
          file,
          progress: 100,
          status: 'success',
          uploadedData: fileData
        })
        setUploadingFiles(new Map(newUploadingFiles))

        onFileUploaded?.(fileData)

        // Remove from list after 3 seconds
        setTimeout(() => {
          setUploadingFiles(prev => {
            const next = new Map(prev)
            next.delete(fileId)
            return next
          })
        }, 3000)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed'
        newUploadingFiles.set(fileId, {
          file,
          progress: 0,
          status: 'error',
          error: errorMsg
        })
        setUploadingFiles(new Map(newUploadingFiles))
        onError?.(errorMsg)
      }
    }
  }, [token, uploadingFiles, onFileUploaded, onError])

  // Helper: map mime type to category consistent with fileAPI
  const getCategory = (mime: string): UploadedFile['category'] => {
    if (mime === 'application/pdf') return 'pdf'
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return 'spreadsheet'
    if (mime.includes('word')) return 'document'
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation'
    if (mime === 'message/rfc822' || mime === 'application/vnd.ms-outlook') return 'email'
    if (mime === 'text/calendar' || mime === 'application/ics') return 'calendar'
    return 'other'
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const removeFile = useCallback((fileId: string) => {
    setUploadingFiles(prev => {
      const next = new Map(prev)
      next.delete(fileId)
      return next
    })
  }, [])

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.webp,.bmp,.mp3,.wav,.ogg,.webm,.m4a,.csv,.eml,.ics"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            PDF, DOCX, XLSX, PPTX, Images, Audio, CSV, EML, ICS (max 50MB)
          </p>
        </div>
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileId, uploadingFile]) => (
            <div
              key={fileId}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* File Icon */}
              <div className={`
                flex-shrink-0 p-2 rounded
                ${uploadingFile.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  uploadingFile.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}
              `}>
                {uploadingFile.status === 'uploading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : uploadingFile.status === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  getFileIcon(uploadingFile.file.type)
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(uploadingFile.file.size)}
                  {uploadingFile.status === 'uploading' && ` • ${uploadingFile.progress}%`}
                  {uploadingFile.status === 'success' && ' • Uploaded'}
                  {uploadingFile.status === 'error' && uploadingFile.error && ` • ${uploadingFile.error}`}
                </p>

                {/* Progress Bar */}
                {uploadingFile.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {uploadingFile.status !== 'uploading' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(fileId)
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
