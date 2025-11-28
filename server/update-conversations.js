import 'dotenv/config'
import { pool } from './db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function updateConversations() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 Updating conversations table...')
    
    // Read the update migration file
    const migrationPath = path.join(__dirname, 'migrations', '005_update_conversations.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Update script loaded')
    console.log('⚙️  Executing SQL...')
    
    // Execute the update
    await client.query(sql)
    
    console.log('✅ Conversations table updated successfully!')
    console.log('')
    console.log('📊 Columns added/updated:')
    console.log('  ✓ type (direct/group/ai)')
    console.log('  ✓ name (for groups/AI)')
    console.log('  ✓ updated_at (timestamp)')
    console.log('')
    console.log('🎉 Your messaging system is fully updated!')
    
  } catch (error) {
    console.error('❌ Update failed:', error.message)
    console.error('')
    console.error('Error details:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

updateConversations()
