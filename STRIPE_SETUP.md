# Stripe Subscription Integration - Setup Guide

## 🎯 Overview
Professional Stripe subscription system with 3 tiers: Starter (Free), Pro (₹499/month), Elite (₹999/month).

## 📋 Prerequisites
1. Stripe account (https://dashboard.stripe.com/register)
2. Node.js and npm installed
3. PostgreSQL database running

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Get Stripe API Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Update `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### Step 2: Create Stripe Products & Prices
1. Go to https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**

**For Pro Plan:**
- Name: `StartX Pro`
- Description: `Professional features for serious job seekers`
- Pricing: `₹499 INR` / `Recurring` / `Monthly`
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)

**For Elite Plan:**
- Name: `StartX Elite`
- Description: `Maximum career acceleration`
- Pricing: `₹999 INR` / `Recurring` / `Monthly`
- Click **Save product**
- Copy the **Price ID** (starts with `price_`)

3. Update `.env` with Price IDs:
```env
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
STRIPE_PRICE_ID_ELITE=price_YOUR_ELITE_PRICE_ID
```

### Step 3: Run Database Migration
```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the migration
\i server/migrations/add_subscriptions.sql

# Verify tables were created
\dt
```

You should see: `users`, `subscriptions`, `subscription_events`

### Step 4: Set Up Stripe Webhook (for production)
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

**For local testing**, use Stripe CLI:
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5174/api/stripe/webhook
# Copy the webhook signing secret to .env
```

### Step 5: Restart Server
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

---

## ✅ Testing the Integration

### Test Checkout Flow
1. Navigate to http://localhost:5173/premium
2. Click **"Try Pro"** or **"Go Elite"**
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
4. Complete checkout
5. You should be redirected to success page
6. Check database:
```sql
SELECT subscription_tier, subscription_status FROM users WHERE email = 'your@email.com';
```

### Test Subscription Management
1. Go to http://localhost:5173/premium
2. Click **"Manage Subscription"** (appears after subscribing)
3. You'll be redirected to Stripe Customer Portal
4. Test canceling/updating subscription

### Test Webhooks
1. In Stripe Dashboard, go to **Developers > Events**
2. You should see events like:
   - `checkout.session.completed`
   - `customer.subscription.created`
3. Click on an event to see details
4. Check your server logs for webhook processing

---

## 🔒 Security Best Practices

### ✅ Already Implemented
- ✅ Webhook signature verification
- ✅ Environment variables for secrets
- ✅ Server-side subscription validation
- ✅ Secure payment processing (handled by Stripe)

### 🚨 Before Production
1. **Switch to live keys**:
   - Replace `pk_test_` with `pk_live_`
   - Replace `sk_test_` with `sk_live_`
2. **Update webhook endpoint** to production URL
3. **Enable HTTPS** (required for webhooks)
4. **Set up proper error monitoring** (e.g., Sentry)
5. **Test thoroughly** with real cards in test mode first

---

## 🎨 Frontend Components

### Available Components
- **`/premium`** - Pricing page with all plans
- **`/premium/success`** - Post-checkout success page
- **`useSubscription()` hook** - Access subscription status anywhere

### Usage Example
```jsx
import { useSubscription } from '../contexts/SubscriptionContext'

function MyComponent() {
  const { subscription, hasAccess, createCheckoutSession } = useSubscription()

  // Check if user has Pro or Elite
  if (hasAccess('pro')) {
    return <PremiumFeature />
  }

  // Upgrade prompt
  return (
    <button onClick={() => createCheckoutSession('pro')}>
      Upgrade to Pro
    </button>
  )
}
```

---

## 🛡️ Backend Protection

### Protect Routes by Subscription
```javascript
const { requireSubscription } = require('./middleware/subscription')

// Require Pro or Elite
router.post('/premium-feature', 
  requireSubscription(['pro', 'elite']), 
  async (req, res) => {
    // Only accessible to Pro/Elite users
  }
)
```

### Check Feature Limits
```javascript
const { checkFeatureLimit } = require('./middleware/subscription')

const limit = await checkFeatureLimit(userId, 'aiInterviewsPerWeek')
if (limit.allowed) {
  // User can use feature
}
```

---

## 📊 Database Schema

### Users Table (Updated)
```sql
- subscription_tier: 'starter' | 'pro' | 'elite'
- subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
- stripe_customer_id: Stripe customer ID
- stripe_subscription_id: Stripe subscription ID
- subscription_start_date: When subscription started
- subscription_end_date: When current period ends
- subscription_cancel_at_period_end: Boolean
```

### Subscriptions Table (New)
Detailed subscription tracking with full history.

### Subscription Events Table (New)
Audit trail of all Stripe webhook events.

---

## 🐛 Troubleshooting

### Issue: "No active subscription found"
**Solution**: User hasn't subscribed yet or webhook didn't fire.
- Check Stripe Dashboard > Customers
- Verify webhook is configured correctly
- Check server logs for webhook errors

### Issue: Checkout session not redirecting
**Solution**: Check success/cancel URLs in `.env`
```env
VITE_API_URL=http://localhost:5173
```

### Issue: Webhook signature verification failed
**Solution**: 
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- For local testing, use Stripe CLI
- Check that webhook endpoint is `/api/stripe/webhook`

### Issue: Database errors
**Solution**: Run migration again:
```bash
psql $DATABASE_URL -f server/migrations/add_subscriptions.sql
```

---

## 📈 Next Steps

### Recommended Enhancements
1. **Email notifications** - Send receipts, renewal reminders
2. **Usage tracking** - Track AI interview usage, enforce limits
3. **Promo codes** - Already supported by Stripe Checkout
4. **Annual billing** - Create annual price IDs for discounts
5. **Team plans** - Multi-user subscriptions
6. **Metered billing** - Pay-per-use features

### Analytics to Track
- Conversion rate (visitors → subscribers)
- Churn rate (cancellations)
- MRR (Monthly Recurring Revenue)
- LTV (Lifetime Value)

---

## 📞 Support

### Stripe Resources
- Dashboard: https://dashboard.stripe.com
- Documentation: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Testing: https://stripe.com/docs/testing

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

---

## ✨ Features Included

✅ **3-tier subscription system**
✅ **Stripe Checkout integration**
✅ **Customer Portal for self-service**
✅ **Webhook handling for real-time updates**
✅ **Database schema with audit trail**
✅ **Subscription middleware for route protection**
✅ **React context for frontend state**
✅ **Beautiful pricing page**
✅ **Success page with onboarding**
✅ **Production-ready security**

---

## 🎉 You're All Set!

Your professional Stripe integration is ready. Test it thoroughly in development, then switch to live keys for production.

**Questions?** Check Stripe docs or server logs for detailed error messages.
