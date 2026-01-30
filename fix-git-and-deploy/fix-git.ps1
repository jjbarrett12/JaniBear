# Fix broken git: remove .git, init, add remote
# Run from JaniBear folder: .\fix-git-and-deploy\fix-git.ps1

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

if (Test-Path ".git") {
    Write-Host "Removing existing .git folder..."
    Remove-Item -Recurse -Force .git
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Could not remove .git. Close Cursor/IDE and try again, or delete .git manually."
        exit 1
    }
}

Write-Host "Running git init..."
git init
if ($LASTEXITCODE -ne 0) { Write-Host "git init failed"; exit 1 }

Write-Host "Adding remote origin..."
git remote add origin https://github.com/jjbarrett12/JaniBear.git
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote may already exist. Checking..."
    git remote -v
}

Write-Host ""
Write-Host "Git is fixed. Next: add, commit, and push:"
Write-Host "  .\fix-git-and-deploy\push-and-deploy.ps1"
Write-Host "Or manually:"
Write-Host "  git add ."
Write-Host "  git commit -m `"Initial commit`""
Write-Host "  git branch -M main"
Write-Host "  git push -u origin main"
Write-Host ""
