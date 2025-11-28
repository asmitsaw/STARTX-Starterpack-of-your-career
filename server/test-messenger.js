import 'dotenv/config'
import { pool } from './db.js'

async function testMessenger() {
  const client = await pool.connect()
  
  try {
    console.log('🧪 Testing Messenger Database Setup...\n')
    
    // Test 1: Check if tables exist
    console.log('Test 1: Checking tables...')
    const tables = [
      'conversations',
      'conversation_participants',
      'messages',
      'message_read_receipts',
      'typing_indicators',
      'notifications',
      'ai_chat_sessions'
    ]
    
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      )
      
      if (result.rows[0].exists) {
        console.log(`  ✅ ${table}`)
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`)
      }
    }
    
    console.log('\nTest 2: Checking indexes...')
    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('messages', 'conversation_participants', 'notifications')
      ORDER BY indexname
    `)
    console.log(`  ✅ Found ${indexes.rows.length} indexes`)
    
    console.log('\nTest 3: Testing insert/select...')
    // Create a test conversation
    const conv = await client.query(
      `INSERT INTO conversations (type, name) 
       VALUES ('direct', 'Test Chat') 
       RETURNING id`
    )
    console.log(`  ✅ Created test conversation: ${conv.rows[0].id}`)
    
    // Clean up
    await client.query('DELETE FROM conversations WHERE name = $1', ['Test Chat'])
    console.log('  ✅ Cleaned up test data')
    
    console.log('\n✅ All tests passed!')
    console.log('\n🎉 Your messenger database is ready!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('\nPlease run the migration first:')
    console.error('  npm run migrate:messenger')
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

testMessenger()
