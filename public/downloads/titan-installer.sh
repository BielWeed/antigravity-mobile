#!/data/data/com.termux/files/usr/bin/bash

clear
echo "================================================="
echo "   ANTIGRAVITY TITAN INSTALLER (x64 EMULATION)   "
echo "================================================="
echo "[1/4] Instalando Base Level (Proot & QEMU x86_64)..."
export DEBIAN_FRONTEND=noninteractive
pkg update -y -o Dpkg::Options::="--force-confold"
pkg install proot-distro qemu-user-x86_64 wget curl -y -o Dpkg::Options::="--force-confold"

echo "[2/4] Criando Emulacao Ubuntu x64 (Titan-Core)..."
echo "Aviso: O download da imagem base (50MB) comecara agora."
DISTRO_ARCH=x86_64 proot-distro install ubuntu --override-alias antigravity-os

echo "[3/4] Injetando Script de Setup Interno no Titan..."
cat << 'EOF' > $PREFIX/var/lib/proot-distro/installed-rootfs/antigravity-os/root/install_ide.sh
#!/bin/bash
export DEBIAN_FRONTEND=noninteractive
echo "Atualizando Container Ubuntu x64..."
apt update && apt install curl wget git build-essential -y
echo "Baixando o VS Code Server Oficial (x64) para rodar a VSIX..."
curl -fsSL https://code-server.dev/install.sh | sh
echo "Preparando portal de acesso..."
mkdir -p ~/.config/code-server
echo "bind-addr: 0.0.0.0:8080" > ~/.config/code-server/config.yaml
echo "auth: none" >> ~/.config/code-server/config.yaml
echo "cert: false" >> ~/.config/code-server/config.yaml
EOF

chmod +x $PREFIX/var/lib/proot-distro/installed-rootfs/antigravity-os/root/install_ide.sh

echo "[4/4] Executando Setup Interno (Isso sera demorado por conta da Emulacao QEMU)..."
proot-distro login antigravity-os -- /root/install_ide.sh

echo "===================================================="
echo " TITAN INVOCADO COM SUCESSO!"
echo " A barreira ARM64 foi quebrada. O ambiente x64 esta operante."
echo ""
echo " Para Ligar sua IDE Antigravity rodando emulacao x64:"
echo " 1. Digite no Termux:"
echo "    proot-distro login antigravity-os"
echo " 2. Dentro do Ubuntu, digite para ligar o Motor:"
echo "    code-server"
echo " 3. Abra o navegador do celular em http://localhost:8080"
echo " 4. Va na aba 'Extensions', instale o seu .vsix oficial"
echo "    e o Language Server ira rodar nativamente!"
echo "===================================================="
