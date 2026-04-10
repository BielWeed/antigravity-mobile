const fs = require('node:fs');
const path = require('node:path');

const targetFile = process.argv[2];

if (!targetFile) {
    console.error("Uso: node omni_send.js <caminho_do_arquivo>");
    process.exit(1);
}

const resolvedPath = path.resolve(targetFile);

if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Objeto não encontrado: ${resolvedPath}`);
    process.exit(1);
}

// Ensure the downloads directory exists in public/
const publicDownloadsDir = path.join(__dirname, 'public', 'downloads');
if (!fs.existsSync(publicDownloadsDir)) {
    fs.mkdirSync(publicDownloadsDir, { recursive: true });
}

const filename = path.basename(resolvedPath);
const safeFilename = filename.replaceAll(/[^a-zA-Z0-9_.-]/g, '_');
const destinationPath = path.join(publicDownloadsDir, safeFilename);

// Check if we are passing the same path to prevent error
if (resolvedPath !== destinationPath) {
    fs.copyFileSync(resolvedPath, destinationPath);
}

// Calculate size
const stats = fs.statSync(destinationPath);
const sizeBytes = stats.size;
let filesize = "";
if (sizeBytes > 1024 * 1024) {
    filesize = (sizeBytes / (1024 * 1024)).toFixed(1) + " MB";
} else {
    filesize = (sizeBytes / 1024).toFixed(0) + " KB";
}

// Dispatch to Local Bridge SSE!
fetch('http://127.0.0.1:3777/api/agent-reply', {
    method: 'POST',
    body: JSON.stringify({
        type: 'file',
        url: `/downloads/${safeFilename}`,
        filename: safeFilename,
        filesize: filesize,
        text: `Arquivo enviado para o seu dispositivo.` // Fallback text
    }),
    headers: { 'Content-Type': 'application/json' }
}).then(() => {
    console.log(`✅ Bridge Notificada: [${safeFilename}] (${filesize}) enviado!`);
}).catch(e => {
    console.error(`❌ Falha no SSE webhook: ${e.message}`);
});
