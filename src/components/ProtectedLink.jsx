"use client"
import { useRouter } from 'next/navigation'
import React from 'react'
import { isAuthenticated } from './auth'

export default function ProtectedLink({ href = '/profile', children, className = '', style = {} }){
  const router = useRouter()
  function handleClick(e){
    e.preventDefault()
    if(isAuthenticated()){
      router.push(href)
    } else {
      // add returnTo so user can be redirected after login
      router.push(`/auth/login?returnTo=${encodeURIComponent(href)}`)
    }
  }
  return (
    <a href={href} onClick={handleClick} className={className} style={style}>{children}</a>
  )
}
