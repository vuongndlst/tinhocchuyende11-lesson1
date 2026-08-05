@echo off
chcp 65001 >nul
where node >nul 2>nul
if errorlevel 1 (
  echo Chua tim thay Node.js.
  echo Hay cai Node.js 20 tro len, sau do chay lai tep nay.
  pause
  exit /b 1
)
echo Dang khoi dong OS QUEST 11 tai http://localhost:5173
start "" http://localhost:5173
node scripts/dev-server.mjs
pause
