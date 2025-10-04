import { useCallback, useEffect, useRef, useState } from 'react'

// Browser Web Speech API STT with fallback buffer typing
export function useSTT() {
	const [listening, setListening] = useState(false)
	const [results, setResults] = useState([])
	const [interim, setInterim] = useState('')
	const recognitionRef = useRef(null)
	const bufferRef = useRef('')

	useEffect(() => {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		if (!SpeechRecognition) return
		const rec = new SpeechRecognition()
		rec.continuous = true
		rec.interimResults = true
		rec.lang = 'en-US'
		rec.onresult = (event) => {
			let finalText = ''
			let interimText = ''
			for (let i = event.resultIndex; i < event.results.length; ++i) {
				const transcript = event.results[i][0].transcript
				if (event.results[i].isFinal) finalText += transcript
				else interimText += transcript
			}
			if (finalText) {
				setResults(r => [...r, { speaker: 'user', text: finalText.trim() }])
				setInterim('')
			}
			setInterim(interimText)
		}
		rec.onend = () => {
			setListening(false)
		}
		rec.onerror = () => {
			setListening(false)
		}
		recognitionRef.current = rec
		return () => {
			rec.onresult = null
			rec.onend = null
			rec.onerror = null
		}
	}, [])

	const start = useCallback(() => {
		if (recognitionRef.current) {
			try { recognitionRef.current.start(); setListening(true) } catch {}
		} else {
			setListening(true)
		}
	}, [])

	const stop = useCallback(() => {
		if (recognitionRef.current) {
			try { recognitionRef.current.stop() } catch {}
		} else {
			// Fallback: commit buffer
			if (bufferRef.current) {
				setResults(r => [...r, { speaker: 'user', text: bufferRef.current }])
				bufferRef.current = ''
			}
			setListening(false)
		}
	}, [])

	const type = useCallback((text) => {
		bufferRef.current = text
	}, [])

	return { listening, results, interim, start, stop, type }
}