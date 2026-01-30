# Push all changes and deploy (Vercel auto-deploys from GitHub)
# Run from JaniBear folder: .\fix-git-and-deploy\push-and-deploy.ps1

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    $projectRoot = $PSScriptRoot
    while (-not (Test-Path (Join-Path $projectRoot "package.json")) -and $projectRoot) {
        $projectRoot = Split-Path -Parent $projectRoot
    }
}
if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    Write-Host "ERROR: Run this from the JaniBear project folder (or from fix-git-and-deploy)."
    exit 1
}

Set-Location $projectRoot

Write-Host "Project folder: $projectRoot"
Write-Host ""

Write-Host "Adding all changes..."
git add .
$status = git status --short
if (-not $status) {
    Write-Host "Nothing to commit (working tree clean)."
    Write-Host "To trigger a redeploy, run: git push origin main"
    exit 0
}

Write-Host "Committing..."
$msg = "Update: " + (Get-Date -Format "yyyy-MM-dd HH:mm")
git commit -m $msg
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Pushing to origin main..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. If you see 'Permission denied' or 'Authentication failed':"
    Write-Host "  Use a GitHub Personal Access Token as password when prompted"
    Write-Host "  GitHub -> Settings -> Developer settings -> Personal access tokens"
    exit 1
}

Write-Host ""
Write-Host "Done. Vercel will auto-deploy. Check your Vercel dashboard in 1-2 minutes."
