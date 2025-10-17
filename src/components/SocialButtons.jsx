import React from 'react'

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-white/6" />
      <div className="text-xs text-[var(--text-tertiary)]">or continue with</div>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  )
}

export default function SocialButtons() {
  return (
    <div>
      <Divider />
      <div className="grid grid-cols-2 gap-3">
        <button className="w-full h-11 rounded-xl bg-white/6 text-[var(--text-primary)] flex items-center justify-center gap-2">Google</button>
        <button className="w-full h-11 rounded-xl bg-white/6 text-[var(--text-primary)] flex items-center justify-center gap-2">GitHub</button>
      </div>
    </div>
  )
}
