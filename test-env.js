import 'dotenv/config'

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗')
console.log('First 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10))
