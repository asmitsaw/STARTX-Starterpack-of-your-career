import 'dotenv/config'
import { pool } from './db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting database migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '004_messaging_system.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded')
    console.log('⚙️  Executing SQL...')
    
    // Execute the migration
    await client.query(sql)
    
    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('📊 Tables created:')
    console.log('  ✓ conversations')
    console.log('  ✓ conversation_participants')
    console.log('  ✓ messages')
    console.log('  ✓ message_read_receipts')
    console.log('  ✓ typing_indicators')
    console.log('  ✓ notifications')
    console.log('  ✓ ai_chat_sessions')
    console.log('')
    console.log('🎉 Your messaging system is ready to use!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('')
    console.error('Error details:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
