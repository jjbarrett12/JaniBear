# How to Run Database Migrations in Supabase

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (or create a new one if you haven't)

### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"** (it has a database/terminal icon)
2. You should see a text area/editor where you can type SQL

### Step 3: Run First Migration
1. Open the file `supabase/migrations/001_initial_schema.sql` in your code editor (VS Code/Cursor)
2. **Select ALL the contents** of that file:
   - Press `Ctrl+A` (or `Cmd+A` on Mac) to select all
   - Press `Ctrl+C` (or `Cmd+C` on Mac) to copy
3. Go back to Supabase SQL Editor
4. Click in the SQL editor text area (the big white box)
5. Paste the SQL (`Ctrl+V` or `Cmd+V`)
6. Click the **"Run"** button (usually at the bottom right, or press `Ctrl+Enter`)
   - OR look for a play button ▶️
   - OR press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)
7. Wait for it to complete - you should see "Success" or "No rows returned"

### Step 4: Run Second Migration
1. In the SQL Editor, **clear the previous query**:
   - Select all text (`Ctrl+A`) and delete it
   - OR click the "New" or "Clear" button if available
2. Open the file `supabase/migrations/002_rls_policies.sql` in your code editor
3. Copy ALL the contents (`Ctrl+A`, then `Ctrl+C`)
4. Paste into the Supabase SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Wait for it to complete

### Step 5: Verify Tables Were Created
1. In Supabase dashboard, click on **"Table Editor"** in the left sidebar
2. You should see all the tables listed:
   - organizations
   - profiles
   - org_members
   - locations
   - crews
   - templates
   - inspections
   - issues
   - etc.

### Step 6: Create Storage Bucket
1. Click on **"Storage"** in the left sidebar
2. Click **"New bucket"** or **"Create bucket"** button
3. Name it: `inspection-photos`
4. **IMPORTANT**: Check the box for **"Public bucket"** (this makes it accessible)
5. Click **"Create bucket"** or **"Save"**

## Visual Guide - What to Look For

The SQL Editor in Supabase typically looks like this:
- **Top**: A text editor/textarea where you type SQL
- **Bottom**: A "Run" button or "Execute" button
- **Keyboard shortcut**: `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac) to run

If you see tabs or multiple query windows, you can:
- Click the "+" icon to create a new query tab
- OR just clear the current one and paste new SQL

## Alternative: Use the Quick Copy Command

**Windows PowerShell** (run this in your project folder):
```powershell
Get-Content supabase\migrations\001_initial_schema.sql | Set-Clipboard
```
This copies the entire file to your clipboard, then just paste it in Supabase!

## Common Errors & Solutions

### Error: "relation already exists"
- **Solution**: The tables already exist. You can either:
  - Drop the existing tables and re-run, OR
  - Skip this migration if you've already run it

### Error: "permission denied"
- **Solution**: Make sure you're running the SQL as the project owner/admin
- Try refreshing the Supabase dashboard

### Error: "syntax error"
- **Solution**: Make sure you copied the ENTIRE file, including all semicolons
- Check that you didn't accidentally cut off part of the SQL

## Still Can't Find It?

If you're still having trouble:
1. **Take a screenshot** of your Supabase SQL Editor screen
2. Look for any button that says:
   - "Run"
   - "Execute" 
   - "▶️" (play icon)
   - Or just try `Ctrl+Enter` on your keyboard while the SQL editor is focused

The SQL Editor should have a large text area where you can paste SQL code, and some way to execute it (button or keyboard shortcut).
