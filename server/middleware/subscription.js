import { pool } from '../db.js'

/**
 * Middleware to check if user has required subscription tier
 * Usage: requireSubscription('pro') or requireSubscription(['pro', 'elite'])
 */
function requireSubscription(requiredTiers) {
  const tiers = Array.isArray(requiredTiers) ? requiredTiers : [requiredTiers]
  
  return async (req, res, next) => {
    try {
      const userId = req.user?.id
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const { rows } = await pool.query(
        `SELECT subscription_tier, subscription_status 
         FROM users 
         WHERE id = $1`,
        [userId]
      )

      if (!rows[0]) {
        return res.status(404).json({ error: 'User not found' })
      }

      const userTier = rows[0].subscription_tier || 'starter'
      const userStatus = rows[0].subscription_status || 'active'

      // Check if subscription is active
      if (userStatus !== 'active' && userStatus !== 'trialing') {
        return res.status(403).json({ 
          error: 'Subscription required',
          message: 'Your subscription is not active. Please renew to access this feature.',
          requiredTiers: tiers,
          currentTier: userTier,
          currentStatus: userStatus
        })
      }

      // Check if user has required tier
      if (!tiers.includes(userTier)) {
        return res.status(403).json({ 
          error: 'Upgrade required',
          message: `This feature requires ${tiers.join(' or ')} subscription.`,
          requiredTiers: tiers,
          currentTier: userTier
        })
      }

      // Add subscription info to request
      req.subscription = {
        tier: userTier,
        status: userStatus
      }

      next()
    } catch (error) {
      console.error('Subscription middleware error:', error)
      res.status(500).json({ error: 'Failed to verify subscription' })
    }
  }
}

/**
 * Middleware to attach subscription info to request (non-blocking)
 */
async function attachSubscription(req, res, next) {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      req.subscription = { tier: 'starter', status: 'active' }
      return next()
    }

    const { rows } = await pool.query(
      `SELECT subscription_tier, subscription_status, subscription_end_date
       FROM users 
       WHERE id = $1`,
      [userId]
    )

    if (rows[0]) {
      req.subscription = {
        tier: rows[0].subscription_tier || 'starter',
        status: rows[0].subscription_status || 'active',
        endDate: rows[0].subscription_end_date
      }
    } else {
      req.subscription = { tier: 'starter', status: 'active' }
    }

    next()
  } catch (error) {
    console.error('Attach subscription middleware error:', error)
    req.subscription = { tier: 'starter', status: 'active' }
    next()
  }
}

/**
 * Check feature limits based on subscription tier
 */
const FEATURE_LIMITS = {
  starter: {
    aiInterviewsPerWeek: 2,
    savedJobs: 10,
    connections: 50,
  },
  pro: {
    aiInterviewsPerWeek: Infinity,
    savedJobs: Infinity,
    connections: Infinity,
  },
  elite: {
    aiInterviewsPerWeek: Infinity,
    savedJobs: Infinity,
    connections: Infinity,
  }
}

/**
 * Check if user can use a feature based on their tier
 */
async function checkFeatureLimit(userId, feature) {
  try {
    const { rows } = await pool.query(
      'SELECT subscription_tier FROM users WHERE id = $1',
      [userId]
    )

    const tier = rows[0]?.subscription_tier || 'starter'
    const limits = FEATURE_LIMITS[tier]

    return {
      allowed: true,
      tier,
      limits,
      limit: limits[feature]
    }
  } catch (error) {
    console.error('Check feature limit error:', error)
    return { allowed: false, error: 'Failed to check feature limit' }
  }
}

export {
  requireSubscription,
  attachSubscription,
  checkFeatureLimit,
  FEATURE_LIMITS
}
