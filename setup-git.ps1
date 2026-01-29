# Run this from the JaniBear folder (right-click JaniBear folder -> Open in Terminal, then: .\setup-git.ps1)
# Or in PowerShell: cd "c:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear" then .\setup-git.ps1

Write-Host "Current folder: $(Get-Location)"
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Run this script from the JaniBear project folder."
    exit 1
}

if (Test-Path ".git") {
    Write-Host "Removing old .git folder..."
    Remove-Item -Recurse -Force .git
}

Write-Host "Running git init..."
git init
if ($LASTEXITCODE -ne 0) { Write-Host "git init failed"; exit 1 }

Write-Host "Adding remote origin..."
git remote add origin https://github.com/jjbarrett12/JaniBear.git
if ($LASTEXITCODE -ne 0) { Write-Host "git remote add failed (maybe already added?)"; git remote -v }

Write-Host ""
Write-Host "Done. Now run these three commands:"
Write-Host "  git add ."
Write-Host "  git commit -m `"Initial commit`""
Write-Host "  git branch -M main"
Write-Host "  git push -u origin main"
Write-Host ""
