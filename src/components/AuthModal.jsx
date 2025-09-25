import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { SignIn, SignUp } from '@clerk/clerk-react'

export default function AuthModal({ isOpen, onClose, mode = 'signin' }) {
  const [authMode, setAuthMode] = useState(mode)

  useEffect(() => {
    if (!isOpen) return
    const applyFromHash = () => {
      const h = window.location.hash
      if (h.includes('/sign-up')) setAuthMode('signup')
      else if (h.includes('/sign-in')) setAuthMode('signin')
    }
    applyFromHash()
    const onHash = () => applyFromHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [isOpen])

  useEffect(() => {
    if (mode !== authMode) setAuthMode(mode)
  }, [mode])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold">
              {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-white/90">
              {authMode === 'signin' 
                ? 'Sign in to your account' 
                : 'Get started with STARTX'
              }
            </p>
          </div>

          {/* Clerk Auth */}
          <div className="p-6">
            {authMode === 'signin' ? (
              <SignIn
                appearance={{ elements: { card: 'shadow-none border border-gray-200 rounded-xl' } }}
                routing="hash"
                signUpUrl="#/sign-up"
                afterSignInUrl={window.location.pathname}
              />
            ) : (
              <SignUp
                appearance={{ elements: { card: 'shadow-none border border-gray-200 rounded-xl' } }}
                routing="hash"
                signInUrl="#/sign-in"
                afterSignUpUrl={window.location.pathname}
              />
            )}
            <div className="mt-4 text-center text-sm">
              {authMode === 'signin' ? (
                <button
                  onClick={() => { window.location.hash = '/sign-up'; setAuthMode('signup') }}
                  className="text-gray-600 hover:text-blue-600"
                >
                  Don't have an account? Sign up
                </button>
              ) : (
                <button
                  onClick={() => { window.location.hash = '/sign-in'; setAuthMode('signin') }}
                  className="text-gray-600 hover:text-blue-600"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
