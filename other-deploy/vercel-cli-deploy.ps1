# Deploy via Vercel CLI (requires: npx vercel login)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
npx vercel --prod
Write-Host "`nDone. Press any key to close."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
