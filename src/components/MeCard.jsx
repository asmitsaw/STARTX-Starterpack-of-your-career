import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileCard from './ProfileCard.jsx'

export default function MeCard({ profile, onContactClick, ...props }) {
  const navigate = useNavigate()
  const handleContact = useCallback(() => {
    if (onContactClick) return onContactClick()
    navigate('/profile')
  }, [navigate, onContactClick])

  const mapped = useMemo(() => {
    if (!profile) return null
    const name = profile.name || profile.full_name || 'Your Name'
    const title = profile.title || profile.headline || profile.role || 'Software Developer'
    const avatarUrl = profile.avatarUrl || profile.avatar_url || null
    const handle = (profile.username || name || 'user').toLowerCase().replace(/\s+/g, '')
    return { name, title, avatarUrl, handle }
  }, [profile])

  return (
    <ProfileCard
      name={mapped?.name ?? props.name}
      title={mapped?.title ?? props.title}
      avatarUrl={mapped?.avatarUrl ?? props.avatarUrl}
      handle={mapped?.handle ?? props.handle}
      status={props.status ?? (profile ? 'Online' : 'Offline')}
      contactDisabled={!profile}
      onContactClick={handleContact}
    />
  )
}


