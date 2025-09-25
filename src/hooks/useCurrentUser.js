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
  const [overridesVersion, setOverridesVersion] = useState(0)

  // Optionally, map Clerk user to backend user for future persistence
  useEffect(() => {
    let ignore = false
    const linkOrEnsure = async () => {
      if (!user) return
      try {
        // If your backend supports ensure-user by email, you could call it here
        // and then fetch additional server-only fields. Safe to skip if not available.
        // Keeping try/catch silent to avoid blocking UI.
        const localId = user.id
        setServerUser({ id: localId, name: user.fullName || user.firstName || 'Anonymous', email: user.primaryEmailAddress?.emailAddress || '' })
      } catch (e) {
        if (!ignore) setError(e)
      }
    }
    linkOrEnsure()
    return () => { ignore = true }
  }, [user])

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
    return {
      id: key,
      name: o.name || baseName,
      headline: o.headline || '',
      email: user.primaryEmailAddress?.emailAddress || serverUser?.email || '',
      // editable client-side additions
      title: o.title || 'Software Professional',
      location: o.location || 'India',
      connections: o.connections ?? 500,
      about: o.about || '',
      experience: Array.isArray(o.experience) ? o.experience : [],
      education: Array.isArray(o.education) ? o.education : [],
      skills: Array.isArray(o.skills) ? o.skills : [],
      avatarUrl: o.avatarUrl || user.imageUrl || null,
      bannerUrl: o.bannerUrl || null,
    }
  }, [user, isLoaded, overrides, serverUser])

  const updateProfile = (partial) => {
    if (!user?.id) return
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

  return { profile, loading: !isLoaded, error, updateProfile, clearProfileOverrides }
}


