#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════════════════════════
# ANTIGRAVITY TITAN — Continuador Inteligente V2
# Detecta o que já está instalado e continua de onde parou
# ═══════════════════════════════════════════════════════════════════

set -e
clear

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   🚀 ANTIGRAVITY TITAN — Smart Continuator V2${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

# ─── FASE 0: Termux Base ─────────────────────────────────
echo -e "${YELLOW}[SCAN] Verificando ambiente Termux...${NC}"

if ! command -v pkg &>/dev/null; then
    echo -e "${RED}[ERRO] Isso não é o Termux! Execute dentro do app Termux.${NC}"
    exit 1
fi

# ─── FASE 1: Dependências Base do Termux ──────────────────
echo -e "${YELLOW}[1/6] Checando dependências base...${NC}"
NEED_INSTALL=""

for dep in proot-distro wget curl nodejs-lts; do
    if ! command -v "$dep" &>/dev/null && ! dpkg -l "$dep" &>/dev/null 2>&1; then
        NEED_INSTALL="$NEED_INSTALL $dep"
    fi
done

# qemu é especial - apenas necessário para x86_64
if ! command -v qemu-x86_64 &>/dev/null; then
    NEED_INSTALL="$NEED_INSTALL qemu-user-x86-64"
fi

if [ -n "$NEED_INSTALL" ]; then
    echo -e "${CYAN}Instalando:${NC} $NEED_INSTALL"
    export DEBIAN_FRONTEND=noninteractive
    pkg update -y -o Dpkg::Options::="--force-confold" 2>/dev/null || true
    pkg install $NEED_INSTALL -y -o Dpkg::Options::="--force-confold"
else
    echo -e "${GREEN}✅ Todas as dependências base já instaladas!${NC}"
fi

# ─── FASE 2: Distro Ubuntu x64 ──────────────────────────
echo ""
echo -e "${YELLOW}[2/6] Checando distro Ubuntu x64 (antigravity-os)...${NC}"

DISTRO_EXISTS=false
if proot-distro list 2>/dev/null | grep -q "antigravity-os"; then
    DISTRO_EXISTS=true
    echo -e "${GREEN}✅ Distro antigravity-os já existe!${NC}"
fi

if [ "$DISTRO_EXISTS" = false ]; then
    echo -e "${CYAN}Instalando Ubuntu x64 via QEMU emulation...${NC}"
    echo -e "${YELLOW}⚠️  Isso baixa ~50MB e pode demorar 2-5 min.${NC}"
    DISTRO_ARCH=x86_64 proot-distro install ubuntu --override-alias antigravity-os
fi

# ─── FASE 3: Code-Server dentro do Ubuntu ────────────────
echo ""
echo -e "${YELLOW}[3/6] Verificando code-server no container...${NC}"

CS_INSTALLED=false
if proot-distro login antigravity-os -- which code-server &>/dev/null 2>&1; then
    CS_INSTALLED=true
    echo -e "${GREEN}✅ code-server já está instalado!${NC}"
fi

if [ "$CS_INSTALLED" = false ]; then
    echo -e "${CYAN}Instalando code-server dentro do Ubuntu x64...${NC}"
    echo -e "${YELLOW}⚠️  Emulação QEMU faz isso demorar 5-15 min. Deixe a tela ligada!${NC}"
    
    # Injeta script de setup
    cat << 'INNER_EOF' > $PREFIX/var/lib/proot-distro/installed-rootfs/antigravity-os/root/install_ide.sh
#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
echo ">>> Atualizando pacotes Ubuntu..."
apt update -qq && apt install -y -qq curl wget git build-essential ca-certificates
echo ">>> Baixando code-server (VS Code IDE)..."
curl -fsSL https://code-server.dev/install.sh | sh
echo ">>> Aplicando patches de performance para QEMU..."
# Aumenta timeouts para compensar a emulação
if [ -f /usr/lib/code-server/out/node/wrapper.js ]; then
    sed -i 's/10000/60000/g' /usr/lib/code-server/out/node/wrapper.js
fi
echo ">>> Configurando acesso sem senha..."
mkdir -p ~/.config/code-server
cat > ~/.config/code-server/config.yaml << CONF
bind-addr: 0.0.0.0:8080
auth: none
cert: false
CONF
echo ">>> Instalando Node.js 20 LTS dentro do container..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo ">>> code-server instalado com sucesso!"
INNER_EOF
    
    chmod +x $PREFIX/var/lib/proot-distro/installed-rootfs/antigravity-os/root/install_ide.sh
    proot-distro login antigravity-os -- /root/install_ide.sh
fi

# ─── FASE 4: Bridge Server Nativo (Termux Layer) ─────────
echo ""
echo -e "${YELLOW}[4/6] Configurando Bridge Server nativo no Termux...${NC}"

BRIDGE_DIR="$HOME/antigravity-mobile"

if [ ! -d "$BRIDGE_DIR" ]; then
    mkdir -p "$BRIDGE_DIR/public"
fi

# Baixa os arquivos do Bridge se não existem
if [ ! -f "$BRIDGE_DIR/package.json" ]; then
    echo -e "${CYAN}Baixando Bridge Server...${NC}"
    
    REPO_RAW="https://raw.githubusercontent.com/BielWeed/antigravity-mobile/main"
    
    curl -fsSL "$REPO_RAW/public/downloads/bridge-server.js" -o "$BRIDGE_DIR/bridge-server.js" || true
    curl -fsSL "$REPO_RAW/public/downloads/package.json" -o "$BRIDGE_DIR/package.json" || true
    curl -fsSL "$REPO_RAW/public/downloads/omni_cast.js" -o "$BRIDGE_DIR/omni_cast.js" || true
    
    # Se o download falhou, cria um bridge mínimo local
    if [ ! -f "$BRIDGE_DIR/bridge-server.js" ] || [ ! -s "$BRIDGE_DIR/bridge-server.js" ]; then
        echo -e "${YELLOW}Download remoto falhou. Criando Bridge local mínimo...${NC}"
        cat << 'BRIDGE_EOF' > "$BRIDGE_DIR/bridge-server.js"
require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3777;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let sseClients = new Set();
let broadcastBuffer = [];

app.get('/api/status', (req, res) => res.json({ ok: true, httpsPort: 3777, mode: 'termux-native' }));

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    sseClients.add(res);
    const hb = setInterval(() => res.write(':\n\n'), 15000);
    req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
});

app.get('/api/sync', (req, res) => {
    const lastId = parseInt(req.query.lastId || '0', 10);
    res.json({ ok: true, items: broadcastBuffer.filter(p => p.id > lastId) });
});

app.post('/api/agent-reply', (req, res) => {
    const { text, type } = req.body;
    const payloadObj = { id: Date.now(), ...req.body, type: type || 'message' };
    broadcastBuffer.push(payloadObj);
    if (broadcastBuffer.length > 50) broadcastBuffer.shift();
    const payloadStr = JSON.stringify(payloadObj);
    sseClients.forEach(c => { try { c.write(`event: message\ndata: ${payloadStr}\n\n`); } catch(e) { sseClients.delete(c); } });
    res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'sua_chave_aqui') {
        return res.status(500).json({ error: 'Configure GEMINI_API_KEY no arquivo .env' });
    }
    
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Você é o Antigravity, um assistente de programação ágil. " + prompt);
        const textResponse = result.response.text();
        
        const payloadObj = { id: Date.now(), text: textResponse, type: 'message', source: 'termux-native' };
        broadcastBuffer.push(payloadObj);
        if (broadcastBuffer.length > 50) broadcastBuffer.shift();
        const payloadStr = JSON.stringify(payloadObj);
        sseClients.forEach(c => { try { c.write(`event: message\ndata: ${payloadStr}\n\n`); } catch(e) { sseClients.delete(c); } });
        
        return res.json({ ok: true, autonomous: true });
    } catch(e) {
        return res.status(500).json({ error: 'Erro IA: ' + e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔═════════════════════════════════════════════════════════╗');
    console.log('║   🚀 ANTIGRAVITY MOBILE — Termux Bridge Ativo         ║');
    console.log('╠═════════════════════════════════════════════════════════╣');
    console.log(`║  Acesse: http://localhost:${PORT}                        ║`);
    console.log('╚═════════════════════════════════════════════════════════╝');
    console.log('');
});
BRIDGE_EOF

        cat << 'PKG_EOF' > "$BRIDGE_DIR/package.json"
{
  "name": "antigravity-termux-bridge",
  "version": "1.0.0",
  "main": "bridge-server.js",
  "scripts": { "start": "node bridge-server.js" },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "cors": "^2.8.5",
    "dotenv": "^17.4.1",
    "express": "^4.21.0"
  }
}
PKG_EOF
    fi
fi

# ─── FASE 5: .env e API Key ──────────────────────────────
echo ""
echo -e "${YELLOW}[5/6] Verificando .env...${NC}"

if [ ! -f "$BRIDGE_DIR/.env" ]; then
    echo -e "${CYAN}Criando .env template...${NC}"
    cat << 'ENV_EOF' > "$BRIDGE_DIR/.env"
# Chave Neural do Gemini (Google AI Studio)
# Crie sua chave gratuita em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=sua_chave_aqui
ENV_EOF
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env com sua GEMINI_API_KEY!${NC}"
    echo -e "   Comando: ${GREEN}nano ~/antigravity-mobile/.env${NC}"
else
    echo -e "${GREEN}✅ .env já existe!${NC}"
fi

# ─── FASE 6: npm install no Bridge ──────────────────────
echo ""
echo -e "${YELLOW}[6/6] Instalando dependências Node.js do Bridge...${NC}"

cd "$BRIDGE_DIR"
if [ ! -d "node_modules" ]; then
    npm install --production 2>&1 | tail -5
else
    echo -e "${GREEN}✅ node_modules já existe!${NC}"
fi

# ─── PRONTO ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ TITAN CONTINUAÇÃO COMPLETA!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Agora você tem ${CYAN}2 opções${NC} para usar o Antigravity:"
echo ""
echo -e "${CYAN}  OPÇÃO A — IDE Completa (VS Code via code-server):${NC}"
echo -e "    ${GREEN}proot-distro login antigravity-os -- code-server${NC}"
echo -e "    Depois abra o Chrome: ${YELLOW}http://localhost:8080${NC}"
echo ""
echo -e "${CYAN}  OPÇÃO B — Bridge + IA Nativa (Mais leve):${NC}"
echo -e "    ${GREEN}cd ~/antigravity-mobile && node bridge-server.js${NC}"
echo -e "    Depois abra o app Antigravity Mobile ou Chrome: ${YELLOW}http://localhost:3777${NC}"
echo ""
echo -e "${YELLOW}DICA: Para configurar a chave da IA:${NC}"
echo -e "    ${GREEN}nano ~/antigravity-mobile/.env${NC}"
echo ""
