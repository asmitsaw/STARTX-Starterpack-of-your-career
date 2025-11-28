import 'dotenv/config'
import { pool } from './db.js'

async function createMessagesTable() {
  const client = await pool.connect()
  
  try {
    console.log('💬 Creating messages table...')
    
    // Drop existing table if it exists (to start fresh)
    await client.query('DROP TABLE IF EXISTS message_read_receipts CASCADE')
    await client.query('DROP TABLE IF EXISTS messages CASCADE')
    console.log('  Dropped existing messages tables (if any)')
    
    // Create messages table
    await client.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        media_url TEXT,
        reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        is_ai_message BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `)
    console.log('  ✅ Created messages table')
    
    // Create message_read_receipts table
    await client.query(`
      CREATE TABLE message_read_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id)
      )
    `)
    console.log('  ✅ Created message_read_receipts table')
    
    // Create indexes
    await client.query('CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at)')
    await client.query('CREATE INDEX idx_messages_sender ON messages(sender_id)')
    await client.query('CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id)')
    console.log('  ✅ Created indexes')
    
    // Create trigger to update conversation timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_conversation_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE conversations 
        SET updated_at = NOW() 
        WHERE id = NEW.conversation_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages
    `)
    
    await client.query(`
      CREATE TRIGGER trigger_update_conversation_timestamp
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_conversation_timestamp()
    `)
    console.log('  ✅ Created trigger')
    
    console.log('\n✅ Messages table created successfully!')
    console.log('\nYou can now:')
    console.log('  1. Send messages')
    console.log('  2. Receive messages in real-time')
    console.log('  3. See read receipts')
    
  } catch (error) {
    console.error('❌ Failed to create table:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

createMessagesTable()
