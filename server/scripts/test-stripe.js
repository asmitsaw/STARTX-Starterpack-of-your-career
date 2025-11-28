import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') })

console.log('🔍 Checking Stripe Configuration...\n')

const checks = {
  'Secret Key': process.env.STRIPE_SECRET_KEY,
  'Publishable Key': process.env.STRIPE_PUBLISHABLE_KEY,
  'Webhook Secret': process.env.STRIPE_WEBHOOK_SECRET,
  'Pro Price ID': process.env.STRIPE_PRICE_ID_PRO,
  'Elite Price ID': process.env.STRIPE_PRICE_ID_ELITE,
}

let allGood = true

for (const [name, value] of Object.entries(checks)) {
  const isSet = value && value !== 'YOUR_SECRET_KEY_HERE' && value !== 'YOUR_PUBLISHABLE_KEY_HERE' && value !== 'YOUR_WEBHOOK_SECRET_HERE' && value !== 'price_YOUR_PRO_PRICE_ID' && value !== 'price_YOUR_ELITE_PRICE_ID'
  
  if (isSet) {
    console.log(`✅ ${name}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${name}: NOT SET`)
    allGood = false
  }
}

console.log('\n' + '='.repeat(50))

if (allGood) {
  console.log('✅ All Stripe keys are configured!')
  console.log('\n🚀 Next steps:')
  console.log('1. Restart your server: npm run dev')
  console.log('2. Visit: http://localhost:5173/premium')
  console.log('3. Test with card: 4242 4242 4242 4242')
} else {
  console.log('⚠️  Some Stripe keys are missing!')
  console.log('\n📝 To fix:')
  if (!checks['Pro Price ID'] || checks['Pro Price ID'].includes('YOUR')) {
    console.log('1. Go to: https://dashboard.stripe.com/test/products')
    console.log('2. Click on "Pro" product')
    console.log('3. Copy the Price ID (starts with price_)')
    console.log('4. Add to .env: STRIPE_PRICE_ID_PRO=price_...')
  }
  if (!checks['Elite Price ID'] || checks['Elite Price ID'].includes('YOUR')) {
    console.log('5. Click on "Elite" product')
    console.log('6. Copy the Price ID')
    console.log('7. Add to .env: STRIPE_PRICE_ID_ELITE=price_...')
  }
  if (!checks['Webhook Secret'] || checks['Webhook Secret'].includes('YOUR')) {
    console.log('\n⚠️  Webhook secret can be set later (needed for production)')
    console.log('For now, you can test checkout without it.')
  }
}

console.log('\n' + '='.repeat(50))
