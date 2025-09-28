import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function MockInterview() {
  // Redirect to the new dashboard page
  return <Navigate to="/interview-dashboard" replace />
  
  /* Keeping the original code commented out for reference
  const { openAuthModal } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState('Junior')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const inputWrapperRef = useRef(null)

  const roleSuggestions = [
    'Frontend Engineer',
    'Backend Engineer',
    'Full‑stack Engineer',
    'Mobile Engineer',
    'Data Engineer',
    'Machine Learning Engineer',
    'AI Engineer',
    'DevOps Engineer',
    'Site Reliability Engineer',
    'Platform Engineer',
    'Security Engineer',
    'Cloud Engineer',
    'UI Engineer',
    'Product Designer',
    'QA Engineer',
    'Embedded Engineer',
    'Game Developer',
    'Solutions Architect',
    'Technical Program Manager',
    'Data Scientist',
  ]

  const filteredRoles = roleSuggestions.filter((r) =>
    r.toLowerCase().includes(role.toLowerCase())
  ).slice(0, 12)

  useEffect(() => {
    const onDocClick = (e) => {
      if (!inputWrapperRef.current) return
      if (!inputWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])
  
  // Check if interview was completed when returning from interview session
  useEffect(() => {
    if (location.state?.interviewCompleted) {
      setInterviewCompleted(true)
      
      // Clear the location state after reading it
      window.history.replaceState({}, document.title)
      
      // Reset the flag after 5 seconds
      const timer = setTimeout(() => {
        setInterviewCompleted(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [location.state])
  const benefitsByTab = [
    [
      'Role‑specific coding and CS questions',
      'Timed rounds with hints and stepwise scoring',
      'Detailed code review with complexity analysis',
    ],
    [
      'Real workplace scenarios and STAR prompts',
      'Structured feedback on clarity and impact',
      'Follow‑ups to deepen examples and metrics',
    ],
    [
      'Architectural trade‑off questions by scale',
      'Requirements to constraints breakdown practice',
      'Diagrams with bottleneck analysis and capacity math',
    ],
  ]

  // AI chat temporarily disabled

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">AI Mock Interview</h1>
        <span className="badge">Beta</span>
      </div>
      
      {interviewCompleted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Interview completed successfully!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your interview results have been saved. You can start another interview or view your past interviews in the Activity section.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <SegmentedTabs
          tabs={["Technical", "Behavioral", "System Design"]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="card">
          <p className="text-slate-600">
            Practice interviews powered by AI. Choose a role, get realistic questions, and receive structured feedback.
          </p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Target role</label>
              <div ref={inputWrapperRef} className="relative mt-1">
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                  placeholder="e.g., Frontend Engineer"
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setShowSuggestions(true) }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredRoles.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
                    ) : (
                      filteredRoles.map((r) => (
                        <button
                          type="button"
                          key={r}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={() => { setRole(r); setShowSuggestions(false) }}
                        >
                          {r}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Experience</label>
              <select 
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-startx-500 focus:outline-none focus:ring-2 focus:ring-startx-200"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              >
                <option>Junior</option>
                <option>Mid</option>
                <option>Senior</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Mode</label>
              <input disabled value={["Technical","Behavioral","System Design"][tab]} className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900" />
            </div>
            <div className="sm:col-span-2 mt-2 flex gap-2">
              <button 
                type="button" 
                className="btn-primary"
                disabled={!role.trim()}
                onClick={() => {
                  navigate('/interview-session', {
                    state: {
                      interviewParams: {
                        role: role,
                        experience: experience,
                        mode: ["Technical", "Behavioral", "System Design"][tab]
                      }
                    }
                  });
                }}
              >
                Start Interview
              </button>
              <button type="button" className="btn-outline">View Samples</button>
            </div>
          </form>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-700">What you get</p>
          <ul className="mt-3 space-y-2 text-slate-700">
            {benefitsByTab[tab].map((b) => (
              <li key={b} className="flex items-start gap-2"><span>✅</span> {b}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
  */
}


