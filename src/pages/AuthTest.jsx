import React, { useState } from 'react'
import { useUser } from '@clerk/clerk-react'

export default function AuthTest() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      console.log('Testing auth with user:', user?.id)
      
      const res = await fetch('http://localhost:5174/api/auth/ensure-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          clerkEmail: user.emailAddresses?.[0]?.emailAddress,
          clerkName: user.fullName || user.firstName,
          clerkImageUrl: user.imageUrl
        })
      })

      const data = await res.json()
      setResult({ success: res.ok, status: res.status, data })
      console.log('Auth result:', data)
      
      if (res.ok) {
        alert('✅ JWT Token set! Check Application > Cookies for "token"')
      } else {
        alert('❌ Failed: ' + JSON.stringify(data))
      }
    } catch (error) {
      setResult({ success: false, error: error.message })
      alert('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const checkCookie = () => {
    const cookies = document.cookie
    const hasToken = cookies.includes('token=')
    console.log('All cookies:', cookies)
    console.log('Has token:', hasToken)
    
    // Also check via API
    fetch('http://localhost:5174/api/auth/check-auth', {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => {
        console.log('Auth check result:', data)
        if (data.authenticated) {
          alert('✅ Token cookie exists and works!')
        } else {
          alert('❌ No token cookie found')
        }
      })
      .catch(err => {
        alert('❌ No token cookie found')
        console.error('Auth check error:', err)
      })
  }

  const testStripe = async () => {
    try {
      const res = await fetch('http://localhost:5174/api/stripe/subscription-status', {
        credentials: 'include'
      })
      const data = await res.json()
      alert(res.ok ? '✅ Stripe API works!' : '❌ Still unauthorized')
      console.log('Stripe result:', data)
    } catch (error) {
      alert('❌ Error: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Auth Debug Tool</h1>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Clerk Status</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>Loaded: {isLoaded ? '✅' : '❌'}</div>
            <div>Signed In: {isSignedIn ? '✅' : '❌'}</div>
            <div>User ID: {user?.id || 'None'}</div>
            <div>Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={testAuth}
            disabled={!user || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold"
          >
            {loading ? 'Testing...' : '1. Set JWT Token (Call /api/ensure-user)'}
          </button>

          <button
            onClick={checkCookie}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold"
          >
            2. Check if Token Cookie Exists
          </button>

          <button
            onClick={testStripe}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold"
          >
            3. Test Stripe API (Should work after step 1)
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-900 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure you're logged in with Clerk</li>
            <li>Click button 1 to manually set JWT token</li>
            <li>Click button 2 to verify cookie exists</li>
            <li>Click button 3 to test if Stripe API works</li>
            <li>If all work, go to /premium and try checkout</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
