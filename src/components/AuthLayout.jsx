import React from 'react'

export default function AuthLayout({ children, title }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--background-main)]">
      <main className="max-w-md w-full mx-auto p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{title || 'Welcome'}</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-2">Secure access to your workspace</p>
        </div>
        {children}
      </main>
    </div>
  )
}
