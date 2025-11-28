import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') })

// Import db after loading env
const { default: db } = await import('../db.js')

async function runMigration() {
  try {
    console.log('🔄 Running subscription migration...')
    
    if (!db.pool) {
      console.error('❌ Database pool not initialized. Check DATABASE_URL in .env')
      process.exit(1)
    }
    
    const migrationPath = path.join(__dirname, '../migrations/add_subscriptions.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons and run each statement
    const statements = sql.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement)
      }
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('📊 Created/updated tables:')
    console.log('   - users (added subscription columns)')
    console.log('   - subscriptions (new)')
    console.log('   - subscription_events (new)')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
