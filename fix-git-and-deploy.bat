@echo off
cd /d "C:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"

echo Fixing Git author for Vercel...
git config user.email "jjbarrett12@gmail.com"
git config user.name "Jason"

echo.
echo Updating last commit author...
git commit --amend --reset-author --no-edit

echo.
echo Deploying to Vercel...
call npx vercel --prod

echo.
pause
