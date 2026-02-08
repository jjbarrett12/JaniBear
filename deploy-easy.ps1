# Easiest way to deploy JaniBear and see changes live
# Run from JaniBear folder: .\deploy-easy.ps1
# Or double-click deploy-easy.bat

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Run this from the JaniBear project folder." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  JaniBear - Deploy to see changes" -ForegroundColor Cyan
Write-Host "  ================================" -ForegroundColor Cyan
Write-Host ""

# Stage everything
git add -A
$status = git status --short

if ($status) {
    Write-Host "  Committing changes..." -ForegroundColor Yellow
    $msg = "Deploy: " + (Get-Date -Format "yyyy-MM-dd HH:mm")
    git commit -m $msg
    if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
    Write-Host "  No file changes. Push anyway to trigger a rebuild? (y/n): " -NoNewline -ForegroundColor Yellow
    $ans = Read-Host
    if ($ans -ne "y" -and $ans -ne "Y") {
        Write-Host "  Skipped. Run 'npm run dev' to see changes locally at http://localhost:3001" -ForegroundColor Gray
        exit 0
    }
}

Write-Host "  Pushing to GitHub (main)..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  Push failed. If you see 'Permission denied' or 'Authentication failed':" -ForegroundColor Red
    Write-Host "  - Use a GitHub Personal Access Token as your password when prompted" -ForegroundColor Gray
    Write-Host "  - Or: GitHub -> Settings -> Developer settings -> Personal access tokens" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "  Done. Vercel will build and deploy in 1-2 minutes." -ForegroundColor Green
Write-Host "  Live site: https://janibear.com" -ForegroundColor Cyan
Write-Host ""

# Optional: open live URL if .deploy-url exists
$urlFile = ".deploy-url"
if (Test-Path $urlFile) {
    $url = (Get-Content $urlFile -Raw).Trim()
    if ($url -match "^\s*https?://") {
        Write-Host "  Opening your live site in 3 seconds..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        Start-Process $url
    }
} else {
    Write-Host "  Tip: Create  .deploy-url  with  https://janibear.com  on one line to open it after deploy." -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Local:  npm run dev  then open http://localhost:3001" -ForegroundColor Gray
Write-Host "  Live:   https://janibear.com  (after build finishes)" -ForegroundColor Gray
Write-Host ""
