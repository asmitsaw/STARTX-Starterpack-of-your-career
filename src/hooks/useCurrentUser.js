import { useEffect, useMemo, useState } from 'react'
import { useUser as useClerkUser } from '@clerk/clerk-react'

// API base for dev/prod (optional; not required for Clerk-only profile display)
const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:5174'
const apiFetch = (path, opts = {}) =>
  fetch(`${API_BASE}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts })

const LOCAL_KEY = 'sx_profile_overrides'

function readOverrides() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeOverrides(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  } catch {}
}

export function useCurrentUser() {
  const { user, isLoaded } = useClerkUser()
  const [error, setError] = useState(null)
  const [serverUser, setServerUser] = useState(null)
  const [backendProfile, setBackendProfile] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [overridesVersion, setOverridesVersion] = useState(0)

  // Optionally, map Clerk user to backend user for future persistence
  useEffect(() => {
    let ignore = false
    const linkOrEnsure = async () => {
      if (!user) return
      try {
        const localId = user.id
        setServerUser({ id: localId, name: user.fullName || user.firstName || 'Anonymous', email: user.primaryEmailAddress?.emailAddress || '' })
      } catch (e) {
        if (!ignore) setError(e)
      }
    }
    linkOrEnsure()
    return () => { ignore = true }
  }, [user])

  // Fetch backend profile once the user is loaded
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!isLoaded || !user) return
      setIsFetching(true)
      try {
        const res = await apiFetch('/api/users/me/profile')
        if (!res.ok) throw new Error('Failed to fetch profile')
        const data = await res.json()
        if (!cancelled) setBackendProfile(data)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [isLoaded, user?.id])

  // Listen for cross-component override updates
  useEffect(() => {
    const onBump = () => setOverridesVersion((v) => v + 1)
    window.addEventListener('sx_profile_overrides_updated', onBump)
    return () => window.removeEventListener('sx_profile_overrides_updated', onBump)
  }, [])

  const overrides = useMemo(() => readOverrides(), [user?.id, overridesVersion])

  const profile = useMemo(() => {
    if (!isLoaded) return null
    if (!user) return null
    const key = user.id
    const o = overrides[key] || {}
    const baseName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Anonymous'

    // Start from backend profile if available, otherwise Clerk-derived defaults
    const fromBackend = backendProfile ? {
      id: backendProfile.id || key,
      name: backendProfile.name || baseName,
      headline: backendProfile.headline || '',
      email: backendProfile.email || user.primaryEmailAddress?.emailAddress || serverUser?.email || '',
      title: backendProfile.title || 'Software Professional',
      location: backendProfile.location || 'India',
      connections: backendProfile.connections ?? 500,
      about: backendProfile.about || '',
      experience: Array.isArray(backendProfile.experience) ? backendProfile.experience : [],
      education: Array.isArray(backendProfile.education) ? backendProfile.education : [],
      skills: Array.isArray(backendProfile.skills) ? backendProfile.skills : [],
      avatarUrl: backendProfile.avatarUrl || user.imageUrl || null,
      bannerUrl: backendProfile.bannerUrl || null,
      highlights: Array.isArray(backendProfile.highlights) ? backendProfile.highlights : [],
    } : {
      id: key,
      name: baseName,
      headline: '',
      email: user.primaryEmailAddress?.emailAddress || serverUser?.email || '',
      title: 'Software Professional',
      location: 'India',
      connections: 500,
      about: '',
      experience: [],
      education: [],
      skills: [],
      avatarUrl: user.imageUrl || null,
      bannerUrl: null,
      highlights: [],
    }

    // Apply overrides last (local edits and UI-only values)
    return {
      ...fromBackend,
      ...o,
      experience: Array.isArray(o.experience) ? o.experience : fromBackend.experience,
      education: Array.isArray(o.education) ? o.education : fromBackend.education,
      skills: Array.isArray(o.skills) ? o.skills : fromBackend.skills,
      highlights: Array.isArray(o.highlights) ? o.highlights : fromBackend.highlights,
    }
  }, [user, isLoaded, overrides, serverUser, backendProfile])

  const updateProfile = async (partial) => {
    if (!user?.id) return
    // Persist to backend first; fall back to overrides if it fails
    try {
      const res = await apiFetch('/api/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify(partial || {}),
      })
      if (res.ok) {
        const data = await res.json()
        setBackendProfile(data)
      }
    } catch (e) {
      // Non-fatal; still apply local overrides
      setError(e)
    }

    const all = readOverrides()
    const current = all[user.id] || {}
    const next = { ...current, ...partial }
    all[user.id] = next
    writeOverrides(all)
    try { window.dispatchEvent(new Event('sx_profile_overrides_updated')) } catch {}
  }

  const clearProfileOverrides = () => {
    if (!user?.id) return
    const all = readOverrides()
    delete all[user.id]
    writeOverrides(all)
    try { window.dispatchEvent(new Event('sx_profile_overrides_updated')) } catch {}
  }

  return { profile, loading: !isLoaded || isFetching, error, updateProfile, clearProfileOverrides }
}


