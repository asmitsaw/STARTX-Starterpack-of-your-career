import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { icons } from '../assets/icons.jsx'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import { useThemeMode } from '../contexts/ThemeContext.jsx'
import axios from 'axios'
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler'

export default function Header() {
  // AnimatedThemeToggler component
  const AnimatedThemeTogglerFixed = () => {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatedThemeToggler />
      </div>
    )
  }
  const { openAuthModal } = useAuth()
  const { user } = useUser()
  const { isDark, toggleTheme } = useThemeMode()
  const navLinkClass = ({ isActive }) =>
    `${isActive ? 'text-startx-400' : 'text-slate-300 hover:text-white'} transition-colors duration-300`;

  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  
  // API base URL
  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5174";
  
  // Search users function
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      // Add a timeout to the request to handle slow responses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await axios.get(
        `${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.users) {
        setSearchResults(response.data.users || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      
      if (error.name === 'AbortError') {
        setSearchError('Request timed out. Please try again.');
      } else if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        let errorMessage = 'Server error occurred';
        
        if (status === 404) {
          errorMessage = 'Search service not found';
        } else if (status === 401 || status === 403) {
          errorMessage = 'Not authorized to search users';
        } else if (status >= 500) {
          errorMessage = 'Server is currently unavailable';
        }
        
        setSearchError(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        setSearchError('No response from server. Please check your connection.');
      } else {
        // Something else caused the error
        setSearchError(error.message || 'Unknown error occurred');
      }
      
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking inside the search container
      if (e.target.closest('.search-container')) return;
      
      setShowSearchResults(false);
      // Clear error when closing search results
      if (searchError) {
        setSearchError(null);
      }
    }
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchError])
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
    <>
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
              <span className="text-current relative">
                {icons.profile}
              </span>
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
          {/* Search Bar */}
          <div className="relative search-container" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex items-center">
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-52 opacity-100' : 'w-0 opacity-0'}`}>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full h-9 px-4 py-2 rounded-l-full bg-white/10 text-white placeholder-white/60 border-y border-l border-white/20 focus:outline-none focus:border-startx-400/50 focus:ring-1 focus:ring-startx-400/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setShowSearchResults(true);
                    setSearchError(null);
                  }}
                  autoFocus={isSearchExpanded}
                />
              </div>
              <button 
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className={`h-9 w-9 shadow-md shadow-startx-500/20 rounded-full bg-gradient-to-r from-startx-400 to-teal-500 flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-startx-500/30 ${isSearchExpanded ? 'rounded-l-none' : ''}`}
                aria-label="Toggle search"
              >
                {isSearching ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full mt-1 w-full bg-dark-800 border border-white/10 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchError ? (
                  <div className="p-4 text-center">
                    <div className="text-red-400 mb-2 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Search Failed</span>
                    </div>
                    <p className="text-sm text-white/70 mb-3">{searchError}</p>
                    <div className="flex justify-center gap-2">
                      <button 
                        className="px-4 py-1.5 bg-startx-500 text-white text-sm rounded-md hover:bg-startx-600 transition-colors"
                        onClick={() => searchUsers(searchQuery)}
                      >
                        Try Again
                      </button>
                      <button 
                        className="px-4 py-1.5 bg-transparent border border-white/20 text-white text-sm rounded-md hover:bg-white/10 transition-colors"
                        onClick={() => {
                          setSearchError(null);
                          setSearchQuery('');
                        }}
                      >
                        Clear Search
                      </button>
                    </div>
                  </div>) : searchResults.length === 0 && searchQuery.trim() !== '' && !isSearching ? (
                  <div className="p-4 text-center text-white/70">
                    No users found matching "{searchQuery}"
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <Link 
                      key={user.id} 
                      to={`/profile/${user.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                      onClick={() => setShowSearchResults(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-startx-100 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-lg font-bold text-startx-700">
                            {user.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-white/60">{user.title}</div>
                      </div>
                    </Link>
                  ))
                ) : null}
              </div>
            )}
          </div>
          
          {/* Notifications button (keeping this in the header) */}
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
      <AnimatedThemeTogglerFixed />
    </>
  )
}


