import React, { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../App.jsx'
import { icons } from '../assets/icons.jsx'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'

export default function Header() {
  const { openAuthModal } = useAuth()
  const { user } = useUser()
  const navLinkClass = ({ isActive }) =>
    `${isActive ? 'text-startx-400' : 'text-slate-300 hover:text-white'} transition-colors duration-300`;

  const location = useLocation()
  useEffect(() => {
    // Minimal JS to toggle the language submenu within the dropdown
    const btn = document.getElementById('lang-toggle')
    const menu = document.getElementById('lang-menu')
    if (!btn || !menu) return
    const handler = (e) => {
      e.preventDefault()
      menu.classList.toggle('hidden')
    }
    btn.addEventListener('click', handler)
    return () => btn.removeEventListener('click', handler)
  }, [])
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-transparent backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          {/* Key the logo by pathname so the red bar animation re-triggers on navigation */}
          <Logo key={location.pathname} className="h-10 w-auto md:h-12" />
        </Link>
        <nav className="hidden gap-8 text-sm md:flex">
          <NavLink to="/" end className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
              <span className="text-current">{icons.home}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">Home</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
          <NavLink to="/feed" className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
              <span className="text-current">{icons.feed}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">Job</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
          <NavLink to="/news" className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
              <span className="text-current">{icons.news}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">News</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
          <div className="relative group">
            <NavLink to="/interview-dashboard" className={navLinkClass}>
              <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
                <span className="text-current">{icons.interview}</span>
                <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">AI Interview</span>
                <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
              </div>
            </NavLink>
            <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-dark-800 border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-150 ease-in-out z-10">
              <div className="py-1">
                <NavLink to="/interview-dashboard" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                  Dashboard
                </NavLink>
                <NavLink to="/new-interview" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                  New Interview
                </NavLink>
                <NavLink to="/interview-analytics" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                  Analytics
                </NavLink>
                <NavLink to="/mock" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                  Legacy Interview
                </NavLink>
              </div>
            </div>
          </div>
          <NavLink to="/pitch" className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
              <span className="text-current">{icons.pitch}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">Pitch</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
          <NavLink to="/learning" className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
              <span className="text-current">{icons.learning}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">Learning</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
            <span className="text-current">{icons.profile}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">Profile</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
         
          <NavLink to="/message" className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
            <span className="text-current">{icons.message}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">Messenger</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
          <NavLink to="/premium" className={navLinkClass}>
            <div className="group relative flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ease-out hover:bg-white/5">
              <span className="text-current">{icons.premium}</span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-300 ease-out">Go Premium</span>
              <span className="absolute -bottom-0.5 left-2 right-2 h-[2px] scale-x-0 group-hover:scale-x-100 bg-startx-500 transition-transform origin-left"></span>
            </div>
          </NavLink>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <button className="relative text-slate-300 hover:text-white transition-colors" title="Notifications">
            {icons.bell}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-dark-900"></span>
          </button>
          <SignedOut>
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
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-8 w-8' } }} />
              <span className="text-sm text-slate-300">{user?.fullName}</span>
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  )
}


