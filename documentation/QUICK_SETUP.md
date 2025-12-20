# 🚀 QUICK START - RUN THIS NOW!

## You Need to Do This ONE TIME:

### 1️⃣ **Copy the SQL File**
- Open: `c:\Magic\SomaLux\backend\migrations\001_COMPLETE_DATABASE_SETUP.sql`
- Select All: **Ctrl+A**
- Copy: **Ctrl+C**

### 2️⃣ **Go to Supabase**
- Open: https://app.supabase.com
- Login with your account
- Select Project: **brlsqmyyewxtmjkrfvlo**

### 3️⃣ **Open SQL Editor**
- Click left sidebar: **SQL Editor**
- Click button: **New Query**

### 4️⃣ **Paste SQL**
- Click in text area
- Paste: **Ctrl+V**
- You should see ~800 lines of SQL

### 5️⃣ **Run the Migration**
- Click blue **RUN** button
- Wait 10-30 seconds
- Look for: **✅ Query executed successfully**

### 6️⃣ **Restart Application**
```powershell
# Stop everything
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Start backend
cd c:\Magic\SomaLux\backend
node index.js

# In new terminal, start frontend
cd c:\Magic\SomaLux
npm start
```

### 7️⃣ **Test in Browser**
- Open: http://localhost:5001
- Login
- Check admin panel
- ✅ Should work perfectly!

---

## That's It! 🎉

Your database is now:
- ✅ Set up correctly
- ✅ Connected to your Supabase account
- ✅ Ready to use

---

## If Something Goes Wrong

**Backend shows "table not found"**
→ Make sure SQL migration ran successfully

**Error in SQL Editor**
→ Copy the entire file again, make sure nothing was missed

**Still have issues**
→ Check backend logs for exact error

---

**Time required:** 5 minutes ⏱️
