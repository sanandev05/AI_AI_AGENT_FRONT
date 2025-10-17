"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, clearAuthToken } from '../../components/auth'
import Link from 'next/link'

export default function ProfilePage(){
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState({ name: '', email: '' })

  useEffect(()=>{
    // simple client-side auth guard
    if(!isAuthenticated()){
      router.replace(`/auth/login?returnTo=${encodeURIComponent('/profile')}`)
      return
    }

    // read basic profile info from localStorage if available
    try {
      const name = localStorage.getItem('auth_name') || ''
      const email = localStorage.getItem('auth_email') || ''
      setUser({ name, email })
    } catch {
      setUser({ name: '', email: '' })
    }
    setReady(true)
  }, [])

  function handleSignOut(){
    clearAuthToken()
    // clear stored profile
    try { localStorage.removeItem('auth_name'); localStorage.removeItem('auth_email') } catch {}
    router.replace('/auth/login')
  }

  if(!ready) return null

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4 bg-[var(--background-main)]">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">{(user.name && user.name[0]) || 'U'}</div>
            <div>
              <div className="text-lg font-medium text-[var(--text-primary)]">{user.name || 'Your name'}</div>
              <div className="text-sm text-[var(--text-tertiary)]">{user.email || 'you@company.com'}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/6">
            <ul className="space-y-2">
              <li><Link href="/profile/settings" className="block text-sm text-[var(--text-primary)] px-3 py-2 rounded-xl hover:bg-white/6">Profile settings</Link></li>
              <li><Link href="/profile/billing" className="block text-sm text-[var(--text-primary)] px-3 py-2 rounded-xl hover:bg-white/6">Billing & plans</Link></li>
              <li><Link href="/profile/security" className="block text-sm text-[var(--text-primary)] px-3 py-2 rounded-xl hover:bg-white/6">Security</Link></li>
            </ul>
          </div>

          <div className="pt-4 border-t border-white/6 flex items-center justify-between">
            <div className="text-sm text-[var(--text-tertiary)]">Member since <span className="ml-1">—</span></div>
            <div className="flex items-center gap-3">
              <button onClick={handleSignOut} className="px-3 py-2 rounded-xl bg-transparent border border-white/10 text-sm">Sign out</button>
              <Link href="/" className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
