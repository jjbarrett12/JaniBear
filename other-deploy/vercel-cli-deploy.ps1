# Deploy via Vercel CLI
# Token: set $env:VERCEL_TOKEN, or put token in project root .vercel-token (one line, no quotes), or run vercel login
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not $env:VERCEL_TOKEN) {
    $tokenFile = Join-Path $PWD ".vercel-token"
    if (Test-Path $tokenFile) {
        $raw = Get-Content $tokenFile -Raw
        if ($raw) {
            $env:VERCEL_TOKEN = $raw.Trim().TrimStart([char]0xFEFF)  # strip BOM if saved as UTF-8 in Notepad
        }
    }
}
if (-not $env:VERCEL_TOKEN) {
    Write-Host "VERCEL_TOKEN not set. Either:"
    Write-Host "  1. Create .vercel-token in project root with one line: your token (no quotes)"
    Write-Host "  2. In PowerShell run on TWO separate lines:"
    Write-Host '     $env:VERCEL_TOKEN = "vcp_xxxx"'
    Write-Host "     .\other-deploy\vercel-cli-deploy.ps1"
    Write-Host "  3. Or run: npx vercel login"
    Write-Host ""
    exit 1
}
if ($env:VERCEL_TOKEN -match "YOUR_NEW_TOKEN|your_token_here") {
    Write-Host "ERROR: You still have the placeholder. Replace with your real token:"
    Write-Host "  Vercel Dashboard -> Account Settings -> Tokens -> Create, then:"
    Write-Host '  $env:VERCEL_TOKEN = "vcp_paste_that_token_here"'
    Write-Host ""
    exit 1
}
# Pass token explicitly so CLI definitely gets it (avoids env not reaching npx on some setups)
npx vercel --prod --token $env:VERCEL_TOKEN
Write-Host "`nDone. Press any key to close."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
