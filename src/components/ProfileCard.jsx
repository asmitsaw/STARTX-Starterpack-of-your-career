import React, { useCallback, useRef, useEffect, useState } from 'react';
import defaultAvatar from '../assets/avatar.png';
import './ProfileCard.css';

const ProfileCardComponent = ({
  avatarUrl,
  name = 'Javi A. Torres',
  title = 'Software Engineer',
  handle = 'javicodes',
  status = 'Online',
  contactText = 'Contact Me',
  showUserInfo = true,
  contactDisabled = false,
  onContactClick,
  className = ''
}) => {
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
    
    // 3D tilt effect
    const centerX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const centerY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    
    cardRef.current.style.transform = `
      perspective(1000px) 
      rotateX(${centerY * -10}deg) 
      rotateY(${centerX * 10}deg) 
      translateZ(20px)
    `;
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
  }, []);

  const handleContactClick = useCallback(() => {
    onContactClick?.();
  }, [onContactClick]);

  return (
    <div 
      ref={cardRef}
      className={`profile-card ${className} ${isLoaded ? 'loaded' : ''} ${isHovered ? 'hovered' : ''}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`
      }}
    >
      {/* Animated background orbs */}
      <div className="profile-orb profile-orb-1"></div>
      <div className="profile-orb profile-orb-2"></div>
      <div className="profile-orb profile-orb-3"></div>
      
      {/* Spotlight effect */}
      <div className="profile-spotlight"></div>
      
      {/* Shimmer effect */}
      <div className="profile-shimmer"></div>

      <div className="profile-card-inner">
        {/* Header with name and title */}
        <div className="profile-header">
          <h2 className="profile-name">
            {name.split('').map((char, index) => (
              <span 
                key={index} 
                className="profile-name-char"
                style={{ '--char-index': index }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h2>
          <p className="profile-title">{title}</p>
        </div>

        {/* Main avatar */}
        <div className="profile-avatar-container">
          <div className="profile-avatar-glow"></div>
          <div className="profile-avatar-ring"></div>
          <img
            className="profile-avatar"
            src={avatarUrl || defaultAvatar}
            alt={`${name || 'User'} avatar`}
            loading="lazy"
            onError={e => {
              e.target.src = defaultAvatar;
            }}
          />
          <div className="profile-avatar-overlay"></div>
        </div>

        {/* Bottom info bar */}
        {showUserInfo && (
          <div className="profile-footer">
            <div className="profile-user-info">
              <div className="profile-mini-avatar">
                <img
                  src={avatarUrl || defaultAvatar}
                  alt={`${name} mini`}
                  onError={e => {
                    e.target.src = defaultAvatar;
                  }}
                />
                <div className="profile-status-indicator">
                  <div className="profile-status-dot"></div>
                </div>
              </div>
              <div className="profile-user-details">
                <span className="profile-handle">@{handle}</span>
                <span className="profile-status">{status}</span>
              </div>
            </div>
            <button
              className="profile-contact-btn"
              onClick={handleContactClick}
              type="button"
              disabled={contactDisabled}
            >
              <span className="profile-btn-text">{contactText}</span>
              <div className="profile-btn-ripple"></div>
              <div className="profile-btn-glow"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);

export default ProfileCard;
