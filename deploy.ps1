# Deploy JaniBear to Vercel production
# Run from project folder or double-click this file.

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = Get-Location }

Set-Location $ProjectRoot
Write-Host "Deploying from: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

npx vercel --prod

Write-Host ""
Write-Host "Done. Press any key to close."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
