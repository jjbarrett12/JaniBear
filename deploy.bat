@echo off
cd /d "C:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
echo Deploying JaniBear to Vercel...
call npx vercel --prod
echo.
pause
