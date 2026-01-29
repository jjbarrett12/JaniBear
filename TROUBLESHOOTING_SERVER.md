# Server Troubleshooting Guide

## If "Connection Failed" Error

### Step 1: Check if Server is Running
Open PowerShell and run:
```powershell
netstat -ano | findstr :3001
```

Look for a line with `LISTENING` - that means the server is running.

### Step 2: Check Server Output
The server should show:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3001
✓ Ready in X seconds
```

### Step 3: Common Fixes

**Fix 1: Clear Cache and Restart**
```powershell
cd "c:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
Remove-Item -Path .next -Recurse -Force
npm run dev
```

**Fix 2: Check for Port Conflicts**
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Start fresh
npm run dev
```

**Fix 3: Reinstall Dependencies**
```powershell
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force
npm install
npm run dev
```

**Fix 4: Check Environment Variables**
Make sure `.env.local` exists and has:
```
NEXT_PUBLIC_SUPABASE_URL=https://agyrzjnnqtbpnowrxoxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Step 4: Manual Start (See Errors)
```powershell
cd "c:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
npm run dev
```

Watch for:
- ✅ "Ready" = Success
- ❌ Red errors = Share them with me

### Step 5: Try Different Port
If 3001 is blocked:
```powershell
npm run dev -- -p 3002
```
Then go to: `http://localhost:3002`

## Current Status
- Port: 3001 (configured in package.json)
- Cache: Cleared
- Server: Starting...

Wait 20-30 seconds after starting, then try: `http://localhost:3001`
