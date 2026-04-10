#!/data/data/com.termux/files/usr/bin/bash
# ═══════════════════════════════════════════════════════════════
# ANTIGRAVITY TITAN — Quick Start
# Sobe a IDE e/ou o Bridge Server rapidamente
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   🚀 ANTIGRAVITY — Quick Start${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}[1]${NC} IDE Completa (code-server no Ubuntu x64)"
echo -e "  ${CYAN}[2]${NC} Bridge + IA Nativa (Node.js leve)"
echo -e "  ${CYAN}[3]${NC} Ambos (IDE + Bridge em paralelo)"
echo ""
read -p "Escolha [1/2/3]: " choice

case "$choice" in
    1)
        echo -e "${GREEN}Subindo code-server...${NC}"
        echo -e "Acesse: ${YELLOW}http://localhost:8080${NC}"
        proot-distro login antigravity-os --bind /dev/null:/proc/sys/kernel/cap_last_cap -- code-server --disable-telemetry --disable-update-check
        ;;
    2)
        echo -e "${GREEN}Subindo Bridge Server...${NC}"
        echo -e "Acesse: ${YELLOW}http://localhost:3777${NC}"
        cd ~/antigravity-mobile && node bridge-server.js
        ;;
    3)
        echo -e "${GREEN}Subindo ambos em paralelo...${NC}"
        echo -e "IDE: ${YELLOW}http://localhost:8080${NC}"
        echo -e "Bridge: ${YELLOW}http://localhost:3777${NC}"
        
        # Bridge em background
        cd ~/antigravity-mobile && node bridge-server.js &
        BRIDGE_PID=$!
        echo -e "${GREEN}Bridge PID: $BRIDGE_PID${NC}"
        
        # IDE em foreground
        proot-distro login antigravity-os --bind /dev/null:/proc/sys/kernel/cap_last_cap -- code-server --disable-telemetry --disable-update-check
        
        # Cleanup
        kill $BRIDGE_PID 2>/dev/null
        ;;
    *)
        echo -e "${YELLOW}Opção inválida. Saindo.${NC}"
        ;;
esac
