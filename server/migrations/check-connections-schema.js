import 'dotenv/config'
import { query } from '../db.js'

async function checkSchema() {
  try {
    console.log('Checking connections table schema...')
    
    const typeCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'connections' 
      ORDER BY ordinal_position
    `)
    
    console.log('connections table columns:')
    typeCheck.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`)
    })
    
    const usersCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'id'
    `)
    
    console.log('\nusers.id type:', usersCheck.rows[0])
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Check failed:', error.message)
    process.exit(1)
  }
}

checkSchema()
