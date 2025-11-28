import 'dotenv/config'
import { query } from '../db.js'

async function fixTypes() {
  try {
    console.log('Fixing data type mismatches...')
    
    // Check current type of conversation_participants.user_id
    const typeCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'conversation_participants' 
      AND column_name IN ('user_id', 'conversation_id')
    `)
    
    console.log('Current types:', typeCheck.rows)
    
    // If user_id is text, convert it to UUID
    const userIdType = typeCheck.rows.find(r => r.column_name === 'user_id')
    if (userIdType && userIdType.data_type === 'text') {
      console.log('Converting conversation_participants.user_id from text to uuid...')
      await query(`
        ALTER TABLE conversation_participants 
        ALTER COLUMN user_id TYPE UUID USING user_id::uuid
      `)
      console.log('✅ user_id converted to UUID')
    }
    
    console.log('\n🎉 Type fixes completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

fixTypes()
