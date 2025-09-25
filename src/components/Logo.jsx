import React from 'react'

export default function Logo({ className = '' }) {
  // Inline SVG so we can animate the red bar on each mount
  // Size is controlled via the className (uses Tailwind height/width)
  return (
    <svg className={className} viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="logoTitle">
      <title id="logoTitle">STARTX</title>
      {/* Red bar accent with slide animation */}
      <rect x="20" y="20" width="80" height="12" rx="3" className="startx-logo-bar" />
      {/* Wordmark */}
      <g className="fill-slate-900 dark:fill-white" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'" fontWeight="900" fontSize="64">
        <text x="20" y="95" letterSpacing="2">STARTX</text>
      </g>
    </svg>
  )
}


