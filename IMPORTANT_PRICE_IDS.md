# ⚠️ IMPORTANT: Get the Correct Price IDs

## The Price IDs in your .env are PRODUCT IDs, not PRICE IDs!

You need to get the **Price ID** (not Product ID) for each product.

### Here's how:

1. **Go to Stripe Dashboard:**
   https://dashboard.stripe.com/test/products

2. **Click on "Pro" product**

3. **Scroll down to the "Pricing" section**
   - You'll see a table with pricing information
   - Look for the row with "₹499.00 USD / Per month"
   - On the right side, there's a **Price ID** that starts with `price_`
   - Click the copy icon next to it

4. **Do the same for "Elite" product**
   - Find the "₹999.00 USD / Per month" row
   - Copy the **Price ID** (starts with `price_`)

5. **Update your `.env` file:**
   ```env
   STRIPE_PRICE_ID_PRO=price_1AbCdEfGhIjKlMnO
   STRIPE_PRICE_ID_ELITE=price_1XyZaBcDeFgHiJkL
   ```

---

## Why this matters:

- **Product ID** (`prod_xxx`) = The product container
- **Price ID** (`price_xxx`) = The specific pricing plan

Stripe Checkout needs the **Price ID** to know which plan to charge.

---

## Screenshot Guide:

When you click on a product, you should see something like:

```
Pricing
┌─────────────────────────────────────────────────┐
│ ₹499.00 USD / Per month                         │
│ Price ID: price_1AbCdEfGhIjKlMnO  [📋 Copy]    │
└─────────────────────────────────────────────────┘
```

Copy that `price_xxx` value!

---

## After updating:

Run the test script again:
```bash
node server/scripts/test-stripe.js
```

It should show the correct `price_` IDs.

Then restart your server and test! 🚀
