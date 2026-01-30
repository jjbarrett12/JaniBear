@echo off
cd /d "C:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"

echo ============================================
echo   Update janibear.com (push to GitHub)
echo ============================================
echo.
echo Janibear.com updates from GitHub, not from
echo double-click deploy. This script pushes your
echo local changes to GitHub so Vercel rebuilds.
echo.

echo Staging all changes...
git add -A

echo.
echo Checking status...
git status

echo.
echo Committing...
git commit -m "Update janibear.com - %date% %time%" 2>nul
if errorlevel 1 (
    echo No changes to commit, or commit failed.
    echo If you have no changes, janibear.com is already up to date.
    goto :push
)
echo Commit created.

:push
echo.
echo Making sure we're on main (rename master if needed)...
git branch -M main

echo.
echo Pushing to GitHub (main)...
git push -u origin main

if errorlevel 1 (
    echo.
    echo Push failed. Common fixes:
    echo - Sign in: use GitHub username + Personal Access Token as password
    echo - Create token: GitHub - Settings - Developer settings - Personal access tokens
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Push complete.
echo ============================================
echo.
echo Vercel will build from GitHub in 1-3 minutes.
echo Then hard-refresh janibear.com (Ctrl+Shift+R)
echo or open in incognito to see changes.
echo.
pause
