# Automated Testing Guide

## 🧪 Quick Test Commands

### 1. TypeScript Compilation Check
```bash
npx tsc --noEmit
```
**Expected**: No errors

### 2. Linting Check
```bash
npm run lint
```
**Expected**: No linting errors

### 3. Build Test
```bash
npm run build
```
**Expected**: Successful build with no errors

### 4. Check Dependencies
```bash
npm list --depth=0
```
**Expected**: All packages installed

## 🔍 Component Import Test

Run this to verify all components can be imported:

```bash
node -e "
const fs = require('fs');
const components = [
  'src/components/search/global-search.tsx',
  'src/components/dashboard/stats-cards.tsx',
  'src/components/dashboard/recent-activity.tsx',
  'src/components/export/export-button.tsx',
  'src/components/filters/advanced-filters.tsx',
  'src/components/notifications/notification-bell.tsx',
  'src/components/app/mobile-sidebar.tsx',
  'src/components/app/bottom-nav.tsx',
  'src/components/bulk/bulk-actions.tsx'
];

components.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, 'MISSING');
  }
});
"
```

## 📱 Browser Console Test

Open browser console and check for:
- ✅ No red errors
- ✅ No failed network requests
- ✅ Service worker registered (if PWA)
- ✅ No missing image errors

## 🎯 Quick Smoke Tests

### Test 1: Homepage Loads
```bash
# Open http://localhost:3000
# Should see marketing page
```

### Test 2: Login Page
```bash
# Navigate to /auth/login
# Should see login form
# Should see logo
```

### Test 3: Dashboard (After Login)
```bash
# Login with test account
# Should redirect to /app/dashboard
# Should see stats cards
# Should see recent activity
```

### Test 4: Mobile View
```bash
# Open DevTools → Toggle device toolbar
# Set to iPhone or Android
# Should see hamburger menu
# Should see bottom navigation
```

## 🐛 Error Detection

### Common Errors to Look For:

1. **"Cannot find module"**
   - Missing dependency: `npm install`
   - Wrong import path: Check file exists

2. **"Hydration error"**
   - Server/client mismatch
   - Check for `use client` directives

3. **"Supabase error"**
   - Check `.env.local` exists
   - Verify credentials are correct

4. **"Image not found"**
   - Check file exists in `/public`
   - Verify image path

5. **"Table does not exist"**
   - Run database migrations
   - Check Supabase connection

## ✅ Automated Validation Script

Create `scripts/test-imports.js`:

```javascript
const fs = require('fs');
const path = require('path');

const components = [
  'src/components/search/global-search.tsx',
  'src/components/dashboard/stats-cards.tsx',
  'src/components/dashboard/recent-activity.tsx',
  'src/components/export/export-button.tsx',
  'src/components/filters/advanced-filters.tsx',
  'src/components/notifications/notification-bell.tsx',
  'src/components/app/mobile-sidebar.tsx',
  'src/components/app/bottom-nav.tsx',
  'src/components/bulk/bulk-actions.tsx',
];

console.log('🔍 Checking component files...\n');

let allExist = true;
components.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(exists ? '✅' : '❌', file);
  if (!exists) allExist = false;
});

console.log('\n' + (allExist ? '✅ All components exist!' : '❌ Some components missing!'));

// Check required public files
const publicFiles = [
  'public/manifest.json',
  'public/janibear-logo.png',
];

console.log('\n🔍 Checking public files...\n');
publicFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(exists ? '✅' : '⚠️', file);
});

// Check migrations
const migrations = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_rls_policies.sql',
  'supabase/migrations/003_create_storage_bucket.sql',
  'supabase/migrations/004_add_org_customization.sql',
  'supabase/migrations/005_create_logo_storage_bucket.sql',
  'supabase/migrations/006_add_notifications_and_priorities.sql',
];

console.log('\n🔍 Checking migrations...\n');
migrations.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(exists ? '✅' : '⚠️', file);
});
```

Run with:
```bash
node scripts/test-imports.js
```

## 📊 Health Check Endpoints

### 1. Check Supabase Connection
```typescript
// In browser console on any page:
const { createClient } = await import('/src/lib/supabase/client');
const supabase = createClient();
const { data, error } = await supabase.auth.getUser();
console.log('User:', data?.user ? '✅ Logged in' : '❌ Not logged in');
```

### 2. Check Service Worker
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length > 0 ? '✅ Registered' : '❌ Not registered');
});
```

### 3. Check PWA Manifest
```javascript
// In browser console:
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m.name))
  .catch(e => console.error('Manifest error:', e));
```

## 🎯 Testing Priority

### Critical (Must Work):
1. ✅ Authentication (login/signup)
2. ✅ Navigation (all routes)
3. ✅ Dashboard loads
4. ✅ Mobile responsive

### Important (Should Work):
1. ✅ Search functionality
2. ✅ Notifications
3. ✅ Branding customization
4. ✅ Export features

### Nice to Have:
1. ✅ Advanced filters
2. ✅ Bulk operations
3. ✅ Activity logging

---

**Use these tests to quickly validate your application!** 🚀
