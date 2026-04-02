# Quick Start: Fixed Port 3000 Development

## TL;DR - Start Your Dev Server

### Option 1: Double-click script (Easiest)
```
start-dev-port3000.bat
```
Or in PowerShell:
```
.\start-dev-port3000.ps1
```

### Option 2: npm command
```bash
npm run start:3000
```

### Option 3: Manual
```bash
PORT=3000 npm start
```

---

## One-Time Supabase Setup (5 minutes)

1. Go to: https://supabase.com → Sign in → Select project "somalux-q2bw"
2. Click **Authentication** → **URL Configuration**
3. Add under "Redirect URLs":
   - `http://localhost:3000`
   - `http://localhost:3000/`
4. Click **Save**

That's it! You'll never need to change ports again.

---

## Now You Can:

✅ Run the dev server consistently on port 3000  
✅ No more "Invalid redirect URL" errors  
✅ Live preview works smoothly  
✅ Auth stays configured permanently  

---

## Files Created for You:

| File | Purpose |
|------|---------|
| `start-dev-port3000.bat` | Windows batch script (double-click to run) |
| `start-dev-port3000.ps1` | PowerShell script (for modern Windows) |
| `.env.development` | Auto-loaded dev environment variables |
| `package.json` | Updated with `start:3000` script |

---

## Troubleshooting

**Port 3000 in use?**
```powershell
# PowerShell: Find and kill
netstat -ano | findstr :3000
taskkill /PID <number> /F
```

**Auth errors?**
- Verify `http://localhost:3000` in Supabase URL Configuration
- Hard refresh browser: Ctrl+F5
- Clear cookies: Ctrl+Shift+Delete

**Still issues?**
See [FIXED_PORT_DEVELOPMENT_SETUP.md](FIXED_PORT_DEVELOPMENT_SETUP.md) for detailed troubleshooting.

---

## Backend Development (Optional)

If running backend locally on port 5001:

```bash
cd backend
npm start
```

The frontend will automatically use `http://localhost:5001` from `.env.development`

---

**Ready? Start with: `npm run start:3000`** 🚀
