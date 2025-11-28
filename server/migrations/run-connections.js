import 'dotenv/config'
import { query } from '../db.js'

async function runMigration() {
  try {
    console.log('Running connections migration...')
    
    // Create connections table
    await query(`
      CREATE TABLE IF NOT EXISTS connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, connected_user_id)
      )
    `)
    console.log('✅ Connections table created!')
    
    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status)`)
    console.log('✅ Indexes created!')
    
    // Create notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ Notifications table created!')
    
    // Create notification indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`)
    console.log('✅ Notification indexes created!')
    
    console.log('\n🎉 Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
