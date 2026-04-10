#!/data/data/com.termux/files/usr/bin/bash

clear
echo "================================================="
echo "   ANTIGRAVITY TITAN INSTALLER (x64 EMULATION)   "
echo "================================================="
echo "[1/4] Instalando Base Level (Proot & QEMU x86_64)..."
export DEBIAN_FRONTEND=noninteractive
pkg update -y -o Dpkg::Options::="--force-confold"
pkg install proot-distro qemu-user-x86-64 wget curl -y -o Dpkg::Options::="--force-confold"

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
echo " O servidor do VS Code IDE esta subindo agora..."
echo " Abra o Google Chrome no seu celular e acesse:"
echo " --->  http://localhost:8080  <---"
echo ""
echo " Va na aba Extensions e instale o .vsix do Antigravity!"
echo "===================================================="

# Auto-start code server inside the Ubuntu VM
proot-distro login antigravity-os --bind /dev/null:/proc/sys/kernel/cap_last_cap -- code-server
