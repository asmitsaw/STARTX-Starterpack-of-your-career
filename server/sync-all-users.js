import 'dotenv/config'
import { pool } from './db.js'

async function syncAllUsers() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Syncing all users with Clerk...')
    
    // Get all users with clerk_id
    const { rows: users } = await client.query(
      'SELECT id, clerk_id, name FROM users WHERE clerk_id IS NOT NULL'
    )
    
    console.log(`Found ${users.length} users to sync`)
    
    let updated = 0
    let failed = 0
    
    for (const user of users) {
      try {
        console.log(`\nSyncing user: ${user.name} (${user.clerk_id})`)
        
        // Fetch from Clerk API
        const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${user.clerk_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
          }
        })
        
        if (clerkResponse.ok) {
          const clerkUser = await clerkResponse.json()
          const email = clerkUser.email_addresses?.[0]?.email_address
          const name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || clerkUser.username || 'User'
          const avatarUrl = clerkUser.image_url || clerkUser.profile_image_url
          
          // Update in database
          await client.query(
            `UPDATE users 
             SET name = $1, email = $2, avatar_url = $3
             WHERE clerk_id = $4`,
            [name, email, avatarUrl, user.clerk_id]
          )
          
          console.log(`  ✅ Updated: ${name}`)
          updated++
        } else {
          console.log(`  ⚠️  Clerk API failed for ${user.clerk_id}`)
          failed++
        }
        
        // Rate limit: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`  ❌ Error syncing ${user.clerk_id}:`, error.message)
        failed++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Sync complete!')
    console.log(`  Updated: ${updated}`)
    console.log(`  Failed: ${failed}`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

syncAllUsers()
