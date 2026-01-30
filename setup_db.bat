@echo off
echo --- Generating Clients (JS Config Mode) ---
call npx prisma generate --config prisma-users.config.js
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

call npx prisma generate --config prisma-academic.config.js
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

call npx prisma generate --config prisma-profiles.config.js
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo --- Pushing DBs (JS Config Mode) ---
call npx prisma db push --config prisma-users.config.js --accept-data-loss
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

call npx prisma db push --config prisma-academic.config.js --accept-data-loss
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

call npx prisma db push --config prisma-profiles.config.js --accept-data-loss
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo Success!
