@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js 22.13 or newer first.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
call npm.cmd run build
if errorlevel 1 goto failed
echo Open http://localhost:3000 in your browser.
call npm.cmd run start -- --hostname 127.0.0.1
if errorlevel 1 goto failed
exit /b 0
:failed
echo Startup failed. Review the message above.
pause
exit /b 1
