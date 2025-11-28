# 🚀 Run Messenger Setup - Step by Step

## ✅ What You Need to Do

Follow these steps **IN ORDER** to set up your messenger:

---

## 📋 Step-by-Step Instructions

### Option 1: Automatic Setup (Recommended) ⚡

**Just run this one command:**

```bash
setup-messenger.bat
```

This will:
1. ✅ Install required packages
2. ✅ Run database migration
3. ✅ Test the setup

---

### Option 2: Manual Setup (If automatic fails) 🔧

#### Step 1: Install Dependencies

```bash
npm install @google/generative-ai
```

**Expected output:**
```
added 1 package
```

---

#### Step 2: Run Database Migration

```bash
npm run migrate:messenger
```

**Expected output:**
```
🚀 Starting database migration...
📄 Migration file loaded
⚙️  Executing SQL...
✅ Migration completed successfully!

📊 Tables created:
  ✓ conversations
  ✓ conversation_participants
  ✓ messages
  ✓ message_read_receipts
  ✓ typing_indicators
  ✓ notifications
  ✓ ai_chat_sessions

🎉 Your messaging system is ready to use!
```

---

#### Step 3: Test the Setup

```bash
npm run test:messenger
```

**Expected output:**
```
🧪 Testing Messenger Database Setup...

Test 1: Checking tables...
  ✅ conversations
  ✅ conversation_participants
  ✅ messages
  ✅ message_read_receipts
  ✅ typing_indicators
  ✅ notifications
  ✅ ai_chat_sessions

Test 2: Checking indexes...
  ✅ Found 7 indexes

Test 3: Testing insert/select...
  ✅ Created test conversation
  ✅ Cleaned up test data

✅ All tests passed!
🎉 Your messenger database is ready!
```

---

#### Step 4: Start the Servers

**Terminal 1 - API Server:**
```bash
npm run api
```

**Terminal 2 - Dev Server:**
```bash
npm run dev
```

---

#### Step 5: Test the Messenger

1. Open browser: `http://localhost:5173/message`
2. Click **"+ New"** button
3. Select **"Chat with Gemini AI"**
4. Type a message and press Enter
5. AI should respond!

---

## 🐛 Troubleshooting

### Error: "relation 'conversations' does not exist"

**Solution:** Run the migration again:
```bash
npm run migrate:messenger
```

---

### Error: "Cannot find module '@google/generative-ai'"

**Solution:** Install the package:
```bash
npm install @google/generative-ai
```

---

### Error: "GEMINI_API_KEY is not defined"

**Solution:** Check your `.env` file has:
```env
GEMINI_API_KEY=your_key_here
```

---

### Error: "Database connection failed"

**Solution:** Check your `.env` file has:
```env
DATABASE_URL=your_postgres_connection_string
```

---

### Migration runs but tables not created

**Solution:** Check database permissions:
```bash
# Connect to your database
psql $DATABASE_URL

# Check if tables exist
\dt

# If not, run SQL manually
\i server/migrations/004_messaging_system.sql
```

---

## ✅ Verification Checklist

Before using the messenger, verify:

- [ ] ✅ Dependencies installed (`@google/generative-ai`)
- [ ] ✅ Migration completed successfully
- [ ] ✅ All 7 tables created
- [ ] ✅ Test passed
- [ ] ✅ API server running (port 5174)
- [ ] ✅ Dev server running (port 5173)
- [ ] ✅ Can access `/message` page
- [ ] ✅ Can create AI conversation
- [ ] ✅ AI responds to messages

---

## 🎯 Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `setup-messenger.bat` | Run complete setup |
| `npm run migrate:messenger` | Run database migration |
| `npm run test:messenger` | Test database setup |
| `npm run api` | Start API server |
| `npm run dev` | Start dev server |

---

## 📊 What Gets Created

### Database Tables (7 total):

1. **conversations** - Chat rooms
2. **conversation_participants** - Who's in each chat
3. **messages** - All messages
4. **message_read_receipts** - Read status
5. **typing_indicators** - Real-time typing
6. **notifications** - System notifications
7. **ai_chat_sessions** - AI conversation context

### Indexes (7 total):

- Message lookups by conversation
- Participant lookups by user
- Notification queries
- Read receipt checks

### Triggers (1 total):

- Auto-update conversation timestamp on new message

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Migration completes without errors
2. ✅ Test shows all tables exist
3. ✅ Can access `/message` page
4. ✅ Can see "Messages" sidebar
5. ✅ Can click "+ New" button
6. ✅ Can create AI conversation
7. ✅ AI responds to your messages
8. ✅ Messages appear in real-time

---

## 🚀 Next Steps After Setup

1. **Test AI Chat:**
   - Click "+ New" → "Chat with Gemini AI"
   - Ask: "Hello, how are you?"
   - AI should respond instantly

2. **Test Direct Messages:**
   - Click "+ New" → "Message a User"
   - Search for a user
   - Send a message

3. **Test Real-Time Features:**
   - Open messenger in 2 browser tabs
   - Send message from one tab
   - See it appear instantly in other tab

4. **Test Typing Indicators:**
   - Start typing in one tab
   - See "typing..." in other tab

---

## 📞 Need Help?

If you encounter issues:

1. Check the error message carefully
2. Look in the troubleshooting section above
3. Check server logs for errors
4. Verify `.env` file has all required keys
5. Make sure PostgreSQL is running

---

## ✨ Features to Test

After setup, test these features:

- [ ] Send text messages
- [ ] See typing indicators
- [ ] View online/offline status
- [ ] Use emoji picker
- [ ] Search for users
- [ ] Create AI conversation
- [ ] Get AI responses
- [ ] See message timestamps
- [ ] View unread counts
- [ ] Real-time message delivery

---

**Ready? Let's go! Run:** `setup-messenger.bat` 🚀
