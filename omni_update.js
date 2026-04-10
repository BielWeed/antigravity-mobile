// Omni-Update CLI (OTA Engine)
// Uso: node omni_update.js "3.0"

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const http = require('node:http');

const version = process.argv[2] || "2.0";
console.log(`[🚀] Iniciando pipeline de atualização OTA para Versão ${version}...`);

try {
    // 0. Auto-increment versionCode in build.gradle to Destroy Zombie Cache
    console.log(`[0] Esmagando Zombie Caches (Bumping versionCode)...`);
    const gradlePath = path.join(__dirname, 'android/app/build.gradle');
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');
    
    gradleContent = gradleContent.replace(/versionCode\s+(\d+)/, (match, p1) => {
        const newCode = Number.parseInt(p1, 10) + 1;
        console.log(`    -> versionCode atualizado para: ${newCode}`);
        return `versionCode ${newCode}`;
    });
    
    gradleContent = gradleContent.replace(/versionName\s+".*?"/, `versionName "${version}"`);
    fs.writeFileSync(gradlePath, gradleContent);

    // 1. Sincroniza Capacitor
    console.log(`[1] Sincronizando Frontend com Android VM...`);
    execSync('npx cap sync android', { stdio: 'inherit' });

    // 2. Compila APK
    console.log(`[2] Compilando APK OTA...`);
    execSync(String.raw`cd android && .\gradlew assembleDebug`, { stdio: 'inherit' });

    // 3. Move para a pasta do File Server (ponte)
    console.log(`[3] Copiando Payload para Public Downloads...`);
    const sourceApk = path.join(__dirname, 'android/app/build/outputs/apk/debug/app-debug.apk');
    const updatePath = path.join(__dirname, 'public/downloads', `update.apk`);
    
    // Cria pasta downloads se n existir
    if (!fs.existsSync(path.join(__dirname, 'public/downloads'))) {
        fs.mkdirSync(path.join(__dirname, 'public/downloads'), { recursive: true });
    }
    
    fs.copyFileSync(sourceApk, updatePath);
    console.log(`✅ APK encapsulado em: /public/downloads/update.apk`);

    // 4. Dispara Webhook V2 OTA
    console.log(`[4] Disparando Webhook para Celular...`);
    
    const payload = JSON.stringify({
        type: 'update',
        version: version,
        url: `/downloads/update.apk`
    });

    const options = {
        hostname: '127.0.0.1',
        port: 3777,
        path: '/api/agent-reply',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
            console.log(`📡 Resposta da Bridge: ${responseBody}`);
            console.log(`🚀 Sucesso Absoluto! Seu celular acaba de receber o card de OTA Atualização!`);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Erro no Bridge do OTA: ${e.message}`);
    });

    req.write(payload);
    req.end();

} catch (e) {
    console.error(`❌ Falha Crítica no Pipeline Mestre: ${e.message}`);
}
