# 🔧 Fix "Failed to start checkout" Error

## ✅ What I Just Fixed:

1. **Added better error logging** - You'll now see the exact error in console
2. **Added validation** - Checks if Stripe keys are properly set
3. **Added detailed logs** - Server will show what's happening

---

## 🚀 How to Fix & Test:

### Step 1: Restart Your Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 2: Check Server Terminal on Startup
Look for these messages:
- ✅ Should NOT see: `❌ STRIPE_SECRET_KEY is not set`
- ✅ Server should start without errors

### Step 3: Open Browser Console (F12)
Before clicking "Try Pro":
1. Open DevTools (F12)
2. Go to Console tab
3. Clear console

### Step 4: Click "Try Pro"
Watch for errors in:

**Browser Console:**
- Look for "Error details:" message
- This will show the exact problem

**Server Terminal:**
- Look for `[Stripe Service]` logs
- Should show: "Creating checkout session..."
- Should show: "Using price ID: price_..."

---

## 🔍 Common Issues & Solutions:

### Issue 1: "Invalid price ID"
**Error:** `Invalid price ID for pro. Please set STRIPE_PRICE_ID_PRO`

**Solution:** Check your `.env` file:
```env
STRIPE_PRICE_ID_PRO=price_1SNILPRyh6yz2vFCdkR8tyzP
STRIPE_PRICE_ID_ELITE=price_1SNIM6Ryh6yz2vFCqvbhNKqA
```

Make sure these are actual Stripe Price IDs (start with `price_1`), not Product IDs!

### Issue 2: "Stripe is not configured"
**Error:** `Stripe is not configured. Please set STRIPE_SECRET_KEY`

**Solution:** Check `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_51SNIHk8yhoy2vvFCuxXoLVvgzXNm9x5muwN8pYdeSQqLRfKp2JgRk6xSQ5dzJ7YQFQMSz43v53auN4XrFHKWnPGT009ar7k5r8U
```

### Issue 3: "401 Unauthorized"
**Error:** API returns 401

**Solution:** 
1. Use incognito mode or clear cookies
2. Log in fresh
3. Try again

### Issue 4: "User email is required"
**Error:** No email found

**Solution:**
1. Make sure you're logged in with Clerk
2. Check that your Clerk account has an email
3. Refresh page and try again

---

## 📊 What to Look For:

### ✅ Success Logs (Server):
```
[Stripe] Creating checkout session: { userId: 123, email: 'user@example.com', tier: 'pro' }
[Stripe Service] Creating checkout session: { userId: 123, email: 'user@example.com', tier: 'pro' }
[Stripe Service] Using price ID: price_1SNILPRyh6yz2vFCdkR8tyzP
[Stripe Service] Checkout session created: cs_test_xxxxx
[Stripe] Checkout session created: cs_test_xxxxx
```

### ❌ Error Logs (Server):
```
[Stripe Service] Error creating checkout session: Invalid price ID
```

---

## 🎯 Quick Test Checklist:

- [ ] Server restarted
- [ ] No errors on server startup
- [ ] Logged in (incognito mode recommended)
- [ ] Browser console open (F12)
- [ ] Click "Try Pro"
- [ ] Check browser console for errors
- [ ] Check server terminal for logs
- [ ] Note the exact error message

---

## 💡 Most Likely Issue:

Based on your `.env`, you have:
```env
STRIPE_PRICE_ID_PRO=price_1SNILPRyh6yz2vFCdkR8tyzP
STRIPE_PRICE_ID_ELITE=price_1SNIM6Ryh6yz2vFCqvbhNKqA
```

These look correct! The issue is probably:
1. **Not logged in properly** (no JWT token)
2. **Server not restarted** after adding keys
3. **Browser cache** (use incognito)

---

## 🚀 Try This Now:

1. **Stop server** (Ctrl+C)
2. **Start server** (`npm run dev`)
3. **Open incognito window**
4. **Go to:** `http://localhost:5173`
5. **Log in**
6. **Go to:** `http://localhost:5173/premium`
7. **Open console** (F12)
8. **Click "Try Pro"**
9. **Tell me the exact error** you see in console or terminal

---

**The new error messages will tell us exactly what's wrong!** 🔍
