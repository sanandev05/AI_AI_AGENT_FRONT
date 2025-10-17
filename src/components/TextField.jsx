import React from 'react'

export default function TextField({ id, label, type = 'text', value, onChange, placeholder, error, autoComplete, ...props }) {
  const describedBy = error ? `${id}-error` : undefined
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)] mb-1">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        autoComplete={autoComplete}
        className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        {...props}
      />
      {error && <div id={`${id}-error`} className="mt-1 text-xs text-rose-400">{error}</div>}
    </div>
  )
}
