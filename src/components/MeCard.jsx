import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileCard from './ProfileCard.jsx'

export default function MeCard({ profile, onContactClick, contactText, ...props }) {
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
      name={mapped?.name ?? props.name ?? 'Your Name'}
      title={mapped?.title ?? props.title ?? 'Software Developer'}
      avatarUrl={mapped?.avatarUrl ?? props.avatarUrl}
      handle={mapped?.handle ?? props.handle ?? 'user'}
      status={props.status ?? (profile ? 'Online' : 'Offline')}
      contactText={contactText ?? 'View Profile'}
      contactDisabled={!profile}
      onContactClick={handleContact}
      enableTilt={true}
      showBehindGradient={true}
    />
  )
}


