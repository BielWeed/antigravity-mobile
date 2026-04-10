require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const { execSync } = require('child_process');
const https = require('https');
const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3777;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/v2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index_v2.html'));
});

// ─── Auto-detect Language Server ───────────────────────────────────────────────

function detectLanguageServer() {
  try {
    const raw = execSync(
      'powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'language_server_windows_x64.exe\' } | Select-Object -ExpandProperty CommandLine"',
      { encoding: 'utf-8', timeout: 5000 }
    );

    const lines = raw.split('\n').filter(l => l.includes('--csrf_token'));
    if (lines.length === 0) return null;

    // Pick the one with a workspace_id (main window), or the first one
    const target = lines.find(l => l.includes('--workspace_id')) || lines[0];

    const csrfMatch = target.match(/--csrf_token\s+([a-f0-9-]+)/);
    const extPortMatch = target.match(/--extension_server_port\s+(\d+)/);
    const extCsrfMatch = target.match(/--extension_server_csrf_token\s+([a-f0-9-]+)/);

    if (!csrfMatch) return null;

    // Discover the HTTPS port by checking which ports the process is listening on
    const csrfToken = csrfMatch[1];

    // The language server listens on 3 ports: httpsPort, httpPort, lspPort
    // We need to find the httpsPort by probing
    const pidMatch = target.match(/parent_pipe_path/);

    return {
      csrfToken,
      extensionServerPort: extPortMatch ? parseInt(extPortMatch[1]) : null,
      extensionServerCsrfToken: extCsrfMatch ? extCsrfMatch[1] : null,
      raw: target.trim()
    };
  } catch (e) {
    console.error('[DETECT] Error:', e.message);
    return null;
  }
}

function findLanguageServerPorts() {
  try {
    const pids = execSync(
      'powershell -Command "Get-Process language_server_windows_x64 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"',
      { encoding: 'utf-8', timeout: 5000 }
    ).trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    if (pids.length === 0) return [];

    const allPorts = [];
    for (const pid of pids) {
      const netstat = execSync(
        `powershell -Command "netstat -ano | Select-String LISTENING | Select-String '${pid}'"`,
        { encoding: 'utf-8', timeout: 5000 }
      );
      const ports = [...netstat.matchAll(/:(\d+)\s+0\.0\.0\.0/g)].map(m => parseInt(m[1]));
      allPorts.push({ pid, ports });
    }
    return allPorts;
  } catch {
    return [];
  }
}

// Probe a port to check if it's the HTTPS gRPC port
async function probeHttpsPort(port, csrfToken, certPath) {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(certPath)) return resolve(false);
      const ca = fs.readFileSync(certPath);
      const options = {
        hostname: '127.0.0.1',
        port,
        path: '/',
        method: 'GET',
        ca,
        rejectUnauthorized: false,
        timeout: 2000
      };
      const req = https.request(options, (res) => {
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

const CERT_PATH = path.join(
  process.env.LOCALAPPDATA || '',
  'Programs', 'Antigravity', 'resources', 'app', 'extensions',
  'antigravity', 'dist', 'languageServer', 'cert.pem'
);

let cachedServer = null;

async function getActiveServer() {
  const info = detectLanguageServer();
  if (!info) return null;

  const portGroups = findLanguageServerPorts();
  if (portGroups.length === 0) return null;

  // Find the HTTPS port by probing each one
  for (const group of portGroups) {
    for (const port of group.ports) {
      const isHttps = await probeHttpsPort(port, info.csrfToken, CERT_PATH);
      if (isHttps) {
        cachedServer = {
          httpsPort: port,
          csrfToken: info.csrfToken,
          pid: group.pid
        };
        console.log(`[DETECT] Language Server found: port=${port}, csrf=${info.csrfToken.substring(0,8)}...`);
        return cachedServer;
      }
    }
  }
  return null;
}

// ─── PWA Frontend Host & Neural Webhook ─────────────────────────────────────
// Servidor frontend na porta 3777 com túnel SSE para receber as respostas da IA.

let sseClients = new Set();

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    req.on('close', () => {
        sseClients.delete(res);
    });
});

app.post('/api/agent-reply', (req, res) => {
    const { text, note, type, url, filename, filesize } = req.body;
    if (text || type === 'file') {
        const payload = JSON.stringify({ text, note, type: type || 'message', url, filename, filesize });
        sseClients.forEach(client => client.write(`data: ${payload}\n\n`));
    }
    res.json({ ok: true });
});

app.post('/api/workspace', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({error: 'title required'});

    // Clean title for safe folder names
    const safeTitle = title.replace(/[^a-z0-9_-]/gi, '_');
    const path = require('path');
    const folderPath = path.join(require('os').homedir(), 'Documents', 'Antigravity Mobile Workspaces', `Chat_${safeTitle}`);
    
    try {
        const r = await fetch('http://127.0.0.1:3888/api/switch-workspace', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ path: folderPath })
        });
        const ans = await r.json();
        res.json(ans);
    } catch (e) {
        res.status(500).json({error: 'Erro no Bridge local: ' + e.message});
    }
});

app.get('/api/status', (req, res) => res.json({ok:true}) ); // backward compat

// ─── Get local IP ───────────────────────────────────────────────────────────────

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const lname = name.toLowerCase();
    if (lname.includes('vbox') || lname.includes('virtual') || lname.includes('wsl') || lname.includes('tailscale') || lname.includes('hyper')) continue;
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// ─── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', async () => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}`;

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🚀 ANTIGRAVITY MOBILE — Bridge Server Ativo         ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Acesse no celular: ${url.padEnd(37)}║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  // Try to show QR code
  try {
    const qr = require('qrcode-terminal');
    qr.generate(url, { small: true }, (code) => {
      console.log(code);
    });
  } catch {
    console.log(`[INFO] Escaneie ou digite no celular: ${url}`);
  }

  // Auto-detect server on startup
  console.log('[INIT] Detectando Language Server do Antigravity...');
  try {
    const server = await getActiveServer();
    if (server) {
      console.log(`[INIT] ✅ Conectado! Porta: ${server.httpsPort}`);
    } else {
      console.log('[INIT] ⚠️  Language Server não encontrado. Abra o Antigravity primeiro.');
      console.log('[INIT]    Use POST /api/refresh para re-detectar.');
    }
  } catch (e) {
    console.log(`[INIT] ❌ Erro não-fatal na inicialização neural iterada: ${e.message}`);
  }
});


app.post('/api/upload', (req, res) => {
    try {
        const { filename, data } = req.body;
        if (!filename || !data) return res.status(400).json({error: 'Faltam dados'});
        const path = require('path');
        const dropDir = path.join(require('os').homedir(), 'Documents', 'Antigravity Mobile File Drops');
        if (!fs.existsSync(dropDir)) fs.mkdirSync(dropDir, { recursive: true });
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const buffer = Buffer.from(matches[2], 'base64');
            const safeName = filename.replace(/[^a-z0-9_.-]/gi, '_');
            const targetPath = path.join(dropDir, safeName);
            fs.writeFileSync(targetPath, buffer);
            res.json({ message: '📎 Arquivo salvo com sucesso no PC!' });
        } else {
            res.status(400).json({error: 'Formato Base64 inválido'});
        }
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});
