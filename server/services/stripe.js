import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy')

// Subscription tier pricing (in cents)
const PRICING = {
  starter: {
    priceId: process.env.STRIPE_PRICE_ID_STARTER || 'price_starter', // Free tier
    amount: 0,
    name: 'Starter',
    features: [
      'Personalized feed',
      'Basic search and filters',
      '2 AI interview sessions/week'
    ]
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_PRO || 'price_pro',
    amount: 49900, // Rs.499 in paise
    name: 'Pro',
    features: [
      'Unlimited AI interviews',
      'Saved roles and alerts',
      'Advanced feed customizations',
      'Priority support'
    ]
  },
  elite: {
    priceId: process.env.STRIPE_PRICE_ID_ELITE || 'price_elite',
    amount: 99900, // Rs.999 in paise
    name: 'Elite',
    features: [
      'Everything in Pro',
      '1:1 expert resume review',
      'Mock system design deep dives',
      'Application tracker integrations'
    ]
  }
}

/**
 * Create a Stripe checkout session for subscription
 */
async function createCheckoutSession({ userId, email, tier, successUrl, cancelUrl }) {
  try {
    console.log('[Stripe Service] Creating checkout session:', { userId, email, tier })
    
    if (!['pro', 'elite'].includes(tier)) {
      throw new Error('Invalid subscription tier')
    }

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy') {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in .env')
    }

    const priceId = PRICING[tier].priceId
    console.log('[Stripe Service] Using price ID:', priceId)

    if (!priceId || priceId.startsWith('price_pro') || priceId.startsWith('price_elite')) {
      throw new Error(`Invalid price ID for ${tier}. Please set STRIPE_PRICE_ID_${tier.toUpperCase()} in .env`)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: String(userId),
      metadata: {
        userId: String(userId),
        tier,
      },
      subscription_data: {
        metadata: {
          userId: String(userId),
          tier,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })

    console.log('[Stripe Service] Checkout session created:', session.id)
    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('[Stripe Service] Error creating checkout session:', error.message)
    throw error
  }
}

/**
 * Create a Stripe customer portal session
 */
async function createPortalSession({ customerId, returnUrl }) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

/**
 * Get subscription details from Stripe
 */
async function getSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    throw error
  }
}

/**
 * Cancel subscription at period end
 */
async function cancelSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

/**
 * Reactivate a canceled subscription
 */
async function reactivateSubscription(subscriptionId) {
  try {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    throw error
  }
}

/**
 * Get customer from Stripe
 */
async function getCustomer(customerId) {
  try {
    return await stripe.customers.retrieve(customerId)
  } catch (error) {
    console.error('Error retrieving customer:', error)
    throw error
  }
}

/**
 * Construct webhook event from request
 */
function constructWebhookEvent(payload, signature) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Error constructing webhook event:', error)
    throw error
  }
}

export {
  stripe,
  PRICING,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  getCustomer,
  constructWebhookEvent,
}
