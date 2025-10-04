import { query } from '../db.js'

/**
 * Clerk Authentication Middleware
 * Extracts user info from Clerk session and syncs with database
 */
export async function clerkAuth(req, res, next) {
  try {
    // Get token from cookie (set by Clerk)
    const token = req.cookies?.token || req.cookies?.__session
    
    console.log('ClerkAuth - Cookies:', Object.keys(req.cookies || {}));
    console.log('ClerkAuth - Token found:', !!token);
    
    if (!token) {
      console.error('ClerkAuth - No token found in cookies');
      return res.status(401).json({ error: 'unauthorized', message: 'No authentication token found' })
    }

    // For now, we'll decode the JWT without verification
    // In production, you should verify with Clerk's public key
    const base64Url = token.split('.')[1]
    if (!base64Url) {
      return res.status(401).json({ error: 'invalid_token', message: 'Invalid token format' })
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    const payload = JSON.parse(jsonPayload)
    
    // Extract user info from Clerk token
    const userId = payload.sub || payload.user_id || payload.id
    const email = payload.email || payload.email_address
    const name = payload.name || payload.full_name || payload.first_name || 'User'
    
    console.log('ClerkAuth - Extracted userId:', userId);
    console.log('ClerkAuth - Extracted email:', email);
    console.log('ClerkAuth - Extracted name:', name);
    console.log('ClerkAuth - Full payload:', JSON.stringify(payload, null, 2));
    
    if (!userId) {
      console.error('ClerkAuth - No user ID found in token payload');
      return res.status(401).json({ error: 'invalid_token', message: 'No user ID in token' })
    }

    // Check if user exists in database by clerk_id
    let userResult = await query('SELECT id, clerk_id, email, name FROM users WHERE clerk_id = $1', [userId])
    
    console.log('ClerkAuth - User query result:', userResult.rows.length, 'rows');
    
    // If user doesn't exist, create them
    if (userResult.rows.length === 0) {
      console.log('ClerkAuth - Creating new user from Clerk:', userId, email, name)
      
      try {
        const insertResult = await query(
          `INSERT INTO users (clerk_id, email, name, created_at) 
           VALUES ($1, $2, $3, NOW()) 
           ON CONFLICT (clerk_id) DO UPDATE 
           SET email = EXCLUDED.email, name = EXCLUDED.name
           RETURNING id, clerk_id, email, name`,
          [userId, email || `user_${userId}@startx.com`, name]
        )
        
        console.log('ClerkAuth - User created/updated:', insertResult.rows[0]);
        
        // Fetch the newly created user
        userResult = await query('SELECT id, clerk_id, email, name FROM users WHERE clerk_id = $1', [userId])
        console.log('ClerkAuth - Fetched user after creation:', userResult.rows[0]);
      } catch (err) {
        console.error('ClerkAuth - Error creating user:', err)
        console.error('ClerkAuth - Error details:', err.message, err.stack)
        return res.status(500).json({ error: 'user_creation_failed', message: 'Failed to create user account: ' + err.message })
      }
    }
    
    if (userResult.rows.length === 0) {
      console.error('ClerkAuth - User still not found after creation attempt');
      return res.status(500).json({ error: 'user_not_found', message: 'User could not be created or found' })
    }
    
    // Attach user to request with clerk_id as the primary identifier
    req.user = {
      ...userResult.rows[0],
      id: userResult.rows[0].clerk_id // Use clerk_id as the primary id for consistency
    }
    
    console.log('ClerkAuth - Final req.user:', req.user);
    
    return next()
  } catch (error) {
    console.error('Clerk auth error:', error)
    return res.status(401).json({ error: 'authentication_failed', message: error.message })
  }
}

/**
 * Optional auth - doesn't fail if no token, just doesn't set req.user
 */
export async function optionalClerkAuth(req, res, next) {
  try {
    const token = req.cookies?.token || req.cookies?.__session
    
    if (!token) {
      return next()
    }

    const base64Url = token.split('.')[1]
    if (!base64Url) {
      return next()
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    const payload = JSON.parse(jsonPayload)
    const userId = payload.sub || payload.user_id || payload.id
    
    if (userId) {
      const userResult = await query('SELECT id, clerk_id, email, name FROM users WHERE clerk_id = $1', [userId])
      if (userResult.rows.length > 0) {
        req.user = {
          ...userResult.rows[0],
          id: userResult.rows[0].clerk_id
        }
      }
    }
    
    return next()
  } catch (error) {
    console.error('Optional auth error:', error)
    return next()
  }
}
