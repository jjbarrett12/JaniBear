@echo off
cd /d "%~dp0\.."
echo Deploying via Vercel CLI (requires: npx vercel login)...
call npx vercel --prod
echo.
pause
