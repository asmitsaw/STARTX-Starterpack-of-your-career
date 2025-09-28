import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function PublicHeader() {
  const { openAuthModal } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-transparent backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-10 w-auto md:h-12" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700 dark:text-slate-200">
          <a href="#home" className="hover:text-white transition">Home</a>
          <a href="#about" className="hover:text-white transition">About</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#contact" className="hover:text-white transition">Contact</a>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => openAuthModal('signin')}
            className="btn-outline"
          >
            Login
          </button>
          <button
            onClick={() => openAuthModal('signup')}
            className="btn-primary"
          >
            Sign up
          </button>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => openAuthModal('signin')}
            className="btn-primary"
          >
            Login / Sign up
          </button>
        </div>
      </div>
    </header>
  )
}


