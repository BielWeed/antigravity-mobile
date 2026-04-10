#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════════════════════
# ANTIGRAVITY NATIVE — Instalador ARM64 Nativo (SEM QEMU!)
# 10x mais rápido que o Titan. Funciona direto no Ubuntu ARM.
# ═══════════════════════════════════════════════════════════════

set -e
clear

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ⚡ ANTIGRAVITY NATIVE — ARM64 Installer${NC}"
echo -e "${CYAN}   Sem emulação QEMU! 10x mais rápido!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

# ─── FASE 1: Pacotes Termux ─────────────────────────────
echo -e "${YELLOW}[1/5] Instalando base Termux...${NC}"
export DEBIAN_FRONTEND=noninteractive
pkg update -y -o Dpkg::Options::="--force-confold" 2>/dev/null || true
pkg install proot-distro nodejs-lts wget curl git -y -o Dpkg::Options::="--force-confold"

# ─── FASE 2: Ubuntu ARM64 (Nativo - SEM QEMU!) ──────────
echo ""
echo -e "${YELLOW}[2/5] Instalando Ubuntu ARM64 nativo...${NC}"

if proot-distro list 2>/dev/null | grep -q "antigravity-native"; then
    echo -e "${GREEN}✅ Distro antigravity-native já existe!${NC}"
else
    echo -e "${CYAN}Baixando Ubuntu ARM64 (~40MB)...${NC}"
    proot-distro install ubuntu --override-alias antigravity-native
fi

# ─── FASE 3: code-server ARM64 nativo ────────────────────
echo ""
echo -e "${YELLOW}[3/5] Instalando code-server ARM64 nativo...${NC}"

cat << 'SETUP_EOF' > $PREFIX/var/lib/proot-distro/installed-rootfs/antigravity-native/root/setup.sh
#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

# Verifica se code-server já existe
if command -v code-server &>/dev/null; then
    echo "✅ code-server já instalado!"
    code-server --version
    exit 0
fi

echo ">>> Atualizando Ubuntu ARM64..."
apt update -qq && apt upgrade -y -qq

echo ">>> Instalando dependências..."
apt install -y -qq curl wget git build-essential ca-certificates python3 nodejs npm

echo ">>> Instalando code-server ARM64 nativo..."
curl -fsSL https://code-server.dev/install.sh | sh

echo ">>> Configurando acesso..."
mkdir -p ~/.config/code-server
cat > ~/.config/code-server/config.yaml << CONF
bind-addr: 0.0.0.0:8080
auth: none
cert: false
CONF

echo ">>> Instalando extensões essenciais..."
code-server --install-extension ms-ceintl.vscode-language-pack-pt-BR 2>/dev/null || true

echo "✅ code-server ARM64 instalado com sucesso!"
code-server --version
SETUP_EOF

chmod +x $PREFIX/var/lib/proot-distro/installed-rootfs/antigravity-native/root/setup.sh
proot-distro login antigravity-native -- /root/setup.sh

# ─── FASE 4: Bridge Server no Termux ─────────────────────
echo ""
echo -e "${YELLOW}[4/5] Configurando Bridge Server nativo...${NC}"

BRIDGE_DIR="$HOME/antigravity-mobile"
mkdir -p "$BRIDGE_DIR/public"

if [ ! -f "$BRIDGE_DIR/package.json" ]; then
    # Tenta baixar do GitHub primeiro
    REPO_RAW="https://raw.githubusercontent.com/BielWeed/antigravity-mobile/main"
    curl -fsSL "$REPO_RAW/public/downloads/bridge-server.js" -o "$BRIDGE_DIR/bridge-server.js" 2>/dev/null || true
    curl -fsSL "$REPO_RAW/public/downloads/package.json" -o "$BRIDGE_DIR/package.json" 2>/dev/null || true
    
    # Fallback: cria mínimo local
    if [ ! -s "$BRIDGE_DIR/package.json" ]; then
        cat << 'PKG' > "$BRIDGE_DIR/package.json"
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
PKG
    fi
fi

if [ ! -f "$BRIDGE_DIR/.env" ]; then
    cat << 'ENV' > "$BRIDGE_DIR/.env"
# Crie sua chave em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=sua_chave_aqui
ENV
fi

cd "$BRIDGE_DIR"
if [ ! -d "node_modules" ]; then
    echo -e "${CYAN}npm install...${NC}"
    npm install --production 2>&1 | tail -3
fi

# ─── FASE 5: Script de Start Permanente ──────────────────
echo ""
echo -e "${YELLOW}[5/5] Criando atalho de start...${NC}"

cat << 'START' > "$HOME/antigravity"
#!/data/data/com.termux/files/usr/bin/bash
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════${NC}"
echo -e "${GREEN}   ⚡ ANTIGRAVITY ARM64 MODE${NC}"
echo -e "${CYAN}═══════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}[1]${NC} IDE (code-server → localhost:8080)"
echo -e "  ${CYAN}[2]${NC} Bridge IA (Gemini → localhost:3777)"
echo -e "  ${CYAN}[3]${NC} Ambos em paralelo"
echo ""
read -p ">>> " c

case "$c" in
    1) proot-distro login antigravity-native -- code-server --disable-telemetry ;;
    2) cd ~/antigravity-mobile && node bridge-server.js ;;
    3)
        cd ~/antigravity-mobile && node bridge-server.js &
        proot-distro login antigravity-native -- code-server --disable-telemetry
        ;;
    *) echo "Saindo." ;;
esac
START
chmod +x "$HOME/antigravity"

# ─── FIM ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ ANTIGRAVITY NATIVE — INSTALAÇÃO COMPLETA!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Para iniciar a qualquer momento, digite:"
echo -e "   ${BOLD}${GREEN}~/antigravity${NC}"
echo ""
echo -e "Ou diretamente:"
echo -e "   IDE:    ${GREEN}proot-distro login antigravity-native -- code-server${NC}"
echo -e "   Bridge: ${GREEN}cd ~/antigravity-mobile && node bridge-server.js${NC}"
echo ""
echo -e "${YELLOW}⚠️  Não esqueça de configurar sua chave Gemini:${NC}"
echo -e "   ${GREEN}nano ~/antigravity-mobile/.env${NC}"
echo ""
echo -e "${CYAN}Deseja iniciar a IDE agora? [s/n]${NC}"
read -p ">>> " start_now

if [ "$start_now" = "s" ] || [ "$start_now" = "S" ]; then
    echo -e "${GREEN}Subindo code-server...${NC}"
    echo -e "Abra o Chrome: ${YELLOW}http://localhost:8080${NC}"
    proot-distro login antigravity-native -- code-server --disable-telemetry --disable-update-check
fi
