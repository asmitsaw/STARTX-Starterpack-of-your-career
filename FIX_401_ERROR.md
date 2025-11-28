# 🔧 Fix 401 Unauthorized Error

## The Problem:
You're getting **401 Unauthorized** because the JWT authentication cookie isn't set.

---

## ✅ Quick Fix (Do This Now):

### Step 1: Clear ALL Browser Data
**Important:** You MUST do this!

**Option A - Use Incognito Mode (Easiest):**
1. Close all browser windows
2. Open **NEW Incognito/Private window**
3. Go to: `http://localhost:5173`

**Option B - Clear Cookies Manually:**
1. Press `F12` (DevTools)
2. Go to **Application** tab
3. Click **Storage** → **Clear site data**
4. Click **"Clear site data"** button
5. Close DevTools
6. Refresh page (`Ctrl+R`)

### Step 2: Log In Fresh
1. Click "Sign In" or "Sign Up"
2. Complete Clerk authentication
3. **Wait for page to fully load**
4. Check console - should see no 401 errors

### Step 3: Verify Cookie is Set
1. Press `F12` (DevTools)
2. Go to **Application** tab
3. Click **Cookies** → `http://localhost:5173`
4. Look for cookie named **`token`**
5. ✅ If you see it, you're authenticated!
6. ❌ If you don't see it, continue to Step 4

### Step 4: Manually Trigger Auth (If Step 3 Failed)
Open browser console and run:
```javascript
// This will manually call ensure-user
fetch('http://localhost:5174/api/ensure-user', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clerkUserId: 'test',
    clerkEmail: 'test@test.com',
    clerkName: 'Test User'
  })
}).then(r => r.json()).then(console.log)
```

Then refresh the page.

### Step 5: Test Premium Page
1. Go to: `http://localhost:5173/premium`
2. Click **"Try Pro"**
3. Should redirect to Stripe Checkout! ✅

---

## 🔍 Why This Happens:

1. You logged in BEFORE the auth fix
2. Old session doesn't have JWT token
3. New code requires JWT token
4. **Solution:** Log in fresh to get new token

---

## ✅ Verification Checklist:

After logging in fresh, check:

- [ ] No 401 errors in console
- [ ] `token` cookie exists in Application tab
- [ ] Premium page loads without errors
- [ ] Clicking "Try Pro" works

---

## 🎯 Expected Flow:

**Correct Flow:**
1. Open incognito window
2. Go to app
3. Log in with Clerk
4. App calls `/api/ensure-user`
5. Server sets `token` cookie ✅
6. All API calls work ✅

**Your Current Flow (Broken):**
1. Already logged in (old session)
2. No `token` cookie ❌
3. API calls fail with 401 ❌

---

## 💡 Quick Test:

Run this in browser console to check if you're authenticated:
```javascript
document.cookie
```

Should see: `token=eyJhbGciOi...` (long string)

If you DON'T see `token=`, you need to log in fresh!

---

## 🚀 TL;DR:

1. **Open incognito window**
2. **Go to:** `http://localhost:5173`
3. **Log in**
4. **Go to:** `http://localhost:5173/premium`
5. **Click "Try Pro"**
6. **Should work!** ✅

---

**The key is: INCOGNITO MODE or CLEAR ALL COOKIES!** 🔑
