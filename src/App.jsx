import React, { useState, createContext, useContext, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import PublicHeader from './components/PublicHeader.jsx'
import Footer from './components/Footer.jsx'
import AuthModal from './components/AuthModal.jsx'
import Home from './pages/Home.jsx'
import Landing from './pages/Landing.jsx'
import Feed from './pages/Feed.jsx'
import News from './pages/News.jsx'
import MockInterview from './pages/MockInterview.jsx'
import InterviewSession from './pages/InterviewSession.jsx'
import InterviewDashboard from './pages/InterviewDashboard.jsx'
import InterviewAnalytics from './pages/InterviewAnalytics.jsx'
import NewInterview from './pages/NewInterview.jsx'
import InterviewHistory from './pages/InterviewHistory.jsx'
import Pitch from './pages/Pitch.jsx'
import Package from './pages/Package.jsx'
import Resume from './pages/Resume.jsx'
import Activity from './pages/Activity.jsx'
import Profile from './pages/Profile.jsx'
import { useAuth as useClerkAuth, SignedIn, SignedOut } from '@clerk/clerk-react'
import Learning from './pages/Learning.jsx'
import Message from './pages/Message.jsx'

// Create Auth Context
const AuthContext = createContext()

// Auth Provider Component
function AuthProvider({ children }) {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('signin')

  const openAuthModal = (mode = 'signin') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const closeAuthModal = () => {
    setShowAuthModal(false)
  }

  return (
    <AuthContext.Provider value={{
      showAuthModal,
      authMode,
      openAuthModal,
      closeAuthModal
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

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isSignedIn } = useClerkAuth()
  const { openAuthModal } = useAuth()
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false)

  useEffect(() => {
    // Only show the auth modal once when the component mounts
    if (!isSignedIn && !hasAttemptedAuth) {
      openAuthModal('signin')
      setHasAttemptedAuth(true)
    }
  }, [isSignedIn, hasAttemptedAuth, openAuthModal])

  // If not signed in, keep showing the current page with the modal open
  if (!isSignedIn) return null

  return children
}

// Main App Component
function AppContent() {
  const { showAuthModal, authMode, openAuthModal, closeAuthModal } = useAuth()
  const { isSignedIn } = useClerkAuth()

  useEffect(() => {
    // Auto-close auth modal once Clerk reports signed-in
    if (isSignedIn && showAuthModal) {
      closeAuthModal()
    }
  }, [isSignedIn, showAuthModal, closeAuthModal])

  // After modal closes, ping API to ensure user exists in DB
  useEffect(() => {
    const ensure = async () => {
      try {
        const res = await fetch('http://localhost:5174/api/ensure-user', { method: 'POST', credentials: 'include' })
        // ignore body
      } catch {}
    }
    if (isSignedIn && !showAuthModal) ensure()
  }, [isSignedIn, showAuthModal])

  return (
    <BrowserRouter>
      <div className="min-h-screen no-shift dark bg-dark-950 text-white">
        <SignedIn>
          <Header />
        </SignedIn>
        <SignedOut>
          <PublicHeader />
        </SignedOut>
        <main>
          <Routes>
            <Route path="/" element={isSignedIn ? <Home /> : <Landing />} />
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
            <Route path="/mock" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
            <Route path="/interview-session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
            <Route path="/interview-dashboard" element={<ProtectedRoute><InterviewDashboard /></ProtectedRoute>} />
            <Route path="/interview-analytics" element={<ProtectedRoute><InterviewAnalytics /></ProtectedRoute>} />
            <Route path="/new-interview" element={<ProtectedRoute><NewInterview /></ProtectedRoute>} />
            <Route path="/interview-history" element={<ProtectedRoute><InterviewHistory /></ProtectedRoute>} />
            <Route path="/pitch" element={<ProtectedRoute><Pitch /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><Package /></ProtectedRoute>} />
            <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/message" element={<ProtectedRoute><Message /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={closeAuthModal}
          mode={authMode}
        />
      </div>
    </BrowserRouter>
  )
}

// Main App with Auth Provider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}


