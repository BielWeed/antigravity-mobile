require('dotenv').config();
const express = require('express');
const compression = require('compression');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const { execSync } = require('node:child_process');
const https = require('node:https');
const http2 = require('node:http2');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const app = express();
const PORT = 3777;

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/downloads/AntigravityMobile.apk', (req, res) => {
    res.download(path.join(__dirname, 'AntigravityMobile.apk'));
});

// ─── Roteamento Base ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Auto-detect Language Server ───────────────────────────────────────────────

async function detectLanguageServer() {
  const util = require('node:util');
  const execAsync = util.promisify(require('node:child_process').exec);
  try {
    const { stdout: raw } = await execAsync(
      'powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'language_server_windows_x64.exe\' } | Select-Object -ExpandProperty CommandLine"',
      { encoding: 'utf-8', timeout: 5000 }
    );

    const lines = raw.split('\n').filter(l => l.includes('--csrf_token'));
    if (lines.length === 0) return null;

    // Pick the one with a workspace_id (main window), or the first one
    const target = lines.find(l => l.includes('--workspace_id')) || lines[0];

    const csrfMatch = /--csrf_token\s+([a-f0-9-]+)/.exec(target);
    const extPortMatch = /--extension_server_port\s+(\d+)/.exec(target);
    const extCsrfMatch = /--extension_server_csrf_token\s+([a-f0-9-]+)/.exec(target);

    if (!csrfMatch) return null;

    // Discover the HTTPS port by checking which ports the process is listening on
    const csrfToken = csrfMatch[1];

    // The language server listens on 3 ports: httpsPort, httpPort, lspPort
    // We need to find the httpsPort by probing

    return {
      csrfToken,
      extensionServerPort: extPortMatch ? Number.parseInt(extPortMatch[1], 10) : null,
      extensionServerCsrfToken: extCsrfMatch ? extCsrfMatch[1] : null,
      raw: target.trim()
    };
  } catch (e) {
    console.error('[DETECT] Error:', e.message);
    return null;
  }
}

async function findLanguageServerPorts() {
  const util = require('node:util');
  const execAsync = util.promisify(require('node:child_process').exec);
  try {
    const { stdout: tempPids } = await execAsync(
      'powershell -Command "Get-Process language_server_windows_x64 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"',
      { encoding: 'utf-8', timeout: 5000 }
    );
    const pids = tempPids.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    if (pids.length === 0) return [];

    const allPorts = [];
    for (const pid of pids) {
      const { stdout: netstat } = await execAsync(
        `powershell -Command "netstat -ano | Select-String LISTENING | Select-String '${pid}'"`,
        { encoding: 'utf-8', timeout: 5000 }
      );
      const ports = [...netstat.matchAll(/:(\d+)\s+0\.0\.0\.0/g)].map(m => Number.parseInt(m[1], 10));
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
        timeout: 2000
      };
      const req = https.request(options, (res) => {
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch (e) {
      console.error('[PROBE] Err:', e.message);
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
  const info = await detectLanguageServer();
  if (!info) return null;

  const portGroups = await findLanguageServerPorts();
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
let broadcastBuffer = []; // Tática V45: Fila inquebrável

// Tática Inquebrável [Polling Híbrido]
app.get('/api/sync', (req, res) => {
    const lastId = Number.parseInt(req.query.lastId || '0', 10);
    const newItems = broadcastBuffer.filter(p => p.id > lastId);
    res.json({ ok: true, items: newItems });
});

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Prevent Nginx/Proxy buffering
    res.flushHeaders(); // Tell client that stream is open

    console.log(`[SSE] Client connected. Total clients: ${sseClients.size + 1}`);
    sseClients.add(res);

    // Keep-alive heartbeat (15s) to guarantee WebView connection is held.
    const heartbeat = setInterval(() => {
        res.write(':\n\n'); // SSE comment to keep socket active
    }, 15000);

    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
        console.log(`[SSE] Client disconnected. Total clients: ${sseClients.size}`);
    });
});

app.post('/api/agent-reply', (req, res) => {
    const { text, type } = req.body;
    const snippet = text ? text.substring(0, 40).replaceAll('\n', ' ') + '...' : (type || 'file');
    console.log(`[MIRROR] Syncing: ${snippet} [Type: ${type}]`);
    
    if (text || type === 'file') {
        const payloadObj = { id: Date.now(), ...req.body, type: type || 'message' };
        broadcastBuffer.push(payloadObj);
        if (broadcastBuffer.length > 50) broadcastBuffer.shift(); // OOM Shield
        
        const payloadStr = JSON.stringify(payloadObj);
        sseClients.forEach(client => {
            try {
                client.write(`event: message\ndata: ${payloadStr}\n\n`);
            } catch (e) {
                console.error(e);
                sseClients.delete(client);
            }
        });
    }
    res.json({ ok: true });
});

app.get('/api/diagnostics', (req, res) => {
    res.json({
        active_sse_clients: sseClients.size
    });
});

app.post('/api/workspace', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({error: 'title required'});

    // Clean title for safe folder names
    const safeTitle = title.replaceAll(/[^a-z0-9_-]/gi, '_');
    const path = require('node:path');
    const folderPath = path.join(require('node:os').homedir(), 'Documents', 'Antigravity Mobile Workspaces', `Chat_${safeTitle}`);
    
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

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({error: 'prompt required'});

        // ROTA A: Tentativa de Roteamento PC -> Antigravity Extension
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const r = await fetch('http://127.0.0.1:3888/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const ans = await r.json();
            return res.json(ans);
        } catch (fetchErr) {
            // ROTA B: PÂNICO PROXY -> ASSUMIR CÉREBRO AUTÔNOMO (TERMUX LAYER)
            console.log('[CHAT] Servidor Desktop inalcançável. Assumindo IA Nativa via Termux...');
            
            if (!process.env.GEMINI_API_KEY) {
                return res.status(500).json({error: 'Modo Autônomo Android requer a GEMINI_API_KEY no arquivo .env do Termux.'});
            }
            
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const result = await model.generateContent("Você é o Antigravity Mobile rodando 100% nativo no Termux do usuário. Responda de forma ágil e hackerspace. Prompt: " + prompt);
            const textResponse = result.response.text();
            
            const payloadObj = { id: Date.now(), text: textResponse, type: 'message', source: 'termux-native' };
            broadcastBuffer.push(payloadObj);
            if (broadcastBuffer.length > 50) broadcastBuffer.shift();
            
            const payloadStr = JSON.stringify(payloadObj);
            sseClients.forEach(client => {
                try {
                    client.write(`event: message\ndata: ${payloadStr}\n\n`);
                } catch (e) {
                    sseClients.delete(client);
                }
            });
            
            return res.json({ ok: true, autonomous: true, message: "Modo Autônomo Acionado" });
        }
    } catch (e) {
        res.status(500).json({error: 'Erro crítico na camada cerebral remota: ' + e.message});
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        ok: true,
        httpsPort: cachedServer ? cachedServer.httpsPort : 3888
    });
});


// ─── Get local IP ───────────────────────────────────────────────────────────────

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const lname = name.toLowerCase();
    if (lname.includes('vbox') || lname.includes('virtual') || lname.includes('wsl') || lname.includes('tailscale') || lname.includes('hyper') || lname.includes('vethernet')) continue;
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


const multer = require('multer');

// Destination logic safely outside of limits restrictions
const uploadDir = path.join(os.homedir(), 'Documents', 'Antigravity Mobile File Drops');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replaceAll(/[^a-z0-9_.-]/gi, '_');
    cb(null, safeName)
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({error: 'Nenhum payload binário recebido'});
        res.json({ message: '📎 Arquivo binário bruto processado com sucesso [Anti-OOM]!' });
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});
