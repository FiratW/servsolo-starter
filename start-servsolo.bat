@echo off
setlocal
REM Kill anything on :3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>nul

cd /d %~dp0
cd servsolo-starter

if not exist node_modules (
  echo Installing dependencies...
  npm install
)

node seed.js
start "Servsolo Server" cmd /c node server.js
echo Started. Open http://localhost:3000
exit /b 0
