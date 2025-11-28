@echo off
echo ========================================
echo   STARTX Messenger Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install @google/generative-ai
echo.

echo Step 2: Running database migration...
call npm run migrate:messenger
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Your messenger is ready to use!
echo.
echo Next steps:
echo 1. Start the API server: npm run api
echo 2. Start the dev server: npm run dev
echo 3. Open http://localhost:5173/message
echo.
pause
