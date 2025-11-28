import React, { useState } from 'react'
import { useSubscription } from '../contexts/SubscriptionContext'
import { Check, Sparkles, Zap, Crown } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Personalized feed',
      'Basic search and filters',
      '2 AI interview sessions/week',
      'Community access',
      'Basic profile'
    ],
    icon: Sparkles,
    color: 'from-gray-500 to-gray-600',
    buttonText: 'Current Plan',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    period: 'per month',
    description: 'For serious job seekers',
    features: [
      'Everything in Starter',
      'Unlimited AI interviews',
      'Saved roles and alerts',
      'Advanced feed customizations',
      'Priority support',
      'Resume templates',
      'Interview analytics'
    ],
    icon: Zap,
    color: 'from-blue-500 to-purple-600',
    buttonText: 'Try Pro',
    popular: true
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 999,
    period: 'per month',
    description: 'Maximum career acceleration',
    features: [
      'Everything in Pro',
      '1:1 expert resume review',
      'Mock system design deep dives',
      'Application tracker integrations',
      'Career coaching sessions',
      'Exclusive job opportunities',
      'LinkedIn profile optimization',
      'Salary negotiation guidance'
    ],
    icon: Crown,
    color: 'from-purple-600 to-pink-600',
    buttonText: 'Go Elite',
    popular: false
  }
]

export default function Premium() {
  const { subscription, loading, createCheckoutSession, openCustomerPortal } = useSubscription()
  const [processingTier, setProcessingTier] = useState(null)

  const handleSubscribe = async (tier) => {
    if (tier === 'starter') return
    
    setProcessingTier(tier)
    try {
      await createCheckoutSession(tier)
    } catch (error) {
      console.error('Error:', error)
      console.error('Error details:', error.response?.data)
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to start checkout. Please try again.'
      alert(errorMessage)
      setProcessingTier(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to open billing portal. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Accelerate Your Career
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan to unlock premium features and land your dream job faster
          </p>
          
          {subscription && subscription.tier !== 'starter' && (
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-6 py-2 text-green-400">
                <Check className="w-5 h-5" />
                <span>Current Plan: <strong>{subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}</strong></span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-yellow-400 mt-2 text-sm">
                  Your subscription will end on {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = subscription?.tier === plan.id
            const isProcessing = processingTier === plan.id

            return (
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/20'
                    : isCurrentPlan
                    ? 'border-green-500'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => isCurrentPlan ? handleManageSubscription() : handleSubscribe(plan.id)}
                  disabled={isProcessing || (plan.id === 'starter' && isCurrentPlan)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isCurrentPlan
                      ? 'bg-gray-700 text-gray-300 cursor-default'
                      : plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  } ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    subscription?.hasPaymentMethod ? 'Manage Subscription' : 'Current Plan'
                  ) : (
                    plan.buttonText
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="text-gray-300 mt-3">
                Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </details>
            
            <details className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="text-gray-300 mt-3">
                We accept all major credit and debit cards through Stripe, our secure payment processor.
              </p>
            </details>
            
            <details className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                Can I upgrade or downgrade my plan?
              </summary>
              <p className="text-gray-300 mt-3">
                Absolutely! You can upgrade or downgrade your plan at any time through the billing portal. Changes take effect immediately.
              </p>
            </details>
            
            <details className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <summary className="text-lg font-semibold text-white cursor-pointer">
                Is there a free trial?
              </summary>
              <p className="text-gray-300 mt-3">
                The Starter plan is free forever! You can try premium features with Pro or Elite plans, and cancel anytime if they're not right for you.
              </p>
            </details>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Trusted by thousands of professionals</p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="text-gray-500">
              <Check className="w-6 h-6 inline mr-2 text-green-400" />
              Secure payments
            </div>
            <div className="text-gray-500">
              <Check className="w-6 h-6 inline mr-2 text-green-400" />
              Cancel anytime
            </div>
            <div className="text-gray-500">
              <Check className="w-6 h-6 inline mr-2 text-green-400" />
              24/7 support
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
