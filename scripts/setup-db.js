import fs from 'fs'
import path from 'path'
import url from 'url'
import 'dotenv/config'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 STARTX Database Setup Helper')
console.log('================================\n')

console.log('Current DATABASE_URL:', process.env.DATABASE_URL || 'Not set')

console.log('\n📋 Database Setup Options:')
console.log('========================\n')

console.log('Option 1: Use Neon (Cloud PostgreSQL) - RECOMMENDED')
console.log('1. Go to https://neon.tech and create a free account')
console.log('2. Create a new project')
console.log('3. Copy the connection string from the dashboard')
console.log('4. Update your .env file with the new DATABASE_URL')
console.log('5. Run: npm run db:migrate\n')

console.log('Option 2: Use Local PostgreSQL')
console.log('1. Install PostgreSQL: https://www.postgresql.org/download/')
console.log('2. Create a database: createdb startx_db')
console.log('3. Update .env with: DATABASE_URL=postgresql://username:password@localhost:5432/startx_db')
console.log('4. Run: npm run db:migrate\n')

console.log('Option 3: Use Docker (if you have Docker installed)')
console.log('1. Run: docker run --name startx-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=startx_db -p 5432:5432 -d postgres:15')
console.log('2. Update .env with: DATABASE_URL=postgresql://postgres:password@localhost:5432/startx_db')
console.log('3. Run: npm run db:migrate\n')

console.log('Option 4: Skip Database (Run without persistence)')
console.log('1. Comment out or remove DATABASE_URL from .env')
console.log('2. The app will run without database features\n')

console.log('🔧 Quick Fix for Current Issue:')
console.log('The current DATABASE_URL appears to be pointing to a non-existent Neon database.')
console.log('Please choose one of the options above to set up a working database connection.\n')

// Check if .env exists and show current content
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  console.log('Current .env file content:')
  console.log('========================')
  const envContent = fs.readFileSync(envPath, 'utf8')
  console.log(envContent)
} else {
  console.log('No .env file found. Please create one based on sample.env')
}
