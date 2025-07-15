#!/bin/bash

echo "🚀 Iniciando Projeto Aviator Crash Game"
echo "======================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js primeiro."
    exit 1
fi

# Verificar se MongoDB está rodando (opcional)
echo "📊 Verificando MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB não está rodando. Certifique-se de iniciar o MongoDB primeiro."
    echo "   Para instalar MongoDB: https://docs.mongodb.com/manual/installation/"
    echo "   Para iniciar: mongod ou brew services start mongodb/brew/mongodb-community"
fi

echo ""
echo "📦 Instalando dependências do Backend..."
cd aviator-back
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Dependências do backend já instaladas"
fi

echo ""
echo "🔧 Compilando Backend..."
npm run build

echo ""
echo "🎮 Iniciando Backend Server..."
npm run dev &
BACKEND_PID=$!

echo "Backend iniciado com PID: $BACKEND_PID"
echo "🌐 Backend rodando em: http://localhost:3001"

# Voltar para o diretório raiz
cd ..

echo ""
echo "📦 Instalando dependências do Frontend..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Dependências do frontend já instaladas"
fi

echo ""
echo "🎨 Iniciando Frontend..."
echo "🌐 Frontend será aberto em: http://localhost:3000"
echo ""
echo "⭐ Projeto Aviator iniciado com sucesso!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API:      http://localhost:3001/api"
echo ""
echo "Para parar o projeto, pressione Ctrl+C"

# Iniciar frontend
npm start

# Cleanup quando o script for interrompido
trap "echo '🛑 Parando servidores...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM