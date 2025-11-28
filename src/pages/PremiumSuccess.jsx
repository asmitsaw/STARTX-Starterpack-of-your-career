import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSubscription } from '../contexts/SubscriptionContext'
import { CheckCircle, Sparkles } from 'lucide-react'

export default function PremiumSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshSubscription } = useSubscription()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Refresh subscription status after successful checkout
    if (sessionId) {
      setTimeout(() => {
        refreshSubscription()
      }, 2000)
    }
  }, [sessionId, refreshSubscription])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" style={{ marginLeft: '80px', marginTop: '-40px' }} />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Premium! 🎉
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your subscription is now active. Get ready to accelerate your career!
        </p>

        {/* Benefits */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">What's Next?</h2>
          <ul className="text-left space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Start unlimited AI interview practice sessions</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Set up job alerts for your dream roles</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Customize your feed with advanced filters</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Get priority support from our team</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/feed')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/interview')}
            className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
          >
            Start AI Interview
          </button>
        </div>

        {/* Receipt Info */}
        <p className="text-sm text-gray-400 mt-8">
          A receipt has been sent to your email. You can manage your subscription anytime from your account settings.
        </p>
      </div>
    </div>
  )
}
