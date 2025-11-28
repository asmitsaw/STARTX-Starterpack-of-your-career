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
    `${isActive ? 'text-startx-400' : 'text-white hover:text-startx-300'} transition-colors duration-300`;

  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  
  // Unread messages count
  const [unreadCount, setUnreadCount] = useState(0)
  
  // API base URL
  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5174";
  
  // Website features/pages for search
  const websiteFeatures = [
    { id: 'home', name: 'Home', path: '/', icon: icons.home, description: 'Main landing page' },
    { id: 'feed', name: 'Job Feed', path: '/feed', icon: icons.feed, description: 'Browse job opportunities' },
    { id: 'news', name: 'News', path: '/news', icon: icons.news, description: 'Latest tech news and updates' },
    { id: 'interview-dashboard', name: 'Interview Dashboard', path: '/interview-dashboard', icon: icons.interview, description: 'View your interview statistics' },
    { id: 'new-interview', name: 'New Interview', path: '/new-interview', icon: icons.interview, description: 'Start a new AI interview' },
    { id: 'interview-analytics', name: 'Interview Analytics', path: '/interview-analytics', icon: icons.interview, description: 'Analyze your interview performance' },
    { id: 'interview-history', name: 'Interview History', path: '/interview-history', icon: icons.interview, description: 'View past interviews' },
    { id: 'pitch', name: 'Pitch', path: '/pitch', icon: icons.pitch, description: 'Create and share your pitch' },
    { id: 'learning', name: 'Learning', path: '/learning', icon: icons.learning, description: 'Educational resources and courses' },
    { id: 'profile', name: 'Profile', path: '/profile', icon: icons.profile, description: 'Your personal profile' },
    { id: 'message', name: 'Messenger', path: '/message', icon: icons.message, description: 'Chat with connections' },
    { id: 'premium', name: 'Go Premium', path: '/premium', icon: icons.premium, description: 'Upgrade to premium features' },
  ];
  
  // Search features function
  const searchFeatures = (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      const lowerQuery = query.toLowerCase();
      const results = websiteFeatures.filter(feature => 
        feature.name.toLowerCase().includes(lowerQuery) ||
        feature.description.toLowerCase().includes(lowerQuery) ||
        feature.id.toLowerCase().includes(lowerQuery)
      );
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching features:', error);
      setSearchError('Error searching. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchFeatures(searchQuery)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return
      try {
        const { data } = await axios.get(`${API_BASE}/api/messages/unread-count`, {
          withCredentials: true
        })
        setUnreadCount(data.unreadCount || 0)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }
    
    fetchUnreadCount()
    // Poll every 5 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 5000)
    return () => clearInterval(interval)
  }, [user, API_BASE])
  
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
        <nav className="hidden gap-4 text-sm md:flex flex-shrink">
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
                  placeholder="Search features..."
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
                        onClick={() => searchFeatures(searchQuery)}
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
                    No features found matching "{searchQuery}"
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(feature => (
                    <Link 
                      key={feature.id} 
                      to={feature.path}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                      onClick={() => {
                        setShowSearchResults(false);
                        setIsSearchExpanded(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-startx-400 to-teal-500 flex items-center justify-center text-white">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{feature.name}</div>
                        <div className="text-sm text-white/60">{feature.description}</div>
                      </div>
                    </Link>
                  ))
                ) : null}
              </div>
            )}
          </div>
          
          {/* Notifications button - Unread Messages */}
          <Link to="/message" className="relative text-white hover:text-startx-300 transition-colors" title={`${unreadCount} unread messages`}>
            {icons.bell}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 ring-2 ring-dark-900 flex items-center justify-center text-xs font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
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


