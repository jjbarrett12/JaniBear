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
let publicAllExist = true;
publicFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(exists ? '✅' : '⚠️', file);
  if (!exists && file.includes('logo')) publicAllExist = false;
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

// Check icons
const icons = [
  'public/icon-192.png',
  'public/icon-512.png',
];

console.log('\n🔍 Checking PWA icons...\n');
let iconsExist = true;
icons.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(exists ? '✅' : '⚠️', file, exists ? '' : '(Create these for PWA)');
  if (!exists) iconsExist = false;
});

console.log('\n📊 Summary:');
console.log('Components:', allExist ? '✅ All exist' : '❌ Missing files');
console.log('Public files:', publicAllExist ? '✅ All exist' : '⚠️ Some missing');
console.log('Icons:', iconsExist ? '✅ All exist' : '⚠️ Need to create (see ICON_SETUP.md)');
console.log('\n✨ Ready to test!' + (iconsExist ? '' : '\n💡 Create icons first (see ICON_SETUP.md)'));
