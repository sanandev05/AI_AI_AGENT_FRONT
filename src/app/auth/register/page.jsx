"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '../../../components/AuthLayout'
import TextField from '../../../components/TextField'
import PasswordField from '../../../components/PasswordField'
import Button from '../../../components/Button'
import SocialButtons from '../../../components/SocialButtons'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }
  
  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  
  score = Object.values(checks).filter(Boolean).length
  
  if (score < 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score < 4) return { score, label: 'Fair', color: 'bg-yellow-500' }
  if (score < 5) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

// Password requirements component
const PasswordRequirements = ({ password, show }) => {
  if (!show) return null
  
  const requirements = [
    { test: password.length >= 8, text: 'At least 8 characters' },
    { test: /[a-z]/.test(password), text: 'One lowercase letter' },
    { test: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { test: /\d/.test(password), text: 'One number' },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: 'One special character' }
  ]
  
  return (
    <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
      <p className="text-xs text-gray-400 mb-2">Password requirements:</p>
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className={`${req.test ? 'text-green-400' : 'text-gray-500'}`}>
              {req.test ? '✓' : '○'}
            </span>
            <span className={req.test ? 'text-green-400' : 'text-gray-400'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => { 
    setErrors({});
    if (isSubmitted) {
      validateForm();
    }
  }, [email, password, confirm, terms, isSubmitted]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!confirm) {
      newErrors.confirm = "Please confirm your password";
    } else if (password !== confirm) {
      newErrors.confirm = "Passwords do not match";
    }
    
    if (!terms) {
      newErrors.terms = "You must agree to the terms and conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const emailOk = !!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  const passOk = password.length >= 8;
  const matchOk = password === confirm && passOk;
  const formValid = emailOk && matchOk && terms;
  
  const passwordStrength = getPasswordStrength(password);

  async function handleRegister(e) {
    e.preventDefault();
    setIsSubmitted(true);
    
    if (!validateForm()) {
      return;
    }
    
    const success = await register(email, password, confirm, true);
    if (success) {
      router.push("/chat");
    } else if (error) {
      setErrors({ form: error });
    }
  }

  return (
    <AuthLayout title="Create your AI Assistant account">
      <form onSubmit={handleRegister} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 space-y-6 shadow-xl max-w-md mx-auto">
        
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
              email && emailOk ? 'ring-green-500/30 ring-2' : 
              email && !emailOk ? 'ring-red-500/30 ring-2' : ''
            }`}
          />
          {email && emailOk && (
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
            onFocus={() => setShowPasswordReqs(true)}
            onBlur={() => setShowPasswordReqs(false)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password}
            className={`transition-all duration-200 ${
              password && passOk ? 'ring-green-500/30 ring-2' : 
              password && !passOk ? 'ring-red-500/30 ring-2' : ''
            }`}
          />
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength.score < 2 ? 'text-red-400' :
                  passwordStrength.score < 4 ? 'text-yellow-400' :
                  passwordStrength.score < 5 ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              
              {/* Password Requirements */}
              <PasswordRequirements password={password} show={showPasswordReqs || !passOk} />
            </div>
          )}
        </div>
        
        {/* Confirm Password Field */}
        <div className="space-y-1">
          <PasswordField
            id="confirm"
            label="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirm}
            className={`transition-all duration-200 ${
              confirm && matchOk ? 'ring-green-500/30 ring-2' : 
              confirm && !matchOk ? 'ring-red-500/30 ring-2' : ''
            }`}
          />
          {confirm && password && (
            <div className={`flex items-center gap-1 text-xs ${
              matchOk ? 'text-green-400' : 'text-red-400'
            }`}>
              <span>{matchOk ? '✓' : '✗'}</span> 
              {matchOk ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}
        </div>
        
        {/* Terms Checkbox */}
        <div className="space-y-1">
          <label className="flex items-start gap-3 text-sm text-[var(--text-primary)] cursor-pointer group">
            <input
              type="checkbox"
              checked={terms}
              onChange={e => setTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-gray-400 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
            />
            <span className="group-hover:text-white transition-colors">
              I agree to the{' '}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && (
            <div className="text-xs text-red-400 mt-1">{errors.terms}</div>
          )}
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
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
        
        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-xs text-gray-400 px-2">or continue with</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        
        {/* Social Buttons */}
        <SocialButtons />
        
        {/* Sign In Link */}
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
