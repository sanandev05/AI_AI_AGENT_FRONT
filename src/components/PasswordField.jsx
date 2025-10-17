import React, { useState, useMemo } from 'react'

function strengthLabel(score) {
  if (score >= 3) return 'Strong'
  if (score === 2) return 'Medium'
  if (score === 1) return 'Weak'
  return 'Very weak'
}

export default function PasswordField({ id, label, value, onChange, placeholder, error, autoComplete }) {
  const [visible, setVisible] = useState(false)

  const score = useMemo(() => {
    let s = 0
    if (value.length >= 8) s++
    if (/[A-Z]/.test(value)) s++
    if (/[0-9]/.test(value)) s++
    if (/[^A-Za-z0-9]/.test(value)) s++
    return Math.min(s, 4)
  }, [value])

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)] mb-1">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={autoComplete}
          className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button type="button" onClick={() => setVisible(!visible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">{visible ? 'Hide' : 'Show'}</button>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden`}> 
            <div style={{ width: `${(score/4)*100}%` }} className={`h-2 bg-gradient-to-r from-blue-500 to-purple-600`} />
          </div>
          <div className="ml-1">{strengthLabel(score)}</div>
        </div>
        {error && <div id={`${id}-error`} className="text-rose-400">{error}</div>}
      </div>
    </div>
  )
}
