import 'dotenv/config'
import { query } from '../db.js'

async function checkTypes() {
  try {
    console.log('Checking sender_id type...')
    
    const typeCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'sender_id'
    `)
    
    console.log('messages.sender_id type:', typeCheck.rows)
    
    const mrTypeCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'message_read_receipts' 
      AND column_name = 'user_id'
    `)
    
    console.log('message_read_receipts.user_id type:', mrTypeCheck.rows)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Check failed:', error.message)
    process.exit(1)
  }
}

checkTypes()
