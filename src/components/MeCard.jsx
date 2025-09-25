import React, { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser.js'

export default function MeCard({
  bannerColorFrom = '#e5e7eb', // slate-200
  bannerColorTo = '#f1f5f9',   // slate-100
}) {
  const { profile, loading } = useCurrentUser()
  const displayName = profile?.name || 'Your Name'
  const location = profile?.location || 'Your City'
  const headline = profile?.title || profile?.headline || ''
  const education = (profile?.education?.[0]?.degree && profile?.education?.[0]?.school)
    ? `${profile.education[0].degree} @ ${profile.education[0].school}`
    : 'Add your education'
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const last = parts[1]?.[0] ?? ''
    return (first + last).toUpperCase()
  }, [displayName])

  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleAvatarClick = () => fileRef.current?.click()

  const uploadAvatar = async (file) => {
    if (!file) return
    try {
      setUploading(true)
      const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:5174'
      const form = new FormData()
      form.append('avatar', file)
      const res = await fetch(`${API_BASE}/api/users/avatar`, {
        method: 'PUT',
        credentials: 'include',
        body: form,
      })
      const data = await res.json()
      // naive refresh; in a real app use a profile store/refetch hook
      if (data?.avatar_url) window.location.reload()
    } finally {
      setUploading(false)
    }
  }

  return (
    <aside className="sticky top-16">
      <div className="glass rounded-2xl p-0 shadow-card ring-1 ring-white/60 transition-shadow hover:shadow-lg">
        {/* Banner */}
        <div
          className="h-20 w-full rounded-t-2xl overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${bannerColorFrom}, ${bannerColorTo})` }}
        >
          {profile?.bannerUrl && (
            <img src={profile.bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Avatar */}
        <div className="px-5">
          <div className="-mt-10 inline-block rounded-full bg-gradient-to-br from-startx-600 to-startx-800 p-1 ring-4 ring-white shadow-sm relative cursor-pointer" onClick={handleAvatarClick} title="Change avatar">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover bg-white" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-semibold text-startx-700">
                {initials || 'ME'}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
            {uploading && <span className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full bg-white grid place-items-center text-[10px]">…</span>}
          </div>
        </div>

        {/* Info */}
        <div className="px-5 pb-5">
          <h3 className="mt-2 line-clamp-1 text-lg font-semibold tracking-wide text-slate-900">
            {loading ? 'Loading…' : displayName?.toUpperCase()}
          </h3>
          {headline ? (
            <Link to="/profile" className="group inline-flex items-center gap-1 text-sm text-slate-700 hover:text-startx-700">
              <span className="line-clamp-1 group-hover:underline">{headline}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">✏️</span>
            </Link>
          ) : (
            <Link to="/profile" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-startx-700">
              <span className="rounded-full px-2 py-0.5 bg-slate-100 dark:bg-white/10">Add a headline</span>
            </Link>
          )}
          <p className="text-sm text-slate-600">{location}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-800">
            <span aria-hidden>🎓</span>
            <span className="line-clamp-1">{education}</span>
          </p>

          <div className="mt-4 flex gap-2">
            <Link to="/profile" className="btn-primary">View Profile</Link>
            <Link to="/feed" className="btn-outline">Open Feed</Link>
          </div>
        </div>
      </div>
    </aside>
  )
}


