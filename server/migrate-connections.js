import 'dotenv/config'
import { pool } from './db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrateConnections() {
  const client = await pool.connect()
  
  try {
    console.log('🔗 Setting up connections system...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '006_connections_system.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded')
    console.log('⚙️  Executing SQL...')
    
    // Execute the migration
    await client.query(sql)
    
    console.log('✅ Connections system created successfully!')
    console.log('')
    console.log('📊 Features added:')
    console.log('  ✓ connections table')
    console.log('  ✓ Send/accept/reject requests')
    console.log('  ✓ Connection status checks')
    console.log('  ✓ Only connected users can chat')
    console.log('')
    console.log('🎉 Your connection system is ready!')
    
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

migrateConnections()
