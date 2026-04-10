@echo off
chcp 65001 >nul
cls
color 0B

echo.
echo  ===== ANTIGRAVITY MOBILE - Bridge Server =====
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [SETUP] Instalando dependencias...
    npm install --production
    echo.
)

echo [START] Subindo servidor...
echo.
node bridge-server.js

pause