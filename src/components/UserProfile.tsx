import React, { useState } from 'react'
import { User, LogOut, Settings, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function UserProfile() {
  const { user, logout, loading } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  // If no user, show login prompt
  if (!user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-center text-sm text-[var(--text-secondary)]">
          Please sign in to access all features
        </div>
        <button
          onClick={() => router.push('/auth/login')}
          className="w-full px-4 py-2 bg-[var(--github-blue)] text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* User Info Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
      >
        <div className="w-8 h-8 bg-[var(--github-blue)] rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {user.name || user.email?.split('@')[0] || 'User'}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            {user.email}
          </div>
        </div>
        {showMenu ? (
          <ChevronDown size={16} className="text-[var(--text-secondary)]" />
        ) : (
          <ChevronUp size={16} className="text-[var(--text-secondary)]" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => {
              setShowMenu(false)
              // You can add profile settings later
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors text-left"
          >
            <Settings size={16} className="text-[var(--text-secondary)]" />
            <span className="text-sm text-[var(--text-primary)]">Profile Settings</span>
          </button>
          
          <div className="border-t border-[var(--panel-border)]">
            <button
              onClick={() => {
                setShowMenu(false)
                handleLogout()
              }}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 hover:text-red-600 transition-colors text-left disabled:opacity-50"
            >
              <LogOut size={16} className="text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-primary)]">
                {loading ? 'Signing out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
