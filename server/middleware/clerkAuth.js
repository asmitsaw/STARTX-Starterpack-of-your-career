import { query } from '../db.js'

/**
 * Clerk Authentication Middleware
 * Extracts user info from Clerk session and syncs with database
 */
export async function clerkAuth(req, res, next) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('ClerkAuth - Token from Authorization header');
    } else {
      token = req.cookies?.token || req.cookies?.__session;
      console.log('ClerkAuth - Token from cookies');
    }
    
    console.log('ClerkAuth - Token found:', !!token);
    
    if (!token) {
      console.error('ClerkAuth - No token found in Authorization header or cookies');
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
    
    console.log('ClerkAuth - Extracted userId:', userId);
    console.log('ClerkAuth - Full payload:', JSON.stringify(payload, null, 2));
    
    // Fetch full user data from Clerk API
    let email = null
    let name = 'User'
    let avatarUrl = null
    
    try {
      const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
        }
      })
      
      if (clerkResponse.ok) {
        const clerkUser = await clerkResponse.json()
        email = clerkUser.email_addresses?.[0]?.email_address || clerkUser.primary_email_address_id
        name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || clerkUser.username || 'User'
        avatarUrl = clerkUser.image_url || clerkUser.profile_image_url
        
        console.log('ClerkAuth - Fetched from Clerk API:', { name, email, avatarUrl })
      } else {
        console.warn('ClerkAuth - Failed to fetch from Clerk API, using defaults')
      }
    } catch (fetchError) {
      console.warn('ClerkAuth - Error fetching from Clerk API:', fetchError.message)
    }
    
    console.log('ClerkAuth - Final extracted data:', { userId, email, name, avatarUrl });
    
    if (!userId) {
      console.error('ClerkAuth - No user ID found in token payload');
      return res.status(401).json({ error: 'invalid_token', message: 'No user ID in token' })
    }

    // Check if user exists in database by clerk_id
    let userResult = await query('SELECT id, clerk_id, email, name, avatar_url FROM users WHERE clerk_id = $1', [userId])
    
    console.log('ClerkAuth - User query result:', userResult.rows.length, 'rows');
    
    // Create or update user with latest Clerk data
    try {
      const insertResult = await query(
        `INSERT INTO users (clerk_id, email, name, avatar_url, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         ON CONFLICT (clerk_id) DO UPDATE 
         SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
         RETURNING id, clerk_id, email, name, avatar_url`,
        [userId, email || `user_${userId}@startx.com`, name, avatarUrl]
      )
      
      console.log('ClerkAuth - User created/updated:', insertResult.rows[0]);
      
      // Fetch the user
      userResult = await query('SELECT id, clerk_id, email, name, avatar_url FROM users WHERE clerk_id = $1', [userId])
      console.log('ClerkAuth - Fetched user:', userResult.rows[0]);
    } catch (err) {
      console.error('ClerkAuth - Error creating/updating user:', err)
      console.error('ClerkAuth - Error details:', err.message, err.stack)
      return res.status(500).json({ error: 'user_sync_failed', message: 'Failed to sync user account: ' + err.message })
    }
    
    if (userResult.rows.length === 0) {
      console.error('ClerkAuth - User still not found after creation attempt');
      return res.status(500).json({ error: 'user_not_found', message: 'User could not be created or found' })
    }
    
    // Attach user to request with both database UUID and clerk_id
    req.user = {
      ...userResult.rows[0],
      id: userResult.rows[0].id, // Use database UUID for foreign key references
      clerk_id: userResult.rows[0].clerk_id // Keep clerk_id for reference
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
          id: userResult.rows[0].id, // Use database UUID
          clerk_id: userResult.rows[0].clerk_id
        }
      }
    }
    
    return next()
  } catch (error) {
    console.error('Optional auth error:', error)
    return next()
  }
}
