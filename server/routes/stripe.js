import express from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  PRICING,
} from '../services/stripe.js'

const router = express.Router()

/**
 * GET /api/stripe/pricing
 * Get pricing information
 */
router.get('/pricing', (req, res) => {
  res.json(PRICING)
})

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe checkout session
 */
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { tier } = req.body
    const userId = req.user.id
    const email = req.user.email

    console.log('[Stripe] Creating checkout session:', { userId, email, tier })

    if (!['pro', 'elite'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' })
    }

    if (!email) {
      return res.status(400).json({ error: 'User email is required' })
    }

    const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'
    const session = await createCheckoutSession({
      userId,
      email,
      tier,
      successUrl: `${baseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/premium`,
    })

    console.log('[Stripe] Checkout session created:', session.sessionId)
    res.json(session)
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error)
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message })
  }
})

/**
 * POST /api/stripe/create-portal-session
 * Create a Stripe customer portal session
 */
router.post('/create-portal-session', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    // Get user's Stripe customer ID
    const { rows } = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    )

    if (!rows[0]?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' })
    }

    const baseUrl = process.env.VITE_API_URL || 'http://localhost:5173'
    const session = await createPortalSession({
      customerId: rows[0].stripe_customer_id,
      returnUrl: `${baseUrl}/premium`,
    })

    res.json(session)
  } catch (error) {
    console.error('Error creating portal session:', error)
    res.status(500).json({ error: 'Failed to create portal session' })
  }
})

/**
 * GET /api/stripe/subscription-status
 * Get current user's subscription status
 */
router.get('/subscription-status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    console.log('[Stripe] Getting subscription status for user:', userId)

    if (!pool) {
      console.error('[Stripe] Database pool not initialized')
      // Return default starter tier if DB not available
      return res.json({
        tier: 'starter',
        status: 'active',
        endDate: null,
        cancelAtPeriodEnd: false,
        hasPaymentMethod: false,
      })
    }

    const { rows } = await pool.query(
      `SELECT 
        subscription_tier,
        subscription_status,
        subscription_end_date,
        subscription_cancel_at_period_end,
        stripe_customer_id
      FROM users 
      WHERE id = $1`,
      [userId]
    )

    if (!rows[0]) {
      console.log('[Stripe] User not found in database, returning default')
      // Return default starter tier if user not found
      return res.json({
        tier: 'starter',
        status: 'active',
        endDate: null,
        cancelAtPeriodEnd: false,
        hasPaymentMethod: false,
      })
    }

    const subscription = {
      tier: rows[0].subscription_tier || 'starter',
      status: rows[0].subscription_status || 'active',
      endDate: rows[0].subscription_end_date,
      cancelAtPeriodEnd: rows[0].subscription_cancel_at_period_end || false,
      hasPaymentMethod: !!rows[0].stripe_customer_id,
    }

    console.log('[Stripe] Subscription status:', subscription)
    res.json(subscription)
  } catch (error) {
    console.error('[Stripe] Error getting subscription status:', error)
    // Return default starter tier on error
    res.json({
      tier: 'starter',
      status: 'active',
      endDate: null,
      cancelAtPeriodEnd: false,
      hasPaymentMethod: false,
    })
  }
})

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * NOTE: This route should NOT use authentication middleware
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature']

    try {
      const event = constructWebhookEvent(req.body, signature)

      console.log(`[Stripe Webhook] Received event: ${event.type}`)

      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(event.data.object)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object)
          break

        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object)
          break

        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object)
          break

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      }

      // Log event to database
      await logSubscriptionEvent(event)

      res.json({ received: true })
    } catch (error) {
      console.error('[Stripe Webhook] Error:', error)
      res.status(400).json({ error: 'Webhook error' })
    }
  }
)

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId || session.client_reference_id
  const tier = session.metadata.tier
  const customerId = session.customer
  const subscriptionId = session.subscription

  console.log(`[Stripe] Checkout completed for user ${userId}, tier: ${tier}`)

  await pool.query(
    `UPDATE users 
     SET stripe_customer_id = $1,
         stripe_subscription_id = $2,
         subscription_tier = $3,
         subscription_status = 'active',
         subscription_start_date = NOW(),
         updated_at = NOW()
     WHERE id = $4`,
    [customerId, subscriptionId, tier, userId]
  )
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer
  const subscriptionId = subscription.id
  const status = subscription.status
  const tier = subscription.metadata.tier || 'pro'
  const cancelAtPeriodEnd = subscription.cancel_at_period_end
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  console.log(`[Stripe] Subscription ${subscriptionId} updated: ${status}`)

  // Update user subscription
  await pool.query(
    `UPDATE users 
     SET subscription_status = $1,
         subscription_tier = $2,
         subscription_end_date = $3,
         subscription_cancel_at_period_end = $4,
         updated_at = NOW()
     WHERE stripe_customer_id = $5`,
    [status, tier, currentPeriodEnd, cancelAtPeriodEnd, customerId]
  )

  // Upsert subscription record
  await pool.query(
    `INSERT INTO subscriptions (
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      tier,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      updated_at
    )
    SELECT 
      id,
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      NOW()
    FROM users WHERE stripe_customer_id = $2
    ON CONFLICT (stripe_subscription_id) 
    DO UPDATE SET
      status = $4,
      tier = $3,
      current_period_end = $6,
      cancel_at_period_end = $7,
      updated_at = NOW()`,
    [
      subscriptionId,
      customerId,
      tier,
      status,
      new Date(subscription.current_period_start * 1000),
      currentPeriodEnd,
      cancelAtPeriodEnd,
    ]
  )
}

/**
 * Handle subscription deleted/canceled
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer
  const subscriptionId = subscription.id

  console.log(`[Stripe] Subscription ${subscriptionId} deleted`)

  await pool.query(
    `UPDATE users 
     SET subscription_status = 'canceled',
         subscription_tier = 'starter',
         subscription_cancel_at_period_end = false,
         updated_at = NOW()
     WHERE stripe_customer_id = $1`,
    [customerId]
  )

  await pool.query(
    `UPDATE subscriptions 
     SET status = 'canceled',
         canceled_at = NOW(),
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  )
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer
  const subscriptionId = invoice.subscription

  console.log(`[Stripe] Payment succeeded for subscription ${subscriptionId}`)

  await pool.query(
    `UPDATE users 
     SET subscription_status = 'active',
         updated_at = NOW()
     WHERE stripe_customer_id = $1`,
    [customerId]
  )
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer
  const subscriptionId = invoice.subscription

  console.log(`[Stripe] Payment failed for subscription ${subscriptionId}`)

  await pool.query(
    `UPDATE users 
     SET subscription_status = 'past_due',
         updated_at = NOW()
     WHERE stripe_customer_id = $1`,
    [customerId]
  )
}

/**
 * Log subscription event to database
 */
async function logSubscriptionEvent(event) {
  try {
    const subscriptionId = event.data.object.subscription || event.data.object.id

    // Get subscription UUID from stripe_subscription_id
    const { rows } = await pool.query(
      'SELECT id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscriptionId]
    )

    if (rows[0]) {
      await pool.query(
        `INSERT INTO subscription_events (
          subscription_id,
          event_type,
          stripe_event_id,
          event_data
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (stripe_event_id) DO NOTHING`,
        [rows[0].id, event.type, event.id, JSON.stringify(event.data.object)]
      )
    }
  } catch (error) {
    console.error('Error logging subscription event:', error)
  }
}

export default router
