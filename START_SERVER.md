# How to Start Janibear Server

## Quick Start

1. **Open PowerShell or Command Prompt**

2. **Navigate to the Janibear folder:**
   ```
   cd "c:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
   ```

3. **Install dependencies (if needed):**
   ```
   npm install
   ```

4. **Start the development server:**
   ```
   npm run dev
   ```

5. **Wait for this message:**
   ```
   ✓ Ready in X seconds
   ○ Local: http://localhost:3001
   ```

6. **Open in browser:**
   ```
   http://localhost:3001
   ```

## Troubleshooting

### If you see "port already in use":
- Kill the process: `Get-Process node | Stop-Process -Force`
- Or use a different port: `npm run dev -- -p 3002`

### If you see "module not found":
- Run: `npm install`
- Then try again: `npm run dev`

### If you see build errors:
- Check the error message
- Common issues:
  - Missing dependencies → `npm install`
  - TypeScript errors → Check the file mentioned
  - Supabase connection → Verify `.env.local` has correct keys

## Port Configuration

- **Janibear**: Port 3001 (configured in package.json)
- **Sourceit**: Port 3000 (separate project)

Both can run simultaneously!
