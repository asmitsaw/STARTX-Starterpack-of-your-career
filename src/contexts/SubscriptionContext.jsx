import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'

const SubscriptionContext = createContext()

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5174'

export function SubscriptionProvider({ children }) {
  const { user, isLoaded } = useUser()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch subscription status
  const fetchSubscription = async () => {
    if (!user) {
      setSubscription({ tier: 'starter', status: 'active' })
      setLoading(false)
      return
    }

    try {
      const { data } = await axios.get(`${API_BASE}/api/stripe/subscription-status`, {
        withCredentials: true
      })
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setSubscription({ tier: 'starter', status: 'active' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchSubscription()
    }
  }, [user, isLoaded])

  // Create checkout session
  const createCheckoutSession = async (tier) => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/stripe/create-checkout-session`,
        { tier },
        { withCredentials: true }
      )
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  // Open customer portal
  const openCustomerPortal = async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/stripe/create-portal-session`,
        {},
        { withCredentials: true }
      )
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (error) {
      console.error('Error opening customer portal:', error)
      throw error
    }
  }

  // Check if user has access to a feature
  const hasAccess = (requiredTier) => {
    if (!subscription) return false
    
    const tierHierarchy = { starter: 0, pro: 1, elite: 2 }
    const userTierLevel = tierHierarchy[subscription.tier] || 0
    const requiredTierLevel = tierHierarchy[requiredTier] || 0
    
    return userTierLevel >= requiredTierLevel && subscription.status === 'active'
  }

  // Check if subscription is active
  const isActive = () => {
    return subscription?.status === 'active' || subscription?.status === 'trialing'
  }

  const value = {
    subscription,
    loading,
    createCheckoutSession,
    openCustomerPortal,
    hasAccess,
    isActive,
    refreshSubscription: fetchSubscription,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }
  return context
}
