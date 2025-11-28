import 'dotenv/config'
import { query } from '../db.js'

async function addMessageStatus() {
  try {
    console.log('Adding message delivery status...')
    
    // Add delivery_status column
    await query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'sent' 
      CHECK (delivery_status IN ('sent', 'delivered', 'read'))
    `)
    console.log('✅ Added delivery_status column')
    
    // Add delivered_at and read_at timestamps
    await query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE
    `)
    console.log('✅ Added delivered_at column')
    
    await query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE
    `)
    console.log('✅ Added read_at column')
    
    // Create index for faster queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_delivery_status 
      ON messages(delivery_status)
    `)
    console.log('✅ Created index')
    
    console.log('\n🎉 Message status tracking added!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

addMessageStatus()
