import { useCallback, useState } from 'react'

export function useTTS() {
	const [speaking, setSpeaking] = useState(false)
	const speak = useCallback((text) => {
		try {
			setSpeaking(true)
			const synth = window.speechSynthesis
			const utter = new SpeechSynthesisUtterance(text)
			utter.onend = () => setSpeaking(false)
			synth.speak(utter)
		} catch (e) {
			setSpeaking(false)
		}
	}, [])
	return { speaking, speak }
}