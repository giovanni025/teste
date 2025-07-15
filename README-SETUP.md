# 🚀 Aviator Crash Game - Guia de Instalação Completo

## 📋 Pré-requisitos

### Obrigatórios:
- **Node.js** (versão 16 ou superior) - [Download](https://nodejs.org/)
- **npm** (vem com Node.js)

### Recomendados:
- **MongoDB** (local ou MongoDB Atlas) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

## 🛠️ Instalação Rápida

### Opção 1: Script Automático (Recomendado)

**Linux/Mac:**
```bash
chmod +x start-project.sh
./start-project.sh
```

**Windows:**
```cmd
start-project.bat
```

### Opção 2: Instalação Manual

1. **Instalar dependências do Backend:**
```bash
cd aviator-back
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
# O arquivo .env já foi criado automaticamente
# Edite aviator-back/.env se necessário
```

3. **Iniciar Backend:**
```bash
# Em aviator-back/
npm run dev
```

4. **Instalar dependências do Frontend:**
```bash
# Voltar para raiz do projeto
cd ..
npm install
```

5. **Iniciar Frontend:**
```bash
npm start
```

## 🗄️ Configuração do Banco de Dados

### MongoDB Local:
```bash
# Instalar MongoDB
# Ubuntu/Debian:
sudo apt-get install mongodb

# macOS:
brew install mongodb/brew/mongodb-community

# Iniciar MongoDB
mongod
```

### MongoDB Atlas (Cloud - Recomendado):
1. Criar conta em [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Criar cluster gratuito
3. Obter string de conexão
4. Editar `aviator-back/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aviator-game
```

## 🌐 URLs do Projeto

Após inicialização:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## 🎮 Como Jogar

1. Abra http://localhost:3000
2. O jogo funciona em modo demo (sem necessidade de login)
3. Faça apostas durante a fase de apostas (5 segundos)
4. Observe o multiplicador crescer
5. Faça cash out antes do crash!

## 🔧 Configurações Avançadas

### Variáveis de Ambiente (aviator-back/.env):
```env
PORT=3001                    # Porta do servidor
MIN_BET=1                    # Aposta mínima
MAX_BET=1000                 # Aposta máxima
GAME_DURATION=5000           # Duração da fase de apostas (ms)
CRASH_PROBABILITY=0.03       # Probabilidade de crash (house edge)
```

### Variáveis de Ambiente (frontend .env):
```env
REACT_APP_API_URL=http://localhost:3001  # URL do backend
```

## 🚨 Solução de Problemas

### Erro: "EADDRINUSE"
```bash
# Matar processos na porta 3000 ou 3001
npx kill-port 3000
npx kill-port 3001
```

### Erro: MongoDB Connection
```bash
# Verificar se MongoDB está rodando
ps aux | grep mongod

# Iniciar MongoDB
mongod
# ou
brew services start mongodb/brew/mongodb-community
```

### Erro: "Module not found"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Para o backend também
cd aviator-back
rm -rf node_modules package-lock.json
npm install
```

## 📁 Estrutura do Projeto

```
aviator-crash-game/
├── aviator-back/           # Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── config/         # Configurações
│   │   ├── models/         # Modelos do banco
│   │   ├── services/       # Lógica de negócio
│   │   ├── routes/         # Rotas da API
│   │   └── server.ts       # Servidor principal
│   ├── .env               # Variáveis de ambiente
│   └── package.json
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # Componentes React
│   ├── context.tsx        # Context API
│   └── app.tsx           # App principal
├── .env                  # Variáveis do frontend
└── package.json
```

## 🎯 Recursos Implementados

- ✅ Jogo crash em tempo real
- ✅ Sistema provably fair
- ✅ Apostas duplas (f/s)
- ✅ Auto-cashout
- ✅ Histórico de jogos
- ✅ Sistema de usuários (opcional)
- ✅ Modo demo
- ✅ Responsivo mobile
- ✅ WebSocket real-time

## 📞 Suporte

Para dúvidas ou problemas:
- 🎮 Discord: `cashblaze127`
- 📱 Telegram: @cashblaze127
- 💼 LinkedIn: [Keyvel Bitcoin Solana](https://www.linkedin.com/in/keyvel-bitcoin-solana)

---

**Divirta-se jogando! 🎰✨**