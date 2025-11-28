# 🎯 Get Stripe Price IDs - Quick Guide

## You need to get the Price IDs for your Pro and Elite products

### Steps:

1. **Go to your Stripe Dashboard Products page:**
   https://dashboard.stripe.com/test/products

2. **Click on "Pro" product** (₹499.00 USD / Per month)
   - You'll see a section called "Pricing"
   - Copy the **Price ID** (starts with `price_`)
   - It looks like: `price_1AbCdEfGhIjKlMnO`

3. **Click on "Elite" product** (₹999.00 USD / Per month)
   - Copy the **Price ID** (starts with `price_`)

4. **Update your `.env` file:**
   ```env
   STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID_HERE
   STRIPE_PRICE_ID_ELITE=price_YOUR_ELITE_PRICE_ID_HERE
   ```

5. **Restart your server:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

---

## Alternative: Get Price IDs via API

If you prefer, I can create a script to fetch them automatically. Just let me know!

---

## After you add the Price IDs:

✅ Your Stripe integration will be **100% ready**!

Then you can test by:
1. Go to http://localhost:5173/premium
2. Click "Try Pro" or "Go Elite"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. You'll be redirected to success page!

---

**Note:** The products you created are in USD, but you can change them to INR in Stripe Dashboard if needed.
