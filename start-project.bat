@echo off
echo 🚀 Iniciando Projeto Aviator Crash Game
echo =======================================

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Por favor, instale Node.js primeiro.
    pause
    exit /b 1
)

echo.
echo 📦 Instalando dependências do Backend...
cd aviator-back
if not exist "node_modules" (
    call npm install
) else (
    echo ✅ Dependências do backend já instaladas
)

echo.
echo 🔧 Compilando Backend...
call npm run build

echo.
echo 🎮 Iniciando Backend Server...
start "Aviator Backend" cmd /k "npm run dev"

echo Backend iniciado em nova janela
echo 🌐 Backend rodando em: http://localhost:3001

REM Voltar para o diretório raiz
cd ..

echo.
echo 📦 Instalando dependências do Frontend...
if not exist "node_modules" (
    call npm install
) else (
    echo ✅ Dependências do frontend já instaladas
)

echo.
echo 🎨 Iniciando Frontend...
echo 🌐 Frontend será aberto em: http://localhost:3000
echo.
echo ⭐ Projeto Aviator iniciado com sucesso!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo    API:      http://localhost:3001/api
echo.

REM Iniciar frontend
call npm start

pause