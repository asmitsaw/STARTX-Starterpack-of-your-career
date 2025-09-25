import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * SegmentedTabs renders a pill-style segmented control.
 * Set `instant` to true to disable the sliding animation and drag, so switching is immediate.
 */
export default function SegmentedTabs({ tabs, value, onChange, instant = false, fitToLabel = false }) {
  // Shared container ref
  const containerRef = useRef(null)

  // Mode A (default): equal-width segments (original look)
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    if (!fitToLabel) {
      const measure = () => {
        if (!containerRef.current) return
        setContainerWidth(containerRef.current.getBoundingClientRect().width)
      }
      measure()
      const ro = new ResizeObserver(measure)
      if (containerRef.current) ro.observe(containerRef.current)
      window.addEventListener('resize', measure)
      return () => {
        ro.disconnect()
        window.removeEventListener('resize', measure)
      }
    }
  }, [fitToLabel])
  const segmentWidth = useMemo(() => {
    return Math.max(1, Math.floor(containerWidth / Math.max(1, tabs.length)))
  }, [containerWidth, tabs.length])

  // Mode B (opt-in): fit indicator to active label
  const buttonRefs = useRef([])
  const [positions, setPositions] = useState([])
  const [widths, setWidths] = useState([])
  useEffect(() => {
    if (fitToLabel) {
      const measure = () => {
        if (!containerRef.current) return
        const xs = []
        const ws = []
        buttonRefs.current.forEach((el) => {
          if (!el) return
          xs.push(el.offsetLeft)
          ws.push(el.offsetWidth)
        })
        setPositions(xs)
        setWidths(ws)
      }
      measure()
      const ro = new ResizeObserver(measure)
      if (containerRef.current) ro.observe(containerRef.current)
      window.addEventListener('resize', measure)
      return () => {
        ro.disconnect()
        window.removeEventListener('resize', measure)
      }
    }
  }, [fitToLabel, tabs.length])
  const indicatorX = useMemo(() => positions[value] ?? 4, [positions, value])
  const indicatorW = useMemo(() => widths[value] ?? 0, [widths, value])

  const handleDragEnd = (_, info) => {
    if (fitToLabel) return // drag is not enabled in fit-to-label mode
    const x = info.point.x - (containerRef.current?.getBoundingClientRect().left ?? 0)
    const index = Math.min(tabs.length - 1, Math.max(0, Math.round(x / segmentWidth) - 1))
    onChange(index)
  }

  return (
    <div
      ref={containerRef}
      className={`${fitToLabel ? 'relative flex flex-wrap gap-1' : 'relative grid'} select-none rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600 sm:text-base`}
      style={fitToLabel ? undefined : { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {fitToLabel ? (
        <motion.div
          className="absolute top-1 bottom-1 rounded-full bg-startx-600 shadow"
          style={{ width: Math.max(0, indicatorW - 8) }}
          animate={{ x: (indicatorX ?? 0) + 4 }}
          transition={instant ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
        />
      ) : (
        (
          instant ? (
            <div
              className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-startx-500 to-accent-500 shadow"
              style={{ width: segmentWidth - 8, transform: `translateX(${value * segmentWidth + 4}px)` }}
            />
          ) : (
            <motion.div
              className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-startx-500 to-accent-500 shadow"
              style={{ width: segmentWidth - 8 }}
              animate={{ x: value * segmentWidth + 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag={'x'}
              dragConstraints={{ left: 0, right: Math.max(0, (containerRef.current?.getBoundingClientRect().width ?? 0) - segmentWidth) }}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
            />
          )
        )
      )}

      {tabs.map((t, i) => (
        <button
          key={t}
          ref={(el) => (buttonRefs.current[i] = el)}
          onClick={() => onChange(i)}
          className={`relative z-10 inline-flex items-center justify-center rounded-full ${fitToLabel ? 'px-4' : 'px-3'} py-2 transition ${i === value ? 'text-white' : ''}`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}


