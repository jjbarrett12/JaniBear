#!/usr/bin/env node
/**
 * Deploy local changes to janibear.com (Vercel).
 * Runs: git add -A, commit (if changes), push origin main.
 * Vercel auto-builds on push. Use this after "npm run dev" when you're ready to go live.
 */
const { execSync } = require('child_process');
const readline = require('readline');

function run(cmd, options = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: options.silent ? 'pipe' : 'inherit', ...options });
}

function runQuiet(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n  JaniBear – Deploy to janibear.com\n  ======================================\n');

  run('git add -A');
  const status = runQuiet('git status --short')?.trim() || '';

  if (status) {
    console.log('  Committing changes...');
    const msg = 'Deploy: ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
    run('git commit -m ' + JSON.stringify(msg));
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = await new Promise((resolve) => {
      rl.question('  No file changes. Push anyway to trigger a rebuild? (y/n): ', resolve);
    });
    rl.close();
    if (ans !== 'y' && ans !== 'Y') {
      console.log('  Skipped. Run "npm run dev" for local only; run "npm run deploy" when ready to update janibear.com.');
      process.exit(0);
    }
  }

  console.log('  Pulling latest from origin main (rebase)...');
  try {
    run('git pull --rebase origin main');
  } catch (e) {
    console.error('\n  Pull failed. Fix any conflicts, then run: git rebase --continue, then npm run deploy again.');
    console.error('  Or to abort: git rebase --abort');
    process.exit(1);
  }

  console.log('  Pushing to origin main...');
  try {
    run('git push origin main');
  } catch (e) {
    console.error('\n  Push failed. If you see auth errors, use a GitHub Personal Access Token as password.');
    process.exit(1);
  }

  console.log('\n  Done. Vercel will build and deploy in 1–2 minutes.');
  console.log('  Live site: https://janibear.com\n');
  console.log('  Local:  npm run dev  → http://localhost:3001');
  console.log('  Live:   https://janibear.com  (after build finishes)\n');
}

main();
