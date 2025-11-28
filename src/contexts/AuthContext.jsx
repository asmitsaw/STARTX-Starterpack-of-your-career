import React, { useState, createContext, useContext } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'

// Create Auth Context
const AuthContext = createContext()

// Auth Provider Component
export function AuthProvider({ children }) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('signin')

  // Use Clerk's authentication hooks
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user: clerkUser } = useUser()

  const openAuthModal = (mode = 'signin') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
  }

  // Create a user object that matches what the app expects
  const user = clerkUser ? {
    id: clerkUser.id,
    clerkId: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    name: clerkUser.fullName || clerkUser.firstName,
    firstName: clerkUser.firstName,
    fullName: clerkUser.fullName,
    imageUrl: clerkUser.imageUrl,
    getToken: getToken,
    // Add other properties as needed
  } : null

  return (
    <AuthContext.Provider value={{
      showAuthModal,
      authMode,
      openAuthModal,
      closeAuthModal,
      isAuthenticated: isLoaded && isSignedIn,
      user,
      isLoaded
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}