import { useEffect, useRef, useState } from 'react'

export function useAudioStream(enabled = true) {
	const mediaStreamRef = useRef(null)
	const [error, setError] = useState(null)
	useEffect(() => {
		if (!enabled) return
		let cancelled = false
		;(async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
				if (!cancelled) mediaStreamRef.current = stream
			} catch (e) {
				if (!cancelled) setError(e)
			}
		})()
		return () => {
			cancelled = true
			mediaStreamRef.current?.getTracks()?.forEach(t => t.stop())
		}
	}, [enabled])
	return { stream: mediaStreamRef.current, error }
}