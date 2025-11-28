import { useCallback, useMemo, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'

export function useTTS() {
    const [speaking, setSpeaking] = useState(false)
    const vapiClientRef = useRef(null)

    const cfg = useMemo(() => ({
        publicKey: import.meta?.env?.VITE_VAPI_PUBLIC_KEY,
        assistantId: import.meta?.env?.VITE_VAPI_ASSISTANT_ID,
        voiceId: import.meta?.env?.VITE_VAPI_VOICE_ID,
    }), [])

    const ensureVapi = useCallback(() => {
        if (!cfg.publicKey) return null
        if (!vapiClientRef.current) {
            vapiClientRef.current = new Vapi(cfg.publicKey)
        }
        return vapiClientRef.current
    }, [cfg])

    const speak = useCallback(async (text) => {
        // Prefer Vapi if configured; else fall back to Web Speech API
        const client = ensureVapi()
        try {
            setSpeaking(true)
            if (client) {
                // If Assistant is provided, use it; otherwise use a direct TTS with the specified voice
                console.log('[TTS] Using Vapi', { hasPublicKey: !!cfg.publicKey, assistantId: cfg.assistantId, voiceId: cfg.voiceId })
                if (cfg.assistantId) {
                    // Simple TTS via conversation say, without starting a full call
                    await client.say({ assistantId: cfg.assistantId, text })
                } else if (cfg.voiceId) {
                    await client.say({ voice: { id: cfg.voiceId }, text })
                } else {
                    // Use a default professional voice profile
                    await client.say({
                        voice: { provider: 'elevenlabs', voiceId: 'Adam' },
                        text,
                    })
                }
                setSpeaking(false)
                return
            }
        } catch (e) {
            console.warn('[TTS] Vapi path failed, falling back to Web Speech', e)
            // fall through to browser TTS
        }
        try {
            console.log('[TTS] Using Web Speech API fallback')
            const synth = window.speechSynthesis
            // Cancel any ongoing speech first
            synth.cancel()
            const utter = new SpeechSynthesisUtterance(text)
            utter.rate = 0.9
            utter.pitch = 1
            utter.volume = 1.0
            utter.lang = 'en-US'
            utter.onstart = () => {
                console.log('[TTS] Speech started')
                setSpeaking(true)
            }
            utter.onend = () => {
                console.log('[TTS] Speech ended')
                setSpeaking(false)
            }
            utter.onerror = (e) => {
                console.error('[TTS] Speech error:', e)
                setSpeaking(false)
            }
            // Small delay to ensure synth is ready
            setTimeout(() => {
                synth.speak(utter)
            }, 100)
        } catch (e) {
            console.error('[TTS] Web Speech API error:', e)
            setSpeaking(false)
        }
    }, [cfg, ensureVapi])

    return { speaking, speak }
}