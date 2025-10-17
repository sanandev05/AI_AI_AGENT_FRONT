"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import './chat.css'
import {
  Plus,
  Send,
  Mic,
  MicOff,
  Paperclip,
  Settings,
  Search,
  Clock,
  Brain,
  Sliders,
  ChevronDown,
  ChevronRight,
  Check,
  MessageSquare,
  FileText,
  Bot,
  Cpu,
  Sparkles,
  RefreshCw,
  Command,
  Code,
  Bug,
  Zap,
  BookOpen,
  AlertCircle,
  Camera,
  Database,
  TrendingUp,
  Lightbulb,
  Sun,
  Moon,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Globe,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import FileManager from "../../components/FileManager"
import AgentChat, { AgentChatHandle } from "../../components/AgentChat"
import ModelSelector from "../../components/ModelSelector"
import type { LanguageModel } from "../../hooks/useModels"
import { AGENT_TYPES, AgentType } from '../../config/agentTypes'
// Removed FileUploadZone: single upload button is used instead
import FileQuickActions from "../../components/FileQuickActions"
import { type UploadedFile, uploadFile, validateFile, getCategoryForFile } from "../../services/fileAPI"
import { getToolForFile, type ToolMapping } from "../../utils/fileToolMapper"
import MarkdownRenderer from "./MarkdownRenderer"
import { validateToolConfigs, type ValidationResult } from "../../utils/configValidator"

// Ensure CSS is applied immediately
const forceReRender = () => {
  const style = document.createElement('style')
  style.textContent = `
    .chat-container {
      background-color: #f9fafb !important;
      color: #111827 !important;
    }
    .user-message {
      background-color: #3b82f6 !important;
      color: white !important;
      margin-left: auto !important;
    }
    .assistant-message {
      background-color: white !important;
      color: #374151 !important;
      border: 1px solid #e5e7eb !important;
    }
    .sidebar {
      background-color: white !important;
      border-right: 1px solid #e5e7eb !important;
    }
  `
  document.head.appendChild(style)
}

// Call immediately
if (typeof window !== 'undefined') {
  forceReRender()
}

// Base URL for backend API (can be configured via environment variable)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7210"

// Model mapping for backend
const modelToNumber = (model: 'OpenAI' | 'Google') => {
  if (model === 'OpenAI') return 1
  if (model === 'Google') return 2
  return 1
}

type SearchResult = {
  url: string
  title: string
  snippet: string
}

type ChatMessage = {
  role?: "user" | "assistant"
  content: string
  timestamp: string
  messageId?: string
  id?: string
  roles?: number
  createdAt?: string
  imageUrl?: string
  fileName?: string
  fileSize?: string
}

type ChatData = {
  chatGuid: string
  title: string
  preview?: string
  updatedAt: string
  messages?: ChatMessage[]
}

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  id: string
  _cls?: string
  type?: "text" | "code" | "file" | "error" | "suggestion"
  metadata?: {
    fileName?: string
    fileSize?: string
    language?: string
    repository?: string
    branch?: string
    lineNumbers?: string
    imageUrl?: string
    imagePreview?: string
    searchResults?: SearchResult[]
  }
}

type Repository = {
  id: string
  name: string
  fullName: string
  branch: string
  lastCommit?: string
  status: "active" | "archived"
}

type Conversation = {
  id: string
  title: string
  preview?: string
  updatedAt: string
  type: "code" | "debug" | "review" | "general"
  repository?: string
  files?: string[]
}

// Panel Components
function ConversationHistoryPanel({ conversations, selectedId, onSelect, searchQuery, setSearchQuery, darkMode, onRename, onDelete }: {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  darkMode: boolean
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "code": return Code
      case "debug": return Bug  
      case "review": return Sparkles
      default: return MessageSquare
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "code": return "text-blue-500"
      case "debug": return "text-red-500"
      case "review": return "text-green-500" 
      default: return "text-gray-500"
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="relative">
          <Search size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                : 'bg-gray-100 border-gray-200 text-gray-900'
            }`}
          />
        </div>
      </div>
      
      <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className="flex gap-1 text-sm">
          {["All", "Starred", "Recent", "AI Models"].map((filter) => (
            <button
              key={filter}
              className={`px-3 py-1 rounded transition-colors ${ 
                filter === "All" 
                  ? "bg-blue-500 text-white" 
                  : darkMode
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations
          .filter(conv => 
            searchQuery === "" || 
            conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.preview?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .map((conv) => {
          const IconComponent = getTypeIcon(conv.type)
          return (
            <div
              key={conv.id}
              className={`p-4 border-b transition-all duration-200 relative group ${ 
                selectedId === conv.id 
                  ? darkMode
                    ? "bg-gray-700 border-l-2 border-l-blue-500 border-b-gray-600"
                    : "bg-gray-100 border-l-2 border-l-blue-500 border-b-gray-200"
                  : darkMode
                    ? "border-b-gray-600 hover:bg-gray-700"
                    : "border-b-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                  darkMode 
                    ? 'bg-gray-600 border-gray-500' 
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <IconComponent size={14} className={getTypeColor(conv.type)} />
                </div>
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelect(conv.id)}
                >
                  {editingId === conv.id ? (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim() && editingTitle !== conv.title) {
                            onRename(conv.id, editingTitle.trim())
                          }
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingTitle.trim() && editingTitle !== conv.title) {
                              onRename(conv.id, editingTitle.trim())
                            }
                            setEditingId(null)
                          } else if (e.key === 'Escape') {
                            setEditingId(null)
                            setEditingTitle(conv.title)
                          }
                        }}
                        className={`w-full text-base font-semibold bg-transparent border rounded px-2 py-1 focus:outline-none focus:border-blue-500 ${
                          darkMode 
                            ? 'text-gray-100 border-gray-500 focus:border-blue-400' 
                            : 'text-gray-900 border-gray-300 focus:border-blue-500'
                        }`}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div className={`font-semibold text-base truncate mb-2 ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {conv.title}
                    </div>
                  )}
                  {conv.preview && (
                    <div className={`text-sm line-clamp-2 mb-3 leading-relaxed ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {conv.preview}
                    </div>
                  )}
                  <div className={`flex items-center gap-3 text-xs ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {conv.repository && (
                      <div className="flex items-center gap-1">
                        <Brain size={12} />
                        <span className="truncate max-w-[100px]">{conv.repository}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Menu Button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(showDropdown === conv.id ? null : conv.id)
                    }}
                    className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                      showDropdown === conv.id ? 'opacity-100' : ''
                    } ${
                      darkMode 
                        ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                    title="More options"
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showDropdown === conv.id && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(null)}
                      />
                      
                      {/* Menu */}
                      <div className={`absolute right-0 top-full mt-1 border rounded-lg shadow-xl z-20 overflow-hidden min-w-[150px] ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(conv.id)
                            setEditingTitle(conv.title)
                            setShowDropdown(null)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            darkMode 
                              ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' 
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Edit3 size={16} />
                          <span>Rename</span>
                        </button>
                        
                        <div className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Are you sure you want to delete "${conv.title}"?`)) {
                                onDelete(conv.id)
                              }
                              setShowDropdown(null)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {conversations.filter(conv => 
          searchQuery === "" || 
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.preview?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).length === 0 && (
          <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No conversations found</p>
            <p className="text-xs mt-1">Try adjusting your search or create a new conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
function RepositoryPanel({ selectedRepo, repositories, setSelectedRepository, darkMode }: {
  selectedRepo: Repository | null
  repositories: Repository[]
  setSelectedRepository: (repo: Repository) => void
  darkMode: boolean
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <Brain size={16} className="text-blue-500" />
          AI Models
        </h3>
        <button 
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`} 
          title="Model Settings"
        >
          <Settings size={16} />
        </button>
      </div>
      
      {selectedRepo && (
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-4 rounded-xl border hover:border-blue-500 transition-colors ${
            darkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-100 border-gray-200'
          }`}>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {selectedRepo.name}
              </div>
              <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Cpu size={12} />
                <span>{selectedRepo.branch}</span>
                {selectedRepo.lastCommit && (
                  <>
                    <span>•</span>
                    <Sparkles size={12} />
                    <span className="truncate max-w-[120px]">{selectedRepo.lastCommit}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`w-3 h-3 rounded-full ${selectedRepo.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} shadow-sm`} />
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {selectedRepo.status === 'active' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          {/* Model Selection */}
          <div className="space-y-2">
            <h4 className={`text-xs font-medium uppercase tracking-wide mb-3 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Available Models</h4>
            {repositories.map((repo) => (
              <button
                key={repo.id}
                onClick={() => setSelectedRepository(repo)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${ 
                  selectedRepo?.id === repo.id
                    ? darkMode
                      ? 'bg-blue-900/30 border-blue-500 text-blue-400'
                      : 'bg-blue-50 border-blue-500 text-blue-600'
                    : darkMode
                      ? 'border-gray-600 hover:border-blue-400 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 hover:border-blue-300 text-gray-900'
                }`}
              >
                <Bot size={14} className={selectedRepo?.id === repo.id ? 'text-blue-500' : darkMode ? 'text-gray-400' : 'text-gray-500'} />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{repo.name}</div>
                  <div className="text-xs opacity-70">{repo.branch}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${repo.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
              </button>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className={`flex items-center gap-2 p-3 text-xs border rounded-lg hover:border-blue-500 transition-colors ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-300' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <MessageSquare size={14} className="text-green-500" />
              <span>Active Chats</span>
            </button>
            <button className={`flex items-center gap-2 p-3 text-xs border rounded-lg hover:border-blue-500 transition-colors ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-300' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <Sliders size={14} className="text-red-500" />
              <span>AI Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced UserProfile component with dropdown
function UserProfile({ darkMode }: { darkMode?: boolean }) {
  const { user, isAuthenticated, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const usageStats = {
    messagesUsed: 42,
    messagesLimit: 100,
    tokensUsed: 8500,
    tokensLimit: 25000
  }
  
  if (!isAuthenticated || !user) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        darkMode
          ? 'bg-gray-700 border-gray-600'
          : 'bg-gray-100 border-gray-200'
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}>
          <Bot size={18} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
        </div>
        <div className="flex-1">
          <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            Not signed in
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Limited access
          </div>
        </div>
        <a 
          href="/auth/login"
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign In
        </a>
      </div>
    )
  }

  const userInitials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U'

  const userName = user.name || user.email?.split('@')[0] || 'User'
  const userPlan = 'Premium' // Default plan
  const userEmail = user.email || 'user@example.com'
  const userRole = 'User' // Default role
  const memberSince = 'Recently' // Default member since

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 group ${
          darkMode 
            ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
            : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
        }`}
      >
        {/* User Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-semibold text-sm">{userInitials}</span>
        </div>
        
        {/* User Info */}
        <div className="flex-1 text-left min-w-0">
          <div className={`text-sm font-medium truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {userName}
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userPlan}</div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        {/* Dropdown Arrow */}
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${
            showDropdown ? 'rotate-180' : ''
          } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className={`absolute bottom-full left-0 right-0 mb-2 border rounded-xl shadow-2xl z-20 overflow-hidden ${
            darkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className={`p-4 border-b ${
              darkMode 
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-600' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{userInitials}</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{userName}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userEmail}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      <Sparkles size={10} />
                      {userPlan}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Online
                    </span>
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Member since {memberSince}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
              <div className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Bot size={14} className="text-blue-500" />
                Account Information
              </div
              >
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Full Name:</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.name || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Email:</span>
                  <span className={`font-medium truncate max-w-[150px] ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{userEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Plan:</span>
                  <span className="text-blue-600 font-medium">{userPlan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Role:</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{userRole}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
              <div className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <TrendingUp size={14} className="text-blue-500" />
                Usage This Month
              </div
              >
              
              {/* Messages Usage */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI Messages</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {usageStats.messagesUsed}/{usageStats.messagesLimit}
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(usageStats.messagesUsed / usageStats.messagesLimit) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Tokens Usage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>API Tokens</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {usageStats.tokensUsed.toLocaleString()}/{usageStats.tokensLimit.toLocaleString()}
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(usageStats.tokensUsed / usageStats.tokensLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                darkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <Bot size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span>Account Settings</span>
              </button>
              
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                darkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <Zap size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span>Upgrade Plan</span>
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Pro</span>
              </button>
              
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                darkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <Settings size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span>Preferences</span>
              </button>
              
              <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                darkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
                <BookOpen size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span>Help & Support</span>
              </button>
              
              <div className={`border-t mt-2 pt-2 ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                <button 
                  onClick={() => {
                    logout()
                    setShowDropdown(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <span className="text-red-500">→</span>
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function GitHubCopilotInterface() {
  const { user, token, loading: authLoading, isAuthenticated, isTokenValid } = useAuth()
  
  // State Management
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [activePanel, setActivePanel] = useState<"conversations" | "repository" | "files" | "assistants" | "agent">("conversations")
  // Selected specialized agent (left sidebar)
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null)
  // Agent options state
  const [selectedAgentMode, setSelectedAgentMode] = useState<string | null>(null)
  const [selectedAgentLanguage, setSelectedAgentLanguage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false)
  const [isAgentMode, setIsAgentMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  // Streaming-only LLM selection
  const [selectedLLM, setSelectedLLM] = useState<LanguageModel | null>(null)
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [configValidation, setConfigValidation] = useState<ValidationResult | null>(null)
  // Agent type selection state
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generalUploadInputRef = useRef<HTMLInputElement>(null)
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const agentRef = useRef<AgentChatHandle | null>(null)

  // API Service Functions
  const chatAPI = useMemo(() => {
    return {
      fetchChatList: async () => {
        try {
          if (!isAuthenticated || !isTokenValid()) {
            console.warn("User not authenticated or token invalid for chat list")
            return []
          }
          const headers: Record<string, string> = {}
          if (token) headers["Authorization"] = `Bearer ${token}`
          const res = await fetch(`${API_BASE}/api/chat/list`, { method: "GET", headers })
          if (!res.ok) throw new Error(`Failed to fetch chat list: ${res.status} ${res.statusText}`)
          return await res.json()
        } catch (error) {
          console.error("Error fetching chat list:", error)
          throw error
        }
      },
      fetchChatHistory: async (chatId: string) => {
        if (!isAuthenticated || !isTokenValid()) throw new Error("User not authenticated or token invalid")
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/api/chat/${chatId}`, { method: "GET", headers })
        if (res.status === 404) return null // Return null instead of empty array for clarity
        if (!res.ok) throw new Error(`Failed to fetch chat history: ${res.status}`)
        return await res.json() // Returns the full ChatDto object
      },
      createNewChat: async () => {
        if (!isAuthenticated || !isTokenValid()) throw new Error("User not authenticated or token invalid")
        try {
          const res = await fetch(`${API_BASE}/api/chat/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({}) // Body can be empty as per controller
          })
          if (!res.ok) throw new Error(`Failed to create new chat: ${res.status}`)
          return await res.json()
        } catch (error) {
          console.error("Error creating new chat:", error)
          throw error
        }
      },
      sendStreamingMessage: async (message: string, chatId: string, model: 'OpenAI' | 'Google', imageUrl?: string) => {
        if (!chatId) throw new Error('ChatId is required')
        if (!isAuthenticated || !isTokenValid()) {
          throw new Error("User not authenticated or token invalid")
        }
        
        const headers: Record<string, string> = { 
          "Content-Type": "application/json", 
          Accept: "text/event-stream" 
        }
        if (token) headers["Authorization"] = `Bearer ${token}`
        
        try {
          // Use new ModelKey/Provider if available; keep legacy 'model' for backward compatibility
          const requestBody = {
            model: model,
            message: message,
            chatId: chatId,
            imageUrls: imageUrl ? [imageUrl] : [],
            // New model selection fields (streaming-only)
            ModelKey: selectedLLM?.key,
            Provider: selectedLLM?.provider
          }
          
          console.log('[chatAPI] Sending streaming message request:', { 
            url: `${API_BASE}/api/chat/stream`,
            chatId, 
            model,
            modelKey: requestBody.ModelKey,
            provider: requestBody.Provider,
            messageLength: message.length,
            hasImageUrl: !!imageUrl,
            imageUrls: imageUrl ? [imageUrl] : [],
            headers: Object.keys(headers),
            requestBody
          })
          
          setIsStreaming(true)
          const response = await fetch(`${API_BASE}/api/chat/stream`, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
          })
          
          console.log('[chatAPI] Response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            ok: response.ok
          })
          
          if (!response.ok) {
            // Get detailed error information
            const errorMessage = `HTTP ${response.status} ${response.statusText}`
            let errorDetails = ''
            
            try {
              const contentType = response.headers.get('content-type')
              if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json()
                console.error('[Backend Error JSON]:', errorData)
                errorDetails = errorData.message || errorData.error || JSON.stringify(errorData)
              } else {
                const errorText = await response.text()
                console.error('[Backend Error Text]:', errorText)
                errorDetails = errorText
              }
            } catch (parseError) {
              console.error('[Error parsing backend error]:', parseError)
              errorDetails = 'Could not parse error response'
            }
            
            const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage
            console.error('[Full streaming error]:', fullError)
            
            // Provide specific error messages based on status code
            switch (response.status) {
              case 400:
                throw new Error(`Bad Request: ${errorDetails || 'Invalid request format or parameters'}`)
              case 401:
                throw new Error('Authentication failed. Please sign in again.')
              case 403:
                throw new Error('Access denied. Please check your permissions.')
              case 404:
                throw new Error('Chat not found. Please create a new chat.')
              case 429:
                throw new Error('Rate limit exceeded. Please wait a moment and try again.')
              case 500:
                throw new Error(`Server error: ${errorDetails || 'The AI service is temporarily unavailable. Please try again.'}`)
              case 502:
              case 503:
              case 504:
                throw new Error('AI service is temporarily unavailable. Please try again in a moment.')
              default:
                throw new Error(fullError)
            }
          }
          
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('Failed to get stream reader - response body is null')
          }
            
          let assistantMessage = ""
          const messageId = Date.now().toString() + "-ai"
          
          // Add placeholder assistant message
          setMessages((prev) => {
            return [
              ...prev,
              {
                role: "assistant",
                content: "",
                timestamp: new Date(),
                id: messageId,
                type: "text",
              },
            ];
          });

          const decoder = new TextDecoder()
          let buffer = ''
          let chunkCount = 0

          while (true) {
            try {
              const { done, value } = await reader.read()
              chunkCount++
              
              if (done) {
                console.log('[chatAPI] Stream completed after', chunkCount, 'chunks')
                break
              }
              
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || '' // Keep the last partial line in buffer
              
              for (const line of lines) {
                if (line.trim() === '') continue // Skip empty lines
                
                console.log('[Stream Line]:', line.substring(0, 100) + (line.length > 100 ? '...' : ''))
                
                // Handle different streaming formats
                if (line.startsWith('data: ')) {
                  // Preserve leading spaces from provider chunks
                  const rawData = line.slice(6)
                  const data = rawData.trim()
                  // Respect provider DONE marker without stripping spaces from content chunks
                  if (!data || data === '[DONE]') {
                    continue
                  }
                  if (data) {
                    try {
                      // Try to parse as JSON first (supports OpenAI & Gemini formats)
                      const parsed = JSON.parse(data)

                      // OpenAI delta format
                      if (parsed?.choices?.[0]?.delta?.content) {
                        assistantMessage += parsed.choices[0].delta.content
                      }
                      // Some backends stream as { content: "..." }
                      else if (typeof parsed?.content === 'string') {
                        assistantMessage += parsed.content
                      }
                      // Google Gemini style: candidates[0].content.parts[].text
                      else if (Array.isArray(parsed?.candidates) && parsed.candidates.length > 0) {
                        const candidate = parsed.candidates[0]
                        const parts = candidate?.content?.parts
                        if (Array.isArray(parts)) {
                          const text = parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('')
                          if (text) assistantMessage += text
                        } else if (typeof candidate?.content?.text === 'string') {
                          // Fallback if backend flattens to content.text
                          assistantMessage += candidate.content.text
                        }
                      }
                      // Raw string payload
                      else if (typeof parsed === 'string') {
                        assistantMessage += parsed
                      } else {
                        // Unknown JSON shape — log and ignore
                        console.log('[Stream] Unrecognized JSON chunk shape:', parsed)
                      }
                    } catch {
                      // If not JSON, treat as plain text
                      console.log('[Stream] Non-JSON data:', data.substring(0, 50))
                      assistantMessage += data
                    }
                    
                    // Update message in real-time
                    setMessages(prev => {
                      const updated = [...prev]
                      const idx = updated.findIndex(m => m.id === messageId)
                      if (idx !== -1) {
                        updated[idx] = { ...updated[idx], content: assistantMessage }
                      }
                      return updated
                    })
                  }
                } else {
                  // Handle plain text streaming (non-SSE format)
                  assistantMessage += line + '\n'
                  setMessages(prev => {
                    const updated = [...prev]
                    const idx = updated.findIndex(m => m.id === messageId)
                    if (idx !== -1) {
                      updated[idx] = { ...updated[idx], content: assistantMessage }
                    }
                    return updated
                  })
                }
              }
            } catch (readError) {
              console.error('[Stream Read Error]:', readError)
              const msg = readError instanceof Error ? readError.message : String(readError)
              throw new Error(`Stream reading failed: ${msg}`)
            }
          }
          
          // Final cleanup - remove trailing newlines
          if (assistantMessage.endsWith('\n')) {
            assistantMessage = assistantMessage.slice(0, -1)
          }
          
          // Final update
          setMessages(prev => {
            const updated = [...prev]
            const idx = updated.findIndex(m => m.id === messageId)
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], content: assistantMessage }
            }
            return updated
          })
          
          console.log('[chatAPI] Stream completed successfully. Final message length:', assistantMessage.length)
          
        } catch (error) {
          console.error("Error in streaming:", error)
          throw error
        } finally {
          setIsStreaming(false)
        }
      },
      uploadImage: async (image: File) => {
        try {
          console.log('[chatAPI] uploading image only', { 
            fileName: image.name,
            fileSize: image.size
          })
          setIsUploadingImage(true)
          
          const formData = new FormData()
          formData.append('image', image)
          formData.append('file', image)
          formData.append('upload', image)
          
          const uploadHeaders: Record<string, string> = {}
          if (token) uploadHeaders["Authorization"] = `Bearer ${token}`
          
          console.log('[Upload Debug] Sending image upload request:', {
            url: `${API_BASE}/api/chat/upload-image`,
            method: 'POST',
            headers: uploadHeaders,
            fileInfo: {
              name: image.name,
              size: image.size,
              type: image.type
            }
          })

          const uploadResponse = await fetch(`${API_BASE}/api/chat/upload-image`, {
            method: "POST",
            headers: uploadHeaders,
            body: formData
          })
          
          console.log('[Upload Response]:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            headers: Object.fromEntries(uploadResponse.headers.entries())
          })
          
          if (!uploadResponse.ok) {
            let errorMessage = `${uploadResponse.status} ${uploadResponse.statusText}`
            try {
              const errorData = await uploadResponse.text()
              console.error('[Backend Error Response]:', errorData)
              errorMessage += `: ${errorData}`
            } catch (e) {
              console.error('[Could not parse error response]')
            }
            throw new Error(`Failed to upload image: ${errorMessage}`)
          }
          
          const uploadResult = await uploadResponse.json()
          console.log('[chatAPI] Image uploaded successfully:', uploadResult)
          
          return uploadResult.imageUrl || uploadResult.url || uploadResult.fileName || 'uploaded-image'
        } catch (error) {
          console.error("Error uploading image:", error)
          throw error
        } finally {
          setIsUploadingImage(false)
        }
      },
      sendMessageWithImage: async (message: string, imageUrl: string, chatId: string, model: 'OpenAI' | 'Google') => {
        if (!chatId) throw new Error('ChatId is required')
        
        const headers: Record<string, string> = { 
          "Content-Type": "application/json", 
          Accept: "text/event-stream" 
        }
        if (token) headers["Authorization"] = `Bearer ${token}`
        
        try {
          // Use the correct API format
          const requestBody = {
            model: model, // Send as string
            message: message,
            chatId: chatId,
            imageUrls: [imageUrl],
            // New model selection fields (streaming-only)
            ModelKey: selectedLLM?.key,
            Provider: selectedLLM?.provider
          }
          
          console.log('[chatAPI] sending message with image URL', { 
            chatId, 
            model,
            modelKey: requestBody.ModelKey,
            provider: requestBody.Provider,
            imageUrl,
            requestBody
          })
          setIsStreaming(true)
          
          const response = await fetch(`${API_BASE}/api/chat/stream`, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
          })
          
          if (!response.ok) throw new Error(`Failed to send message with image: ${response.status}`)
          
          // Handle streaming response (same as above)
          const reader = response.body?.getReader()
          if (!reader) throw new Error('Failed to get stream reader')
            
          let assistantMessage = ""
          const messageId = Date.now().toString() + "-ai"
          setMessages(prev => ([...prev, { role: "assistant", content: "", timestamp: new Date(), id: messageId, type: "text" }]))
          
          const decoder = new TextDecoder()
          let buffer = ''
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              if (line.trim() === '') continue
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                      assistantMessage += parsed.choices[0].delta.content
                    } else if (parsed.content) {
                      assistantMessage += parsed.content
                    } else if (typeof parsed === 'string') {
                      assistantMessage += parsed
                    }
                  } catch (e) {
                    assistantMessage += data
                  }
                  
                  setMessages(prev => {
                    const updated = [...prev]
                    const idx = updated.findIndex(m => m.id === messageId)
                    if (idx !== -1) {
                      updated[idx] = { ...updated[idx], content: assistantMessage }
                    }
                    return updated
                  })
                }
              } else {
                assistantMessage += line + '\n'
                setMessages(prev => {
                  const updated = [...prev]
                  const idx = updated.findIndex(m => m.id === messageId)
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], content: assistantMessage }
                  }
                  return updated
                })
              }
            }
          }
          
          // Final cleanup
          if (assistantMessage.endsWith('\n')) {
            assistantMessage = assistantMessage.slice(0, -1)
            setMessages(prev => {
              const updated = [...prev]
              const idx = updated.findIndex(m => m.id === messageId)
              if (idx !== -1) {
                updated[idx] = { ...updated[idx], content: assistantMessage }
              }
              return updated
            })
          }
          
        } catch (error) {
          console.error("Error in streaming with image:", error)
          throw error
        } finally {
          setIsStreaming(false)
        }
      },
      uploadImageWithMessage: async (message: string, image: File, chatId: string, model: 'OpenAI' | 'Google') => {
        if (!chatId) throw new Error('ChatId is required')
        
        try {
          console.log('[chatAPI] uploading image with message', { 
            chatId, 
            model,
            fileName: image.name,
            fileSize: image.size
          })
          setIsStreaming(true)
          
          // Step 1: Upload the image
          const formData = new FormData()
          formData.append('image', image)
          formData.append('file', image)
          formData.append('upload', image)
          formData.append('chatId', chatId)
          formData.append('model', model) // Send model as string
          
          const uploadHeaders: Record<string, string> = {}
          if (token) uploadHeaders["Authorization"] = `Bearer ${token}`
          
          const uploadResponse = await fetch(`${API_BASE}/api/chat/upload-image`, {
            method: "POST",
            headers: uploadHeaders,
            body: formData
          })
          
          if (!uploadResponse.ok) {
            let errorMessage = `${uploadResponse.status} ${uploadResponse.statusText}`
            try {
              const errorData = await uploadResponse.text()
              console.error('[Backend Error Response]:', errorData)
              errorMessage += `: ${errorData}`
            } catch (e) {
              console.error('[Could not parse error response]')
            }
            throw new Error(`Failed to upload image: ${errorMessage}`)
          }
          
          const uploadResult = await uploadResponse.json()
          console.log('[chatAPI] Image uploaded successfully:', uploadResult)
          
          // Step 2: Send chat message with image reference using correct format
          const chatHeaders: Record<string, string> = { 
            "Content-Type": "application/json", 
            Accept: "text/event-stream" 
          }
          if (token) chatHeaders["Authorization"] = `Bearer ${token}`
          
          const chatPayload = {
            model: model, // Send as string
            message: message,
            chatId: chatId,
            imageUrls: [uploadResult.imageUrl || uploadResult.url],
            // New model selection fields (streaming-only)
            ModelKey: selectedLLM?.key,
            Provider: selectedLLM?.provider
          }
          
          const chatResponse = await fetch(`${API_BASE}/api/chat/stream`, {
            method: "POST",
            headers: chatHeaders,
            body: JSON.stringify(chatPayload)
          })
          
          if (!chatResponse.ok) {
            throw new Error(`Failed to send chat message: ${chatResponse.status} ${chatResponse.statusText}`)
          }
          
          // Handle streaming response (same pattern as above)
          const reader = chatResponse.body?.getReader()
          if (!reader) throw new Error('Failed to get stream reader')
            
          let assistantMessage = ""
          const messageId = Date.now().toString() + "-ai"
          setMessages(prev => ([...prev, { role: "assistant", content: "", timestamp: new Date(), id: messageId, type: "text" }]))
          
          const decoder = new TextDecoder()
          let buffer = ''
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            
            for (const line of lines) {
              if (line.trim() === '') continue
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                      assistantMessage += parsed.choices[0].delta.content
                    } else if (parsed.content) {
                      assistantMessage += parsed.content
                    } else if (typeof parsed === 'string') {
                      assistantMessage += parsed
                    }
                  } catch (e) {
                    assistantMessage += data
                  }
                  
                  setMessages(prev => {
                    const updated = [...prev]
                    const idx = updated.findIndex(m => m.id === messageId)
                    if (idx !== -1) {
                      updated[idx] = { ...updated[idx], content: assistantMessage }
                    }
                    return updated
                  })
                }
              } else {
                assistantMessage += line + '\n'
                setMessages(prev => {
                  const updated = [...prev]
                  const idx = updated.findIndex(m => m.id === messageId)
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], content: assistantMessage }
                  }
                  return updated
                })
              }
            }
          }
          
          // Final cleanup
          if (assistantMessage.endsWith('\n')) {
            assistantMessage = assistantMessage.slice(0, -1)
            setMessages(prev => {
              const updated = [...prev]
              const idx = updated.findIndex(m => m.id === messageId)
              if (idx !== -1) {
                updated[idx] = { ...updated[idx], content: assistantMessage }
              }
              return updated
            })
          }
          
        } catch (error) {
          console.error("Error in streaming with image:", error)
          throw error
        } finally {
          setIsStreaming(false)
        }
      },
      renameChat: async (chatId: string, newTitle: string) => {
        if (!isAuthenticated || !isTokenValid()) throw new Error("User not authenticated or token invalid")
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json"
          }
          if (token) headers["Authorization"] = `Bearer ${token}`
          
          console.log(`[renameChat] Attempting to rename chat ${chatId} to "${newTitle}"`)
          
          const response = await fetch(`${API_BASE}/api/chat/${chatId}/rename`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ newTitle: newTitle }) // FIXED: Use correct format
          })
          
          console.log(`[renameChat] Response status: ${response.status} ${response.statusText}`)
          
          if (!response.ok) {
            // Get error details from response
            let errorMessage = `Failed to rename chat: ${response.status} ${response.statusText}`
            try {
              const errorText = await response.text()
              console.error('[renameChat] Error response:', errorText)
              if (errorText) {
                errorMessage += ` - ${errorText}`
              }
            } catch (e) {
              console.error('[renameChat] Could not parse error response')
            }
            throw new Error(errorMessage)
          }
          
          // Check if response has content before parsing JSON
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            return await response.json()
          } else {
            // If no JSON content, return success indicator
            console.log('[renameChat] Success - no JSON response')
            return { success: true }
          }
        } catch (error) {
          console.error("Error renaming chat:", error)
          throw error
        }
      },
      deleteChat: async (chatId: string) => {
        // ... (existing deleteChat implementation)
      },
      webSearchStream: async (query: string, chatId: string) => {
        if (!isAuthenticated || !isTokenValid()) throw new Error("User not authenticated or token invalid");
        // Prevent overlapping web search streams
        if (isStreaming) {
          console.warn('[Web Search] A stream is already in progress; ignoring new request.')
          return
        }
        
        const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        try {
          setIsStreaming(true);
          console.log(`🔍 [Web Search] Sending request to: ${API_BASE}/api/chat/web-search`);
          console.log(`🔍 [Web Search] Query: "${query}", ChatId: ${chatId}`);
          
          const response = await fetch(`${API_BASE}/api/chat/web-search`, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, chatId })
          });

          console.log(`🔍 [Web Search] Response status: ${response.status} ${response.statusText}`);
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`🔍 [Web Search] Error response:`, errorText);
            throw new Error(`Web search failed: ${response.status} ${response.statusText}`);
          }
          
          const reader = response.body?.getReader();
          if (!reader) throw new Error('Failed to get stream reader for web search');

          const decoder = new TextDecoder();
          let buffer = '';
          
          // Prepare for new assistant message
          const assistantMessageId = Date.now().toString() + "-ai-ws";
          let searchResults: SearchResult[] = [];
          let summaryContent = "";
          let lastSummaryChunk = ""; // For deduplication of repeated chunks

          // Add a placeholder message
          setMessages((prev) => {
            return [
              ...prev,
              {
                role: "assistant",
                content: "",
                timestamp: new Date(),
                id: assistantMessageId,
                type: "text",
                metadata: { searchResults: [] },
              },
            ];
          });

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                try {
                  const eventData = JSON.parse(data);
                  console.log(`🔍 [Web Search] Received event:`, eventData);
                  
                  setMessages(prev => {
                    const updated = [...prev];
                    const idx = updated.findIndex(m => m.id === assistantMessageId);
                    if (idx === -1) return prev;

                    let currentContent = updated[idx].content;
                    const currentMetadata = updated[idx].metadata || {};

                    switch (eventData.type) {
                      case 'status':
                        // You could display this status elsewhere in the UI
                        console.log('🔍 [Web Search] Status:', eventData.data);
                        break;
                      case 'results':
                        console.log('🔍 [Web Search] Results received:', eventData.data);
                        searchResults = eventData.data;
                        currentMetadata.searchResults = searchResults;
                        break;
                      case 'summary_chunk': {
                        const chunk = typeof eventData.data === 'string' ? eventData.data : '';
                        // Deduplicate repeated chunks often seen in SSE retries/buffer splits
                        if (chunk && chunk !== lastSummaryChunk && !summaryContent.endsWith(chunk)) {
                          summaryContent += chunk;
                          lastSummaryChunk = chunk;
                        }
                        currentContent = summaryContent;
                        break;
                      }
                      case 'error':
                        console.error('🔍 [Web Search] Error event:', eventData.data);
                        currentContent = `Error: ${eventData.data}`;
                        break;
                    }
                    
                    updated[idx] = { ...updated[idx], content: currentContent, metadata: currentMetadata };
                    return updated;
                  });

                } catch (e) {
                  console.warn("Failed to parse SSE chunk:", data);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error in web search stream:", error);
          throw error;
        } finally {
          setIsStreaming(false);
        }
      }
    }
  }, [token, isAuthenticated, isTokenValid, setIsStreaming, setMessages, selectedLLM])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<'OpenAI' | 'Google'>('OpenAI')
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<string>("coding")
  const [isBackendAvailable, setIsBackendAvailable] = useState(true)
  
  // Personalization state
  const [frequentlyUsedPrompts, setFrequentlyUsedPrompts] = useState<string[]>([])
  const [userPreferences, setUserPreferences] = useState({
    favoriteModel: 'OpenAI' as 'OpenAI' | 'Google',
    quickActionsEnabled: true,
    compactMode: false,
    autoSuggestEnabled: true
  })

  // Sample repositories (AI Models)
  const repositories: Repository[] = useMemo(() => [
    {
      id: "1",
      name: "GPT-4 Turbo",
      fullName: "OpenAI/GPT-4-Turbo", 
      branch: "v4.0-turbo",
      lastCommit: "Advanced reasoning & code generation",
      status: "active"
    },
    {
      id: "2", 
      name: "Claude-3.5 Sonnet",
      fullName: "Anthropic/Claude-3.5-Sonnet",
      branch: "v3.5",
      lastCommit: "Enhanced mathematical capabilities",
      status: "active"
    },
    {
      id: "3", 
      name: "Gemini Pro",
      fullName: "Google/Gemini-Pro",
      branch: "v1.5",
      lastCommit: "Multi-modal AI integration",
      status: "active"
    }
  ], [])

  // AI Agent Prompt Categories
  const promptCategories = {
    coding: {
      name: "💻 Coding Assistant",
      prompts: [
        "Write a React component that...",
        "Debug this code and explain the issue...",
        "Refactor this function to be more efficient...", 
        "Add TypeScript types to this JavaScript code...",
        "Create unit tests for this component...",
        "Optimize this algorithm for better performance..."
      ]
    },
    analysis: {
      name: "🔍 Code Analysis",
      prompts: [
        "Analyze this codebase and suggest improvements...",
        "Review this pull request and provide feedback...",
        "Identify potential security vulnerabilities in...",
        "Explain how this algorithm works step by step...",
        "Compare these two approaches and recommend...",
        "Assess the code quality and maintainability of..."
      ]
    },
    architecture: {
      name: "🏗️ System Design",
      prompts: [
        "Design a scalable architecture for...",
        "Suggest database schema for this application...",
        "Plan the API endpoints for this feature...",
        "Recommend best practices for this project structure...",
        "Design microservices architecture for...",
        "Create deployment strategy for this application..."
      ]
    },
    learning: {
      name: "📚 Learning & Docs",
      prompts: [
        "Explain this concept in simple terms...",
        "Create comprehensive documentation for...",
        "Generate examples demonstrating...",
        "Teach me how to implement...",
        "What are the best practices for...",
        "Compare pros and cons of..."
      ]
    }
  }

  // Essential functions for the component
  const createNewChat = useCallback(async () => {
    return await chatAPI.createNewChat()
  }, [chatAPI])

  const loadChatHistory = useCallback(async (chatId: string) => {
    const chatData = await chatAPI.fetchChatHistory(chatId)
    if (chatData && chatData.messages) {
      return chatData.messages // Return the nested messages array
    }
    return [] // Return empty array if no data or no messages
  }, [chatAPI])

  const loadChatList = useCallback(async () => {
    try {
      const chatListData = await chatAPI.fetchChatList()
      
      // Transform backend data to Conversation format
      const formattedConversations: Conversation[] = chatListData.map((chat: ChatData) => ({
        id: chat.chatGuid, // CORRECTED: Use chatGuid
        title: chat.title || "Untitled Chat",
        preview: chat.preview || "",
        updatedAt: chat.updatedAt || new Date().toISOString(),
        type: "general" as const,
        repository: "Filadelfiya",
        files: []
      }))
      
      // Sort conversations by updatedAt in descending order (latest first)
      formattedConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      
      setConversations(formattedConversations)
      
      if (formattedConversations.length > 0 && !selectedConversationId) {
        const firstChat = formattedConversations[0]
        setSelectedConversationId(firstChat.id)
        setActiveChatId(firstChat.id)
        // Load the first chat's history
        try {
          const historyData = await loadChatHistory(firstChat.id)
          const formattedHistory: Message[] = (historyData || []).map((item: ChatMessage, index: number) => {
            // Simplified role detection with better fallbacks
            let role: "user" | "assistant" = "assistant";
            
            // Check numeric roles field first (1 = user, 2 = assistant)
            if (typeof item.roles === "number") {
              role = item.roles === 1 ? "user" : "assistant";
            } 
            // Check string role field (case-insensitive)
            else if (typeof item.role === "string" && item.role.trim() !== "") {
              const roleLower = item.role.toLowerCase().trim();
              role = roleLower === "user" ? "user" : "assistant";
            }
            // Fallback: if no role info, check content patterns
            else {
              // Assume shorter messages without markdown are likely user messages
              const content = item.content || "";
              const hasMarkdown = content.includes("##") || content.includes("```") || content.includes("**");
              const isShort = content.length < 200;
              role = (!hasMarkdown && isShort) ? "user" : "assistant";
            }
            
            console.log('[Chat History] Message:', {
              roles: item.roles,
              role: item.role,
              finalRole: role,
              content: item.content?.substring(0, 30) + '...'
            })
            
            // Enhanced metadata handling for images
            let metadata: Message['metadata'] | undefined = undefined;
            if (item.imageUrl || item.fileName || item.fileSize) {
              metadata = {
                fileName: item.fileName,
                fileSize: item.fileSize,
                imageUrl: item.imageUrl,
                imagePreview: item.imageUrl // Use imageUrl as preview for persisted images
              };
            }
            
            return {
              role,
              content: item.content || "",
              timestamp: new Date(item.createdAt || Date.now()),
              id: item.id || `history-${index}`,
              type: "text" as const,
              metadata
            }
          })
          setMessages(formattedHistory)
        } catch (error) {
          console.error("Failed to load initial chat history:", error)
          setMessages([])
        }
      } else if (formattedConversations.length === 0) {
        setMessages([])
        setActiveChatId(null)
        setSelectedConversationId(null)
      }
      
      console.log(`Loaded ${formattedConversations.length} chats`)
      setIsBackendAvailable(true)
    } catch (error) {
      console.error("Failed to load chat list:", error)
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setIsBackendAvailable(false)
        console.warn("Backend server appears to be unavailable")
      }
      
      setConversations([])
      setMessages([])
    }
  }, [chatAPI, selectedConversationId, loadChatHistory, setConversations, setMessages, setSelectedConversationId, setActiveChatId, setIsBackendAvailable])

  // Error handling helper functions
  const showErrorMessage = useCallback((message: string) => {
    setError(message)
    setShowError(true)
    setTimeout(() => {
      setShowError(false)
      setTimeout(() => setError(null), 300) // Clear after fade animation
    }, 5000)
  }, [])

  const clearError = useCallback(() => {
    setShowError(false)
    setTimeout(() => setError(null), 300)
  }, [])

  const sendStreamingMessage = useCallback(async (message: string, imageUrl?: string) => {
    if (!activeChatId) return;
    // Always call chatAPI; ModelKey/Provider are included from selectedLLM via closure
    return await chatAPI.sendStreamingMessage(message, activeChatId, selectedModel, imageUrl);
  }, [chatAPI, activeChatId, selectedModel])

  const handleConversationSelect = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setActiveChatId(conversationId)
    setIsLoadingHistory(true)
    
    try {
      const historyData = await loadChatHistory(conversationId)
      const formattedHistory: Message[] = (historyData || []).map((item: ChatMessage, index: number) => {
        // Simplified role detection with better fallbacks
        let role: "user" | "assistant" = "assistant";
        
        // Check numeric roles field first (1 = user, 2 = assistant)
        if (typeof item.roles === "number") {
          role = item.roles === 1 ? "user" : "assistant";
        } 
        // Check string role field (case-insensitive)
        else if (typeof item.role === "string" && item.role.trim() !== "") {
          const roleLower = item.role.toLowerCase().trim();
          role = roleLower === "user" ? "user" : "assistant";
        }
        // Fallback: if no role info, check content patterns
        else {
          // Assume shorter messages without markdown are likely user messages
          const content = item.content || "";
          const hasMarkdown = content.includes("##") || content.includes("```") || content.includes("**");
          const isShort = content.length < 200;
          role = (!hasMarkdown && isShort) ? "user" : "assistant";
        }
        
        console.log('[Conversation Select] Message:', {
          roles: item.roles,
          role: item.role,
          finalRole: role,
          content: item.content?.substring(0, 30) + '...'
        })
        
        // Enhanced metadata handling for images
        let metadata: Message['metadata'] | undefined = undefined;
        if (item.imageUrl || item.fileName || item.fileSize) {
          metadata = {
            fileName: item.fileName,
            fileSize: item.fileSize,
            imageUrl: item.imageUrl,
            imagePreview: item.imageUrl // Use imageUrl as preview for persisted images
          };
        }
        
        return {
          role,
          content: item.content || "",
          timestamp: new Date(item.createdAt || Date.now()),
          id: item.id || `history-${index}`,
          type: "text" as const,
          metadata
        }
      })
      setMessages(formattedHistory)
    } catch (error) {
      console.error("Failed to load chat history:", error)
      setMessages([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [loadChatHistory, setSelectedConversationId, setActiveChatId, setMessages, setIsLoadingHistory])

  const handleNewChat = useCallback(async () => {
    try {
      const newChat = await createNewChat()
      if (newChat && newChat.chatGuid) { // CORRECTED: Check for chatGuid
        const chatId = newChat.chatGuid
        setActiveChatId(chatId)
        setSelectedConversationId(chatId)
        setConversations(prev => [
          {
            id: chatId,
            title: newChat.title || "New Chat",
            preview: "",
            updatedAt: new Date().toISOString(),
            type: "general" as const,
            repository: "Filadelfiya",
            files: []
          },
          ...prev
        ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
        setMessages([]) // Clear messages for the new chat
      } else {
        console.error("Failed to create new chat: No chatGuid returned")
      }
    } catch (error) {
      console.error("Failed to create new chat:", error)
    }
  }, [createNewChat, setActiveChatId, setSelectedConversationId, setConversations, setMessages])

  // Image handling functions
  const clearSelectedImage = useCallback(() => {
    setSelectedImage(null)
    setImagePreview(null)
    setUploadedImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)



      // Step  1: Immediately upload the image to get imageUrl
      try {
        console.log('[Step 1] Uploading image immediately...')
        const imageUrl = await chatAPI.uploadImage(file)
        setUploadedImageUrl(imageUrl)
        console.log('[Step 1] Image uploaded successfully, URL:', imageUrl)
      } catch (error) {
        console.error('[Step 1] Failed to upload image:', error)
        alert('Failed to upload image. Please try again.')
        clearSelectedImage()
      }
    }
  }, [chatAPI, clearSelectedImage])

  // Paste handler for Ctrl+V image pasting
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      // Check if the item is an image
      if (item.type.startsWith('image/')) {
        e.preventDefault() // Prevent default paste behavior
        
        const file = item.getAsFile()
        if (!file) continue

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert('Image size must be less than 10MB')
          return
        }

        setSelectedImage(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Upload the image to get imageUrl
        try {
          console.log('[Paste] Uploading pasted image...')
          const imageUrl = await chatAPI.uploadImage(file)
          setUploadedImageUrl(imageUrl)
          console.log('[Paste] Image uploaded successfully, URL:', imageUrl)
        } catch (error) {
          console.error('[Paste] Failed to upload image:', error)
          alert('Failed to upload image. Please try again.')
          clearSelectedImage()
        }
        
        break // Only handle the first image
      }
    }
  }, [chatAPI, clearSelectedImage])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  // General file select (non-image) via single button — stage only, do NOT upload now
  const handleGeneralFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const validation = validateFile(file)
      if (!validation.valid) throw new Error(validation.error || 'Invalid file')
      if (!isAuthenticated || !isTokenValid()) throw new Error('Please sign in to attach files')
      // Stage file for ask-file endpoint on send
      setStagedFile(file)

    } catch (err) {
      console.error('General file upload failed:', err)
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      if (generalUploadInputRef.current) generalUploadInputRef.current.value = ''
    }
  }, [isAuthenticated, isTokenValid])

  // Ask-file POST helper
  const sendAskFile = useCallback(async (question: string, file: File) => {
    // Ensure chat exists
    let currentChatId = activeChatId
    if (!currentChatId) {
      const newChat = await createNewChat()
      currentChatId = newChat.chatGuid
      if (!currentChatId) throw new Error('Backend did not return chat id')
      setActiveChatId(currentChatId)
      setSelectedConversationId(currentChatId)
      setConversations(prev => [
        {
          id: currentChatId!,
          title: newChat.title || 'New Chat',
          preview: '',
          updatedAt: new Date().toISOString(),
          type: 'general' as const,
          repository: 'Filadelfiya',
          files: []
        },
        ...prev
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
    }

    if (!token) throw new Error('Missing auth token')
    setIsStreaming(true)
    try {
      let res, answerText = ''
      // PDF Summarizer: JSON body
      if (selectedAgent && selectedAgent.key === 'pdf-summarizer') {
        // Assume file is already uploaded and we have a fileName (in real app, upload first)
        // Here, just use file.name for demo
        const body = {
          fileName: file.name,
          summaryMode: selectedAgentMode || 'TL;DR'
        }
        res = await fetch(`${API_BASE}${selectedAgent.endpoint}/${currentChatId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
      } else {
        // Default: multipart/form-data
        const form = new FormData()
        form.append('file', file)
        if (question) form.append('question', question)
        if (selectedAgent && selectedAgent.options) {
          if (selectedAgent.options.modes && selectedAgentMode) {
            form.append('mode', selectedAgentMode)
          }
          if (selectedAgent.options.languages && selectedAgentLanguage) {
            form.append('language', selectedAgentLanguage)
          }
        }
        // Special cases for other agents
        if (selectedAgent) {
          if (selectedAgent.key === 'document-translator') {
            form.append('targetLanguage', selectedAgentLanguage || 'en')
          }
          if (selectedAgent.key === 'generate-presentation') {
            form.append('topic', question || '')
          }
        }
        const endpoint = selectedAgent ? selectedAgent.endpoint : '/api/agent/ask-file'
        const url = `${API_BASE}${endpoint}/${currentChatId}`
        res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
            // Do not set Content-Type; browser sets multipart boundary
          },
          body: form
        })
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`agent file failed: ${res.status} ${res.statusText} ${txt}`)
      }
      // Try JSON first, fallback to text
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        answerText = data.answer || data.content || data.message || JSON.stringify(data)
      } else {
        answerText = await res.text()
      }

      // Append assistant message
      setMessages(prev => ([
        ...prev,
        {
          role: 'assistant' as const,
          content: answerText || 'Done.',
          timestamp: new Date(),
          id: Date.now().toString() + '-ask-file',
          type: 'text' as const
        }
      ]))
    } finally {
      setIsStreaming(false)
    }
  }, [activeChatId, createNewChat, setActiveChatId, setSelectedConversationId, setConversations, setMessages, token, selectedAgent, selectedAgentMode, selectedAgentLanguage])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      // Validate file size (10MB limit)
      if (imageFile.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      
      setSelectedImage(imageFile)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(imageFile)

      // Step 1: Immediately upload the image to get imageUrl
      try {
        console.log('[Step 1] Uploading dropped image immediately...')
        const imageUrl = await chatAPI.uploadImage(imageFile)
        setUploadedImageUrl(imageUrl)
        console.log('[Step 1] Dropped image uploaded successfully, URL:', imageUrl)
      } catch (error) {
        console.error('[Step 1] Failed to upload dropped image:', error)
        alert('Failed to upload image. Please try again.')
        clearSelectedImage()
      }
    }
  }, [chatAPI, clearSelectedImage])

  const sendMessageWithImage = useCallback(async () => {
    if (!input.trim() && !selectedImage) return;
    if (isStreaming) return;
    let currentChatId = activeChatId;
    // If no chat is active, create one first
    if (!currentChatId) {
      try {
        const newChat = await createNewChat()
        currentChatId = newChat.chatGuid
        if (!currentChatId) {
          throw new Error('Backend did not return chat id')
        }
        setActiveChatId(currentChatId)
        setSelectedConversationId(currentChatId)
        setConversations(prev => [
          {
            id: currentChatId!,
            title: newChat.title || 'New Chat',
            preview: '',
            updatedAt: new Date().toISOString(),
            type: 'general' as const,
            repository: 'AI Assistant',
            files: []
          },
          ...prev
        ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
  setMessages([]) // Clear messages for the new chat
      } catch (e) {
        console.error('[sendMessageWithImage] Failed to auto-create chat', e);
        return;
      }
    }

    const userInput = input
    const imageFile = selectedImage
    const imageUrl = uploadedImageUrl
    const imagePreviewData = imagePreview // Store the preview before clearing
    
    setInput("")
    
    // Add user message with image preview BEFORE clearing the image
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
      id: Date.now().toString(),
      type: 'text',
      metadata: imageFile ? {
        fileName: imageFile.name,
        fileSize: `${(imageFile.size / 1024).toFixed(1)}KB`,
        ...(imageUrl && { imageUrl }), // Only add if imageUrl exists
        ...(imagePreviewData && { imagePreview: imagePreviewData }) // Only add if imagePreview exists
      } : undefined
    }
    setMessages(prev => [...prev, userMessage])
    
    // Clear the input image state AFTER adding the message
    clearSelectedImage()
    
    try {
      // If web search is enabled, it's a distinct flow that handles its own response.
      if (isWebSearchEnabled && userInput.trim()) {
        console.log('[Web Search] Performing web search.');
        if (!isStreaming) {
          await chatAPI.webSearchStream(userInput, currentChatId);
        } else {
          console.warn('[Web Search] Stream already in progress; skipping new web search request.')
        }
      } else {
        // Otherwise, proceed with the standard chat flow (text or with image).
        const messageToSend = userInput;
        if (imageFile && uploadedImageUrl) {
          // Use the pre-uploaded image URL.
          console.log('[Chat] Sending message with pre-uploaded image URL:', imageUrl);
          await chatAPI.sendMessageWithImage(messageToSend, uploadedImageUrl, currentChatId, selectedModel);
        } else if (imageFile) {
          // Fallback for older logic if URL isn't ready (should be rare).
          console.log('[Chat] Uploading image with message as fallback.');
          await chatAPI.uploadImageWithMessage(messageToSend, imageFile, currentChatId, selectedModel);
        } else {
          // Standard text-only message.
          console.log('[Chat] Sending text-only message.');
          await sendStreamingMessage(messageToSend);
        }
      }

      // Update conversation timestamp to move it to the top, regardless of the flow.
      setConversations(prev => prev.map(conv =>
        conv.id === currentChatId
          ? { ...conv, updatedAt: new Date().toISOString(), preview: userInput.slice(0, 100) }
          : conv
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

    } catch (error) {
      console.error('[sendMessageWithImage] Failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Show user-friendly error notification.
      showErrorMessage(`Failed to send message: ${errorMessage}`);

      // Add an error message to the chat UI.
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Error**: ${errorMessage}\n\nPlease try again or check your connection.`,
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
        type: 'error'
      }]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, selectedImage, isStreaming, activeChatId, isWebSearchEnabled, uploadedImageUrl, selectedModel, sendStreamingMessage, chatAPI, clearSelectedImage, createNewChat, setActiveChatId, setSelectedConversationId, setConversations, setMessages])


  // Handle file uploaded successfully
  const handleFileUploaded = useCallback((file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file])
    
    // Auto-trigger appropriate tool if agent mode is on
    if (isAgentMode && activeChatId) {
      const toolMapping = getToolForFile(file)
      if (toolMapping) {
        // Auto-start agent with the recommended tool prompt
        setTimeout(() => {
          agentRef.current?.start(toolMapping.prompt)
        }, 500)
      }
    }
  }, [isAgentMode, activeChatId])

  // Handle quick action button click
  const handleQuickAction = useCallback((file: UploadedFile, tool: ToolMapping) => {
    if (!isAgentMode || !activeChatId) {
      setIsAgentMode(true)
      // Wait for agent mode to activate before starting
      setTimeout(() => {
        agentRef.current?.start(tool.prompt)
      }, 300)
    } else {
      agentRef.current?.start(tool.prompt)
    }
  }, [isAgentMode, activeChatId])

  // Run selected agent for a file
  const runAgentForFile = useCallback(async (file: UploadedFile, agent: AgentType) => {
    if (!activeChatId) {
      alert('Please select or create a chat first')
      return
    }
    try {
      const res = await fetch(`${API_BASE}${agent.endpoint}/${activeChatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ fileName: file.fileName })
      })
      if (!res.ok) throw new Error(`Agent run failed: ${res.status}`)
      const data = await res.json()
  console.log('Agent response:', data)
  setMessages(prev => [...prev, { role: 'assistant', content: `Agent ${agent.name} finished: ${JSON.stringify(data)}`, timestamp: new Date(), id: Date.now().toString() }])
    } catch (err) {
      console.error('Agent run failed', err)
      alert(err instanceof Error ? err.message : 'Agent run failed')
    }
  }, [activeChatId, token, setMessages])

  const sendMessage = useCallback(async () => {
    // When Agent Mode is ON, use the agent flow and require a text goal
    if (isAgentMode) {
      const goal = input.trim()
      if (!goal || isStreaming) return
      await agentRef.current?.start(goal)
      setInput("")
      return
    }

    if (isStreaming) return

    const userInput = input.trim()

    // If a file is staged, send via ask-file endpoint
    if (stagedFile) {
      if (!userInput) return // require a question when sending a file

      // Add the user's message first with file metadata
      setMessages(prev => ([
        ...prev,
        {
          role: 'user' as const,
          content: userInput,
          timestamp: new Date(),
          id: Date.now().toString(),
          type: 'text' as const,
          metadata: {
            fileName: stagedFile.name,
            fileSize: `${(stagedFile.size / 1024).toFixed(1)}KB`
          }
        }
      ]))

      setInput("")
      const fileToSend = stagedFile
      setStagedFile(null)
      await sendAskFile(userInput, fileToSend)
      // Update conversation timestamp/preview
      if (activeChatId) {
        setConversations(prev => prev.map(conv =>
          conv.id === activeChatId
            ? { ...conv, updatedAt: new Date().toISOString(), preview: userInput.slice(0, 100) }
            : conv
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
      }
      return
    }

    // Otherwise handle text/image streaming flow
    if (!userInput && !selectedImage) return
    await sendMessageWithImage()
  }, [isAgentMode, input, selectedImage, isStreaming, stagedFile, sendMessageWithImage, sendAskFile, setMessages])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else if (e.key === 'Escape') {
      // Clear input on Escape
      setInput('')
      clearSelectedImage()
    } else if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'w':
          // Toggle web search with Ctrl/Cmd + W
          e.preventDefault()
          setIsWebSearchEnabled(prev => !prev)
          break
        case 'n':
          // New chat with Ctrl/Cmd + N
          e.preventDefault()
          createNewChat()
          break
        case '/':
          // Focus search with Ctrl/Cmd + /
          e.preventDefault()
          // Focus on prompt suggestions
          setShowPromptSuggestions(true)
          break
      }
    }
  }, [sendMessage, clearSelectedImage, createNewChat])

  // Rename chat handler
  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      console.log(`[UI] Renaming chat ${chatId} to "${newTitle}"`)
      await chatAPI.renameChat(chatId, newTitle)
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === chatId 
          ? { ...conv, title: newTitle, updatedAt: new Date().toISOString() }
          : conv
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
      
      console.log(`[UI] Successfully renamed chat to "${newTitle}"`)
    } catch (error) {
      console.error('[UI] Failed to rename chat:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Show user-friendly error message
      if (errorMessage.includes('400')) {
        alert('Invalid request. Please check the chat title and try again.')
      } else if (errorMessage.includes('401')) {
        alert('Authentication failed. Please sign in again.')
      } else if (errorMessage.includes('404')) {
        alert('Chat not found. It may have been deleted.')
      } else {
        alert(`Failed to rename chat: ${errorMessage}`)
      }
    }
  }, [chatAPI])

  // Delete chat handler
  const handleDeleteChat = useCallback(async (chatId: string) => {
    try {
      console.log(`[UI] Deleting chat ${chatId}`)
      await chatAPI.deleteChat(chatId)
      
      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== chatId))
      
      // If the deleted chat was selected, clear messages and selection
      if (selectedConversationId === chatId) {
        setSelectedConversationId(null)
        setActiveChatId(null)
        setMessages([])
        
        // Select the first remaining conversation if any
        const remainingConversations = conversations.filter(conv => conv.id !== chatId)
        if (remainingConversations.length > 0) {
          const firstChat = remainingConversations[0]
          handleConversationSelect(firstChat.id)
        }
      }
      
      console.log(`[UI] Successfully deleted chat ${chatId}`)
    } catch (error) {
      console.error('[UI] Failed to delete chat:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Show user-friendly error message
      if (errorMessage.includes('401')) {
        alert('Authentication failed. Please sign in again.')
      } else if (errorMessage.includes('404')) {
        alert('Chat not found. It may have already been deleted.')
      } else {
        alert(`Failed to delete chat: ${errorMessage}`)
      }
    }
  }, [chatAPI, selectedConversationId, conversations, handleConversationSelect])

  // Theme toggle function
  const toggleTheme = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev
      // Apply theme to document
      if (newMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return newMode
    })
  }, [])

  // Load chat list on component mount
  useEffect(() => {
    const initializeChat = async () => {
      if (isAuthenticated) {
        setIsLoadingHistory(true)
        try {
          await loadChatList()
        } catch (error) {
          console.error("Failed to initialize chat:", error)
        } finally {
          setIsLoadingHistory(false)
        }
      } else {
        // Not authenticated, clear any existing state
        setConversations([])
        setMessages([])
        setActiveChatId(null)
        setSelectedConversationId(null)
        setIsLoadingHistory(false)
      }
    }

    if (!authLoading) {
      initializeChat()
    }
  }, [authLoading, isAuthenticated, loadChatList])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Set default repository
  useEffect(() => {
    if (repositories.length > 0 && !selectedRepository) {
      setSelectedRepository(repositories[0])
    }
  }, [repositories, selectedRepository])

  // Initialize theme and user preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setDarkMode(false)
      document.documentElement.classList.remove('dark')
    }

    // Load user preferences
    const savedPreferences = localStorage.getItem('userPreferences')
    if (savedPreferences) {
      try {
        const parsedPrefs = JSON.parse(savedPreferences)
        setUserPreferences(parsedPrefs)
        // Set favorite model if saved
        if (parsedPrefs.favoriteModel) {
          setSelectedModel(parsedPrefs.favoriteModel)
        }
      } catch (error) {
        console.error('Failed to parse user preferences:', error)
      }
    }

    // Load frequently used prompts
    const savedPrompts = localStorage.getItem('frequentlyUsedPrompts')
    if (savedPrompts) {
      try {
        const parsedPrompts = JSON.parse(savedPrompts)
        setFrequentlyUsedPrompts(parsedPrompts)
      } catch (error) {
        console.error('Failed to parse frequently used prompts:', error)
      }
    }
  }, [])

  // Save user preferences when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences))
  }, [userPreferences])

  // Save frequently used prompts when they change
  useEffect(() => {
    if (frequentlyUsedPrompts.length > 0) {
      localStorage.setItem('frequentlyUsedPrompts', JSON.stringify(frequentlyUsedPrompts))
    }
  }, [frequentlyUsedPrompts])

  // Validate tool configurations on mount
  useEffect(() => {
    if (isAuthenticated && token) {
      validateToolConfigs(token)
        .then(result => setConfigValidation(result))
        .catch(err => console.error('Failed to validate tool configs:', err))
    }
  }, [isAuthenticated, token])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Chat interface is accessible to all users, but some features require authentication
  return (
    <div className={`flex h-screen transition-colors duration-300 overflow-hidden font-sans ${
      darkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Left Sidebar - Enhanced Design with Better Navigation */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-80"} transition-all duration-300 shadow-xl flex flex-col relative overflow-hidden ${
        darkMode 
          ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' 
          : 'bg-gradient-to-b from-white to-gray-50 border-gray-200'
      } border-r`}>
        {/* Animated Background Pattern - Fixed z-index and pointer events */}
        <div className={`absolute inset-0 opacity-5 pointer-events-none z-0 ${
          darkMode ? 'bg-blue-500' : 'bg-blue-100'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
        </div>
        
        {/* Header - Improved spacing and hierarchy */}
        <div className={`flex items-center justify-between p-6 min-h-[80px] border-b relative z-10 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h1 className={`font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Filadelfiya
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Your Document AI Platform
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className={`p-2.5 rounded-xl transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Collapse sidebar"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className={`p-3 rounded-xl transition-colors w-full ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Expand sidebar"
              >
                <Bot size={20} />
              </button>
              {/* Compact Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all duration-200 w-full ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-gray-100' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <>
            {/* New Conversation Button */}
            <div className={`p-4 border-b relative z-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button 
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all hover:shadow-md"
              >
                <Plus size={16} />
                <span>New AI conversation</span>
                <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded text-xs">
                  <Command size={10} />
                  <span>N</span>
                </div>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className={`px-4 py-3 border-b relative z-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-1 overflow-x-auto">
                {[
                  {"id": "conversations", "label": "Conversations", "icon": MessageSquare},
                  {"id": "repository", "label": "AI Models", "icon": Brain},
                  {"id": "assistants", "label": "Assistants", "icon": Sparkles},
                  {"id": "files", "label": "Files", "icon": FileText}
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActivePanel(id as "conversations" | "repository" | "files" | "assistants")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap ${ 
                      activePanel === id
                        ? darkMode 
                          ? "bg-gray-700 text-gray-100 shadow"
                          : "bg-gray-100 text-gray-900 shadow"
                        : darkMode
                          ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden relative z-10">
              {activePanel === "conversations" && (
                <ConversationHistoryPanel
                  conversations={conversations}
                  selectedId={selectedConversationId}
                  onSelect={handleConversationSelect}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  darkMode={darkMode}
                  onRename={handleRenameChat}
                  onDelete={handleDeleteChat}
                />
              )}
              {activePanel === "repository" && (
                <RepositoryPanel
                  selectedRepo={selectedRepository}
                  repositories={repositories}
                  setSelectedRepository={setSelectedRepository}
                  darkMode={darkMode}
                />
              )}
              {activePanel === "files" && (
                <FileManager 
                  darkMode={darkMode}
                  onFileSelect={(file) => {
                    console.log('Selected file:', file)
                    // Could add file selection logic here
                  }}
                />
              )}
              {activePanel === "assistants" && (
                <div className="p-4 space-y-3">
                  <div className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filadelfiya</div>
                  <div className="grid grid-cols-1 gap-2">
                    {AGENT_TYPES.map(agent => {
                      const selected = selectedAgent?.key === agent.key
                      return (
                        <button
                          key={agent.key}
                          onClick={() => setSelectedAgent(selected ? null : agent)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                            selected
                              ? (darkMode ? 'bg-blue-900/30 border-blue-600 text-blue-300' : 'bg-blue-50 border-blue-400 text-blue-700')
                              : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100')
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{agent.name}</span>
                            <span className="text-xs opacity-80">{agent.description}</span>
                          </div>
                          {selected && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>Selected</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {selectedAgent?.options && (
                    <div className={`mt-2 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Options</div>
                      {/* Modes */}
                      {'modes' in selectedAgent.options && Array.isArray(selectedAgent.options.modes) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedAgent.options.modes.map((m: string) => (
                            <button
                              key={m}
                              onClick={() => setSelectedAgentMode(m)}
                              className={`px-2 py-1 rounded text-xs border ${selectedAgentMode === m ? (darkMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-400') : (darkMode ? 'bg-gray-600 text-gray-200 border-gray-500' : 'bg-white text-gray-700 border-gray-200')}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Languages */}
                      {'languages' in selectedAgent.options && Array.isArray(selectedAgent.options.languages) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedAgent.options.languages.map((l: string) => (
                            <button
                              key={l}
                              onClick={() => setSelectedAgentLanguage(l)}
                              className={`px-2 py-1 rounded text-xs border ${selectedAgentLanguage === l ? (darkMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-400') : (darkMode ? 'bg-gray-600 text-gray-200 border-gray-500' : 'bg-white text-gray-700 border-gray-200')}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Agent panel removed from sidebar; it will be shown below the chat prompt area */}
            </div>
            
            {/* User Profile Section - At Bottom */}
            <div className={`mt-auto border-t p-4 relative z-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <UserProfile darkMode={darkMode} />
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
            <header className={`flex-shrink-0 flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAgentMode ? 'bg-purple-500' : 'bg-green-500'}`}></div>
              <h2 className={`font-semibold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {isAgentMode ? "AI Agent Mode" : "AI Chat"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModelSelector
              selectedModel={selectedLLM}
              onModelChange={setSelectedLLM}
              disabled={isStreaming || isAgentMode}
            />
            <button 
              onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                isWebSearchEnabled 
                  ? 'bg-blue-500 text-white' 
                  : darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={isWebSearchEnabled ? "Disable Web Search" : "Enable Web Search"}
            >
              <Globe size={16} />
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Authentication Required Notification */}
        {!isAuthenticated && (
          <div className={`border-b px-6 py-3 ${
            darkMode
              ? 'bg-blue-900/20 border-blue-700'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
              <div className="flex-1">
                <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                  <strong>Authentication Required:</strong> The backend server requires JWT authentication for all chat features. 
                  Please sign in to access your conversations and create new chats.
                </p>
              </div>
              <div className="flex gap-2">
                <a 
                  href="/auth/login"
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
                  }`}
                >
                  Sign In
                </a>
                <a 
                  href="/auth/register"
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Register
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Offline Mode Notification */}
        {isAuthenticated && !isBackendAvailable && (
          <div className={`border-b px-6 py-3 ${
            darkMode
              ? 'bg-yellow-900/20 border-yellow-700'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
              <div className="flex-1">
                <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  <strong>Offline Mode:</strong> Backend server at localhost:7210 is not available. 
                  You can still use the chat interface, but responses will be limited.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsBackendAvailable(true)
                  loadChatList() // Try to reconnect
                }}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  darkMode
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                }`}
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Chat Content - Completely Redesigned */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Loading State */}
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading chat history...</p>
              </div>
            </div>
          ) : 
          /* Welcome State - Only show if no history loaded */
          messages.length === 0 ? (
            <div className={`flex-1 flex items-center justify-center p-8 ${
              darkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <div className="text-center max-w-4xl w-full">
                {/* Main Welcome Text - Enhanced Typography */}
                <div className="mb-12">
                  <h1 className={`text-6xl font-light mb-6 tracking-tight ${
                    darkMode ? 'text-gray-50' : 'text-gray-900'
                  }`}>
                    Hello {user ? (user.name || user.email?.split('@')[0] || 'User') : 'there'}
                  </h1>
                  <p className={`text-2xl font-extralight mb-4 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    What can I help you with today?
                  </p>
                  <p className={`text-base font-normal ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    I&apos;m Filadelfiya, ready to help with document analysis, summaries, translation, and more.
                  </p>
                  
                  {/* Authentication Notice */}
                  {!isAuthenticated && (
                    <div className={`mt-4 p-4 border rounded-lg ${
                      darkMode
                        ? 'bg-blue-900/20 border-blue-700 text-blue-300'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <p className={`text-sm mb-2 ${
                        darkMode ? 'text-blue-200' : 'text-blue-800'
                      }`}>
                          <strong>Authentication Required:</strong> This chat system requires you to be signed in to access all features.
                      </p>
                      <div className="flex gap-2">
                        <a 
                          href="/auth/login" 
                          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Sign In
                        </a>
                        <a 
                          href="/auth/register" 
                          className={`inline-flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          Create Account
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Access Tiles - Exactly Like Image */}
                <div className="flex items-center justify-center gap-8 mb-12">
                  <button 
                    onClick={() => setInput("Generate an image of ")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all group ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <Camera size={24} className={`${
                        darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-gray-100'
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`}>Image</span>
                  </button>

                  <button 
                    onClick={() => setInput("Create a presentation about ")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all group ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <FileText size={24} className={`${
                        darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-gray-100'
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`}>Slides</span>
                  </button>

                  <button 
                    onClick={() => setInput("Build a webpage for ")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all group ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <Code size={24} className={`${
                        darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-gray-100'
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`}>Webpage</span>
                  </button>

                  <button 
                    onClick={() => setInput("Create a spreadsheet to track ")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all group ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <Database size={24} className={`${
                        darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-gray-100'
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`}>Spreadsheet</span>
                  </button>

                  <button 
                    onClick={() => setInput("Generate a data visualization for ")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all group ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <TrendingUp size={24} className={`${
                        darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-gray-100'
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`}>Visualization</span>
                  </button>

                  <button 
                    onClick={() => setShowPromptSuggestions(!showPromptSuggestions)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all group ${
                      darkMode 
                        ? 'hover:bg-gray-800' 
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <Settings size={24} className={`${
                        darkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-gray-100'
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`}>More</span>
                  </button>
                </div>

                {/* Bottom Text - Like Image */}
                <div className="flex items-center justify-center">
                  <button className={`flex items-center gap-2 transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                    <span className="text-sm">Explore use cases</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* AI Agent Categories - Hidden by default, shows on demand */}
                {showPromptSuggestions && (
                  <div className={`mt-8 max-w-2xl mx-auto`}>
                    <div className={`border rounded-xl shadow-lg p-6 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>
                        <Lightbulb size={20} className="text-blue-500" />
                        {promptCategories[selectedPromptCategory as keyof typeof promptCategories].name} Prompts
                      </div>
                      
                      {/* Category Tabs (compact) */}
                      <div className="flex gap-2 mb-3 overflow-x-auto">
                        {Object.entries(promptCategories).map(([key, category]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedPromptCategory(key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${ 
                              selectedPromptCategory === key
                                ? 'bg-blue-500 text-white'
                                : darkMode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                      
                      {/* Compact Prompt Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {promptCategories[selectedPromptCategory as keyof typeof promptCategories].prompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setInput(prompt)
                              setShowPromptSuggestions(false)
                              textareaRef.current?.focus()
                            }}
                            className={`text-left p-2 text-xs rounded-md transition-all border ${
                              darkMode
                                ? 'text-gray-300 hover:text-gray-100 bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500'
                                : 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200'
                            }`}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Messages Display */
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.map((message, index) => {
                    // Debug log to track role values
                    if (index < 5) {
                      console.log('[Render] Message', index, 'role:', message.role, 'isUser:', message.role === 'user')
                    }
                    return (
                    <div 
                      key={message.id || index} 
                      className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Assistant Avatar */}
                      {message.role === 'assistant' && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-green-600' : 'bg-green-500'
                        }`}>
                          <Bot size={18} className="text-white" />
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div className={`flex-1 max-w-3xl ${
                        message.role === 'user' 
                          ? 'flex justify-end' 
                          : ''
                      }`}>
                        <div className={`${
                          message.role === 'user'
                            ? darkMode
                              ? 'bg-blue-600 text-white rounded-2xl px-5 py-3 inline-block'
                              : 'bg-blue-500 text-white rounded-2xl px-5 py-3 inline-block'
                            : darkMode
                              ? 'text-gray-100'
                              : 'text-gray-900'
                        }`}>
                          {message.role === 'assistant' ? (
                            <MarkdownRenderer darkMode={darkMode}>
                              {message.content}
                            </MarkdownRenderer>
                          ) : (
                            <div className="leading-7 whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                          )}
                          
                          {/* Image Display */}
                          {message.metadata?.imageUrl && (
                            <img 
                              src={message.metadata.imageUrl} 
                              alt="Uploaded" 
                              className="mt-3 rounded-lg max-w-full h-auto border border-gray-300 dark:border-gray-600"
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* User Avatar */}
                      {message.role === 'user' && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}>
                          <span className="text-white text-sm font-semibold">U</span>
                        </div>
                      )}
                    </div>
                  )})}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          )}

          {/* Chat History Loading Status */}
          {isLoadingHistory && (
            <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading chat history...</span>
            </div>
          )}

          {messages.length > 0 && !isLoadingHistory && (
            <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-green-700">
                {messages.length} messages loaded
              </span>
              <button 
                onClick={() => loadChatList()}
                className="p-1 hover:bg-green-100 rounded text-green-600 hover:text-green-700"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4 p-4 rounded-lg shadow-xl border transition-all duration-300 z-50 ${
              showError ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            } ${
              darkMode 
                ? 'bg-red-900/90 border-red-700 backdrop-blur-sm' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-1 rounded-lg flex-shrink-0 ${
                  darkMode ? 'bg-red-800/50' : 'bg-red-100'
                }`}>
                  <X size={16} className={darkMode ? 'text-red-300' : 'text-red-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold ${
                    darkMode ? 'text-red-200' : 'text-red-800'
                  }`}>
                    Error
                  </h4>
                  <p className={`text-sm mt-1 ${
                    darkMode ? 'text-red-300' : 'text-red-700'
                  }`}>
                    {error}
                  </p>
                </div>
                <button
                  onClick={clearError}
                  className={`p-1 rounded-md transition-colors ${
                    darkMode 
                      ? 'hover:bg-red-800/50 text-red-300 hover:text-red-200' 
                      : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                  }`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compact Fixed Bottom Input Area - Always Visible */}
        <div className={`border-t p-4 shadow-lg ${
          darkMode 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="max-w-4xl mx-auto">
            {/* Personalized Quick Actions Bar */}
            <div className="mb-3 flex items-center gap-2 overflow-x-auto">
              <div className={`flex items-center gap-1 text-xs whitespace-nowrap ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Lightbulb size={12} className="text-yellow-500" />
                <span>For you:</span>
              </div>
              
              {/* Personalized Quick Action Buttons */}
              {userPreferences.quickActionsEnabled && (
                <>
                  <button 
                    onClick={() => {
                      setInput("Explain this code: ")
                      // Track usage for personalization
                      setFrequentlyUsedPrompts(prev => [...prev, "Explain this code: "].slice(-10))
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all group ${
                      darkMode
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    <Code size={10} />
                    Code
                  </button>
                  
                  <button 
                    onClick={() => {
                      setInput("Debug this error: ")
                      setFrequentlyUsedPrompts(prev => [...prev, "Debug this error: "].slice(-10))
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all group ${
                      darkMode
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    <Bug size={10} />
                    Debug
                  </button>
                  
                  <button 
                    onClick={() => {
                      setInput("Optimize this function: ")
                      setFrequentlyUsedPrompts(prev => [...prev, "Optimize this function: "].slice(-10))
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all group ${
                      darkMode
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30'
                        : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                    }`}
                  >
                    <Zap size={10} />
                    Optimize
                  </button>
                  
                  <button 
                    onClick={() => {
                      setInput("Write documentation for: ")
                      setFrequentlyUsedPrompts(prev => [...prev, "Write documentation for: "].slice(-10))
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all group ${
                      darkMode
                        ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                    }`}
                  >
                    <BookOpen size={10} />
                    Docs
                  </button>

                  {/* Personalized suggestions based on usage */}
                  {frequentlyUsedPrompts.length > 0 && (
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <span>✨ Personalized</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Enhanced Input Container with Drag & Drop */}
            <div 
              className={`relative border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus-within:shadow-xl backdrop-blur-sm ${
                isDragOver
                  ? darkMode
                    ? 'border-blue-400 bg-blue-900/20 shadow-2xl scale-[1.02] ring-2 ring-blue-400/20'
                    : 'border-blue-400 bg-blue-50 shadow-2xl scale-[1.02] ring-2 ring-blue-400/20'
                  : darkMode 
                    ? 'bg-gray-800/90 border-gray-600 focus-within:border-blue-400 hover:border-gray-500' 
                    : 'bg-white/90 border-gray-200 focus-within:border-blue-500 hover:border-gray-300'
              } ${isWebSearchEnabled ? (darkMode ? 'ring-1 ring-blue-400/30' : 'ring-1 ring-blue-300/30') : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              
              {/* Drag Overlay */}
              {isDragOver && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-dashed border-blue-400">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <Camera size={24} className="text-white" />
                    </div>
                    <div className={`text-lg font-semibold mb-2 ${
                      darkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      Drop your image here
                    </div>
                    <div className={`text-sm ${
                      darkMode ? 'text-blue-400' : 'text-blue-500'
                    }`}>
                      Upload and analyze with AI
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Image Preview */}
              {imagePreview && (
                <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                  <div className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
                    uploadedImageUrl && !isUploadingImage 
                      ? darkMode
                        ? 'border-green-500/50 bg-green-900/10'
                        : 'border-green-300 bg-green-50'
                      : isUploadingImage
                        ? darkMode
                          ? 'border-blue-500/50 bg-blue-900/10'
                          : 'border-blue-300 bg-blue-50'
                        : darkMode
                          ? 'border-gray-600 bg-gray-700/30'
                          : 'border-gray-200 bg-gray-50'
                  }`}>
                    
                    {/* Upload Status Badge */}
                    <div className="absolute -top-3 left-4 z-10">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                        uploadedImageUrl && !isUploadingImage
                          ? 'bg-green-500 text-white'
                          : isUploadingImage
                            ? 'bg-blue-500 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-300 border border-gray-600'
                              : 'bg-white text-gray-700 border border-gray-200'
                      }`}>
                        {isUploadingImage ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading...</span>
                          </>
                        ) : uploadedImageUrl ? (
                          <>
                            <Check size={12} />
                            <span>Ready to send</span>
                          </>
                        ) : (
                          <>
                            <Camera size={12} />
                            <span>Image attached</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={clearSelectedImage}
                      className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                        darkMode
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                      title="Remove image"
                    >
                      ×
                    </button>

                    <div className="flex items-center gap-4 p-4">
                      {/* Image Thumbnail */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Upload Progress Overlay */}
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                              <div className="text-xs text-white font-medium">Processing</div>
                            </div>
                          </div>
                        )}

                        {/* Success Checkmark */}
                        {uploadedImageUrl && !isUploadingImage && (
                          <div className="absolute inset-0 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Details */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm truncate mb-1 ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {selectedImage?.name}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <div className={`flex items-center gap-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Database size={12} />
                            <span>{selectedImage && `${(selectedImage.size / 1024).toFixed(1)} KB`}</span>
                          </div>
                          
                          <div className={`flex items-center gap-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <FileText size={12} />
                            <span>{selectedImage?.type.split('/')[1]?.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Upload Progress */}
                        {isUploadingImage && (
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                Uploading to server...
                              </span>
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                Processing
                              </span>
                            </div>
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                              darkMode ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full animate-pulse w-3/4 transition-all duration-1000"></div>
                            </div>
                          </div>
                        )}

                        {/* Upload Complete */}
                        {uploadedImageUrl && !isUploadingImage && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-xs text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="font-medium">Upload complete • Ready for AI analysis</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {!isUploadingImage && !uploadedImageUrl && (
                          <button className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            darkMode
                              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}>
                            Replace
                          </button>
                        )}
                        
                        {uploadedImageUrl && !isUploadingImage && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Sparkles size={12} />
                            <span>AI Ready</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show staged file chip if a file is selected for ask-file flow */}
              {stagedFile && (
                <div className={`mx-4 mb-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}>
                  <Paperclip size={14} />
                  <span className="truncate max-w-[240px]">{stagedFile.name}</span>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {(stagedFile.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => setStagedFile(null)}
                    className={`ml-1 p-1 rounded hover:opacity-80 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    title="Remove file"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Textarea Container */}
              <div className="relative">
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className={`w-full bg-transparent border-0 px-4 py-3 pr-16 resize-none focus:outline-none text-base leading-relaxed ${
                    darkMode 
                      ? 'text-gray-100 placeholder-gray-400' 
                      : 'text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder={
                    isWebSearchEnabled 
                      ? messages.length === 0 
                        ? "🌐 Ask me anything with web search..." 
                        : "🌐 Continue with web search..."
                      : messages.length === 0 
                        ? "Ask me anything..." 
                        : "Continue the conversation..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  style={{ 
                    minHeight: '48px',
                    maxHeight: '120px'
                  }}
                />
                
                {/* Enhanced Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !selectedImage) || isStreaming}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-300 group ${
                    (input.trim() || selectedImage) && !isStreaming
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl scale-100 hover:scale-105 ring-2 ring-blue-500/20'
                      : darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-white text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title={isStreaming ? "Sending..." : "Send message"}
                >
                  {isStreaming ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} className="transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </div>
              
              {/* Compact Bottom Action Bar */}
              <div className={`flex items-center justify-between px-4 py-2 border-t rounded-b-2xl ${
                darkMode 
                  ? 'border-gray-600 bg-gray-700/50' 
                  : 'border-gray-100 bg-gray-50/50'
              }`}>
                {/* Hidden inputs */}
                <input
                  ref={generalUploadInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.webp,.bmp,.mp3,.wav,.ogg,.webm,.m4a,.csv,.eml,.ics"
                  onChange={handleGeneralFileSelect}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {/* Left Actions */}
                <div className="flex items-center gap-2">
                  {/* Agent Type Selector moved to left sidebar Assistants tab */}

                  <div className="w-64">
                    <ModelSelector
                      selectedModel={selectedLLM}
                      onModelChange={setSelectedLLM}
                      disabled={isStreaming || isAgentMode}
                    />
                  </div>
                  {/* Single Upload Button (visible only in normal mode) */}
                  {!isAgentMode && (
                    <button
                      onClick={() => generalUploadInputRef.current?.click()}
                      disabled={isStreaming}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all group relative text-xs font-medium border ${
                        isStreaming
                          ? (darkMode
                              ? 'text-gray-500 bg-gray-700/60 border-gray-600 cursor-not-allowed'
                              : 'text-gray-400 bg-white border-gray-200 cursor-not-allowed')
                          : (darkMode
                              ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 border-gray-600'
                              : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300')
                      }`}
                      title={'Upload file'}
                    >
                      <Paperclip size={14} className="" />
                      <span>Upload</span>
                    </button>
                  )}
                  {/* Image Upload Button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isStreaming || isAgentMode}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all group relative text-xs font-medium border ${
                      isStreaming || isAgentMode
                        ? (darkMode
                            ? 'text-gray-500 bg-gray-700/60 border-gray-600 cursor-not-allowed'
                            : 'text-gray-400 bg-white border-gray-200 cursor-not-allowed')
                        : (darkMode
                            ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 border-gray-600'
                            : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300')
                    }`}
                    title="Upload image for vision"
                  >
                    <Camera size={14} className="transition-transform group-hover:scale-110" />
                    <span>Image</span>
                  </button>
                  
                  {/* Web Search Toggle - Enhanced */}
                  <button
                    onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all group relative text-xs font-medium ${
                      isWebSearchEnabled
                        ? (darkMode
                            ? 'text-blue-300 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30'
                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200')
                        : (darkMode
                            ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600'
                            : 'text-gray-600 bg-white hover:bg-gray-50 border border-gray-200')
                    }`}
                  >
                    <Globe size={14} className={isWebSearchEnabled ? 'animate-pulse' : ''} />
                    <span className="font-medium text-xs ml-1">{isWebSearchEnabled ? 'Web On' : 'Web'}</span>
                  </button>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-200 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      selectedModel === 'OpenAI'
                        ? 'bg-green-500 shadow-sm shadow-green-500/50'
                        : 'bg-blue-500 shadow-sm shadow-blue-500/50'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedModel}
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                  {/* Agent Mode Toggle */}
                  <button 
                    onClick={() => setIsAgentMode(!isAgentMode)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer border ${
                      isAgentMode
                        ? (darkMode
                            ? 'bg-purple-900/40 border-purple-700 text-purple-200 hover:bg-purple-900/60'
                            : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100')
                        : (darkMode
                            ? 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700')
                    }`}
                    title={isAgentMode ? 'Disable Agent Mode' : 'Enable Agent Mode'}
                  >
                    <Bot size={14} className={isAgentMode ? 'text-purple-400' : 'text-current'} />
                    <span className="font-medium text-xs">{isAgentMode ? 'Agent ON' : 'Agent'}</span>
                  </button>
                  {/* Compact Templates Button */}
                  <button 
                    onClick={() => setShowPromptSuggestions(!showPromptSuggestions)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Templates"
                  >
                    <Lightbulb size={14} className="text-yellow-500" />
                    <span className="font-medium text-xs">Templates</span>
                  </button>
                  
                  {/* Voice Input Button */}
                  <button 
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-2 rounded-lg transition-all duration-200 ${ 
                      isRecording 
                        ? "bg-red-500 text-white shadow-md animate-pulse" 
                        : darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100 border border-gray-600 hover:border-gray-500"
                          : "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300"
                    }`}
                    title={isRecording ? "Stop recording" : "Voice input"}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
              </div>

              {/* Quick actions for recently uploaded files (always visible if files exist) */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.slice(-3).reverse().map(file => (
                    <FileQuickActions
                      key={file.id}
                      file={file}
                      onActionClick={handleQuickAction}
                      disabled={!activeChatId || isStreaming}
                      missingConfigs={configValidation?.missingConfigs || []}
                      
                    />
                  ))}
                </div>
              )}

              {/* Agent Mode content below prompt - Hidden, just for connection */}
              {isAgentMode && activeChatId && (
                <div className="hidden">
                  <AgentChat
                    ref={agentRef}
                    chatId={activeChatId}
                    darkMode={darkMode}
                    onFileCreated={(fileName, downloadUrl) => {
                      console.log('Agent created file:', fileName, downloadUrl)
                    }}
                    onMessageAdded={(message) => {
                      // Add agent messages to main chat
                      setMessages(prev => [...prev, {
                        role: message.role,
                        content: message.content,
                        timestamp: new Date(),
                        id: Date.now().toString() + "-agent",
                        type: "text"
                      }])
                    }}
                  />
                </div>
              )}
              {isAgentMode && !activeChatId && (
                <div className={`mt-3 p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <Bot size={16} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Create or select a conversation to start the Agent
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Web Search Status Indicator - Enhanced */}
            {isWebSearchEnabled && (
              <div className={`mt-2 flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-blue-200 border border-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Globe size={16} className="animate-pulse" />
                    <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping ${
                      darkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Web Search Enabled</span>
                    <span className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      Responses will include real-time information from the web
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsWebSearchEnabled(false)}
                  className={`p-1 rounded-lg transition-colors hover:bg-black/10 ${
                    darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'
                  }`}
                  title="Disable web search"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Keyboard Shortcuts Info */}
            <div className={`mt-2 text-xs flex items-center gap-4 px-2 py-1 rounded-lg transition-all ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span>💡 <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs font-mono">Enter</kbd> to send</span>
              <span><kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs font-mono">Ctrl+W</kbd> toggle web search</span>
              <span><kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs font-mono">Ctrl+N</kbd> new chat</span>
            </div>
            
            {/* Compact Prompt Templates */}
            {showPromptSuggestions && (
              <div className={`mt-3 border rounded-xl shadow-md p-4 ${
                darkMode
                  ? 'bg-gray-800 border-gray-600'
                  : 'bg-white border-gray-200'
              }`}>
                {/* Header */}
                <div className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <Lightbulb size={14} className="text-yellow-500" />
                  Templates
                </div>

                {/* Category Tabs (compact) */}
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {Object.entries(promptCategories).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPromptCategory(key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${ 
                        selectedPromptCategory === key
                          ? 'bg-blue-500 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                
                {/* Compact Prompt Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {promptCategories[selectedPromptCategory as keyof typeof promptCategories].prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInput(prompt)
                        setShowPromptSuggestions(false)
                        textareaRef.current?.focus()
                      }}
                      className={`text-left p-2 text-xs rounded-md transition-all border ${
                        darkMode
                          ? 'text-gray-300 hover:text-gray-100 bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500'
                          : 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-200'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}