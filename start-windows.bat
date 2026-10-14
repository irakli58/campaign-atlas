@echo off
rem Campaign Atlas: double-click to start. It opens in your web browser; close this window to stop it.
title Campaign Atlas
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Campaign Atlas needs Node.js, which is free.
  echo   Your browser will open its download page: install the version marked LTS,
  echo   then double-click this file again.
  echo.
  start "" https://nodejs.org/
  pause
  exit /b 1
)
node server.js --open
echo.
pause
