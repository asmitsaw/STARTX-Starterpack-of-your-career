import 'dotenv/config'
import { query } from '../db.js'

async function fixConnectionsTable() {
  try {
    console.log('Fixing connections table...')
    
    // Drop the broken table
    await query(`DROP TABLE IF EXISTS connections CASCADE`)
    console.log('✅ Dropped old connections table')
    
    // Recreate with proper schema
    await query(`
      CREATE TABLE connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, connected_user_id)
      )
    `)
    console.log('✅ Created connections table with id column')
    
    // Create indexes
    await query(`CREATE INDEX idx_connections_user_id ON connections(user_id)`)
    await query(`CREATE INDEX idx_connections_connected_user_id ON connections(connected_user_id)`)
    await query(`CREATE INDEX idx_connections_status ON connections(status)`)
    console.log('✅ Created indexes')
    
    console.log('\n🎉 Connections table fixed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

fixConnectionsTable()
