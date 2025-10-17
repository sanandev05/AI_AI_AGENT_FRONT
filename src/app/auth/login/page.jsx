"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '../../../components/AuthLayout'
import TextField from '../../../components/TextField'
import PasswordField from '../../../components/PasswordField'
import Button from '../../../components/Button'
import SocialButtons from '../../../components/SocialButtons'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { login, loading, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setErrors({})
    if (isSubmitted) {
      validateForm()
    }
  }, [email, password, isSubmitted])

  const validateForm = () => {
    const newErrors = {}
    
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const emailValid = email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  const passwordValid = password.length >= 6
  const formValid = emailValid && passwordValid

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitted(true)
    
    if (!validateForm()) {
      return
    }
    
    const success = await login(email, password)
    if (success) {
      router.push("/chat")
    } else if (error) {
      setErrors({ form: error })
    }
  }

  return (
    <AuthLayout title="Sign in to AI Assistant">
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 space-y-6 shadow-xl max-w-md mx-auto">
        
        {/* Email Field */}
        <div className="space-y-1">
          <TextField
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            className={`transition-all duration-200 ${
              email && emailValid ? 'ring-green-500/30 ring-2' : 
              email && !emailValid ? 'ring-red-500/30 ring-2' : ''
            }`}
          />
          {email && emailValid && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <span>✓</span> Valid email address
            </div>
          )}
        </div>
        
        {/* Password Field */}
        <div className="space-y-1">
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password}
            className={`transition-all duration-200 ${
              password && passwordValid ? 'ring-green-500/30 ring-2' : 
              password && !passwordValid ? 'ring-red-500/30 ring-2' : ''
            }`}
          />
          {password && passwordValid && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <span>✓</span> Password looks good
            </div>
          )}
        </div>
        
        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer group">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-transparent border-2 border-gray-400 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
            />
            <span className="group-hover:text-white transition-colors">Remember me</span>
          </label>
          <Link 
            href="/auth/forgot" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        
        {/* Form Errors */}
        {(errors.form || error) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-sm text-red-400 text-center">
              {errors.form || error}
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={!formValid || loading} 
          loading={loading} 
          className={`w-full text-base py-3 rounded-xl font-medium transition-all duration-200 ${
            formValid 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        
        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-xs text-gray-400 px-2">or continue with</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        
        {/* Social Buttons */}
        <SocialButtons />
        
        {/* Sign Up Link */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link 
              href="/auth/register" 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}