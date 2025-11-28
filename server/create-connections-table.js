import 'dotenv/config'
import { pool } from './db.js'

async function createConnectionsTable() {
  const client = await pool.connect()
  
  try {
    console.log('🔗 Creating connections table...')
    
    // Drop existing table if it exists (to start fresh)
    await client.query('DROP TABLE IF EXISTS connections CASCADE')
    console.log('  Dropped existing connections table (if any)')
    
    // Create connections table
    await client.query(`
      CREATE TABLE connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        connected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, connected_user_id),
        CHECK (user_id != connected_user_id)
      )
    `)
    console.log('  ✅ Created connections table')
    
    // Create indexes
    await client.query('CREATE INDEX idx_connections_user ON connections(user_id, status)')
    await client.query('CREATE INDEX idx_connections_connected_user ON connections(connected_user_id, status)')
    console.log('  ✅ Created indexes')
    
    console.log('\n✅ Connections table created successfully!')
    console.log('\nYou can now:')
    console.log('  1. Send connection requests')
    console.log('  2. Accept/reject requests')
    console.log('  3. Message connected users')
    
  } catch (error) {
    console.error('❌ Failed to create table:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

createConnectionsTable()
