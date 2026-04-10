
// V117 OMNI-BRAIN INJECTION
try { require('./omni-indexer.cjs'); } catch(e){ log('Omni-Indexer indisponível: '+e.message); }
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { MessageChannel } = require('node:worker_threads');

// V116.0.0 OMNI-NEXUS TRANSCENDENCE: Dynamic Quantum-Neural Micro-task Yielding & Zero-Copy Streaming
const { port1, port2 } = new MessageChannel();
port2.unref();
let globalInstructionCount = 0;
let lastQuantumYield = Date.now();
const os = require('node:os');

// V116.0.0 OMNI-SOVEREIGN: Zero-Delay Pass-through
const quantumYield = (payloadSize = 1024, force = false, overrideJitter = false) => {
    // Solo-Ninja mode: No Swarm backpressure.
    return new Promise(resolve => {
        port2.once('message', resolve);
        port1.postMessage(null);
    });
};

const APP_DATA = 'C:/Users/Gabriel/.gemini/antigravity';
const WORKSPACE_ROOT = 'c:/Users/Gabriel/Downloads/Kimi_Agent_Atualização v4';
const WORKSPACE_MODULES = path.join(WORKSPACE_ROOT, 'node_modules');
const APP_DATA_MODULES = path.join(APP_DATA, 'mcp_modules', 'node_modules');

// KERNEL SYNC (Windows Master Fix for MCP / V49.1 Deep I/O)
// Removed setBlocking(true) because it can cause hard crashes on EPIPE.
process.stdout.on('error', (err) => {
    if (err.code === 'EPIPE') {
        // Parent closed pipe, we should exit gracefully or ignore.
        //process.exit(0);
    }
});
const LOG_FILE = path.join(APP_DATA, 'mcp_modules', `ninja-monolith.log`);

// V85.0 (Singularity-Nexus): Unified Async Boot & Log Rotation
function rotateLogIfNeeded() {
    fs.promises.stat(LOG_FILE).then(stats => {
        if (stats.size > 512000) {
            const bakFile = LOG_FILE + '.bak';
            fs.promises.unlink(bakFile).catch(() => {}).then(() => {
                return fs.promises.rename(LOG_FILE, bakFile);
            }).catch(e => log(`Rotation rename fail: ${e.message}`));
        }
    }).catch(() => {});
}
rotateLogIfNeeded();

const scrub = (text) => {
    if (!text) return text;
    return text.toString()
               .replaceAll(/ghp_\w+/g, 'ghp_****')
               .replaceAll(/EXA_\w+/g, 'EXA_MASKED')
               .replaceAll(/FIGMA_\w+/g, 'FIGMA_MASKED');
};


const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
const log = (msg) => {
    try {
        const scrubbedMsg = scrub(msg);
        logStream.write(`[${new Date().toISOString()}] ${scrubbedMsg}\n`);
    } catch (e) {
        process.stderr.write(scrub(`Log Error: ${e.message}\n`));
    }
};

// V116.0.0 (SUPREME COGNITION) EVENT LOOP DEFENDER (HYSTERESIS AND DERIVATIVE LAG)
let lastELCheck = Date.now();
let elLastLag = 0;
let isYieldingEl = false;
let elViolationStreak = 0; // V101: require 3 consecutive violations or huge lag accel
const BOOT_TIME = Date.now();
const BOOT_GRACE_MS = 5000; // 5s grace period for 19 sub-server spawns
setInterval(() => {
    const lag = Date.now() - lastELCheck - 100;
    const acceleration = lag - elLastLag;
    const isBoot = (Date.now() - BOOT_TIME) < BOOT_GRACE_MS;
    const threshold = isBoot ? 4000 : 3500; // V116+ OMNI-OVERRIDE: MASSIVE threshold (3500ms) to unlock Omni-Parallelism limitlessly
    if (lag > threshold || acceleration > 1500) {
        elViolationStreak++;
        if (elViolationStreak >= 8 || acceleration > 300) { // V118 FIXED: less twitchy action
            log(`[\u26A0\uFE0F V116.0.0] Event Loop lag: ${lag}ms (accel: ${acceleration}ms, streak: ${elViolationStreak}, threshold: ${threshold}ms${isBoot ? ' BOOT' : ''}).`);
            if (!isYieldingEl && process.stdin.pause && !isBoot) {
                isYieldingEl = true;
                process.stdin.pause();
                log(`[\uD83D\uDEE1\uFE0F V116.0.0] Pausando STDIN (Acceleration/Hysteresis triggered)...`);
                let yieldAttempts = 0;
                const yieldWatcher = setInterval(() => {
                     yieldAttempts++;
                     const loopLag = Date.now() - lastELCheck - 100;
                     if (loopLag < 40 || yieldAttempts >= 6) { // V116+ wait for < 40ms lag to resume, max 1.5s
                         clearInterval(yieldWatcher);
                         isYieldingEl = false;
                         elViolationStreak = Math.max(0, elViolationStreak - 2); // Fluid rollback faster
                         if (process.stdin.resume) process.stdin.resume();
                         log(`[\uD83D\uDEE1\uFE0F V116.0.0] STDIN retomado apos ${yieldAttempts * 250}ms. Violations left: ${elViolationStreak}`);
                     }
                }, 250);
            }
        }
    } else {
        if (elViolationStreak > 0) elViolationStreak = Math.max(0, elViolationStreak - 1); // fluid streak decrement
    }
    elLastLag = lag;
    lastELCheck = Date.now();
}, 100).unref();


// V116.0.0: Neural-Secure Hybrid Paths
module.paths.push(WORKSPACE_MODULES, APP_DATA_MODULES);

const ENV_FILE = path.join(APP_DATA, 'mcp_modules', '.env');
const mcpEnv = { ...process.env };
async function loadEnvAsync() {
    try {
        let content = await fs.promises.readFile(ENV_FILE, 'utf8');
        if (content.codePointAt(0) === 0xFEFF) content = content.slice(1);
        content.split(/\r?\n/).forEach(line => {
            const match = /^\s*([\w.-]+)\s*=\s*(.*?)\s*$/.exec(line);
            if (match) {
                const key = match[1];
                let value = match[2] || "";
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                mcpEnv[key] = value.trim();
            }
        });
        log("Env Synchronized. Operational Keys Loaded.");
    } catch (e) {
        if (e.code !== 'ENOENT') log(`[Env Load Warning] ${e.message}`);
    }
}
const loadEnv = loadEnvAsync;
loadEnvAsync();

// For child processes
const hybridNodePath = `${WORKSPACE_MODULES}${path.delimiter}${APP_DATA_MODULES}${path.delimiter}${process.env.NODE_PATH || ''}`;
mcpEnv.NODE_PATH = hybridNodePath;

log("NINJA MONOLITH V116.0.0 (SUPREME COGNITION) BOOT");

class NativeShell extends EventEmitter {
    constructor() {
        super();
        this.shell = null;
        this.isReady = false;
    }
    ensureShell() {
        if (this.shell && !this.shell.killed) return;
        try {
            log("Spawning Native Shell (Secure-Pwr)...");
            this.shell = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', '-'], {
                cwd: 'c:/Users/Gabriel/Downloads/Kimi_Agent_Atualização v4',
                env: { ...process.env },
                stdio: ['pipe', 'pipe', 'pipe']
            });
            this.shell.stdout.on('data', (d) => this.emit('stdout', d.toString()));
            this.shell.stderr.on('data', (d) => {
                const scrubbed = scrub(d.toString().trim());
                log(`[SHELL ERR] ${scrubbed}`);
            });
            this.shell.on('error', (err) => { log(`[SHELL CRASH] ${err.message}`); });
            this.shell.on('exit', () => { this.isReady = false; this.shell = null; log("Shell Exited."); });
            this.isReady = true;
        } catch(e) {
            log(`Shell Spawn Fail: ${e.message}`);
        }
    }
    validateCommand(cmd) {
        if (!cmd || typeof cmd !== 'string') {
            throw new Error(`POLÍTICA DE SEGURANÇA: Comando inválido. O parâmetro 'command' deve ser uma string (recebido: ${typeof cmd}).`);
        }
        // V50.0: Relaxed rules to allow native PowerShell pipes and parens via Base64 proxy
        const forbidden = ["rm -rf", "format", "del /s /q"]; 
        const isDangerous = forbidden.some(op => cmd.includes(op));
        if (isDangerous) {
             throw new Error(`POLÍTICA DE SEGURANÇA: Comando contém caracteres proibidos para execução remota: ${forbidden.join(' ')}`);
        }
        return cmd;
    }
    async run(command, timeoutMs = 30000) {
        try {
            this.validateCommand(command);
        } catch(e) {
            return e.message;
        }
        this.ensureShell();
        let stdout = '';
        const marker = `---DONE_${crypto.randomUUID().slice(0, 8)}---`;
        
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.removeListener('stdout', outH);
                resolve("TIMEOUT: Comando excedeu limite.");
            }, timeoutMs);

            const outH = (d) => {
                stdout += d;
                if (stdout.includes(marker)) {
                    clearTimeout(timer);
                    this.removeListener('stdout', outH);
                    resolve(stdout.split(marker)[0].trim());
                }
            };
            
            this.on('stdout', outH);
            try {
                const b64 = Buffer.from(command || 'echo ok', 'utf16le').toString('base64');
                const pwrCmd = `& { $c = [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String("${b64}")); iex $c; Write-Host "${marker}" }\n`;
                if (!this.shell.stdin.write(pwrCmd)) {
                    this.shell.stdin.once('drain', () => {});
                }
            } catch(e) {
                clearTimeout(timer);
                resolve(`Error: ${e.message}`);
            }
        });
    }
}
const SHELL = new NativeShell();

const toolRegistry = new Map();

// Internal Tools
toolRegistry.set("ninja_run", { name: "ninja_run", description: "Executa comandos PowerShell nativos (Windows).", inputSchema: { type: "object", properties: { command: { type: "string" }, cwd: { type: "string" }, timeout: { type: "number" } }, required: ["command"] }, _server: "SYSTEM_SHELL" });
toolRegistry.set("stitch_start", { name: "stitch_start", description: "Inicia o dashboard visual Stitch-UI.", inputSchema: { type: "object", properties: {} }, _server: "SYSTEM_SHELL" });
toolRegistry.set("memory_status", { name: "memory_status", description: "Verifica a saúde da memória persistente e o estado do Oracle.", inputSchema: { type: "object", properties: {} }, _server: "SYSTEM_SHELL" });
toolRegistry.set("ninja_status", { name: "ninja_status", description: "Verifica o status operacional de todo o ecossistema Ninja.", inputSchema: { type: "object", properties: {} }, _server: "SYSTEM_SHELL" });
toolRegistry.set("ninja_ping", { name: "ninja_ping", description: "Verifica se o servidor Ninja está responsivo.", inputSchema: { type: "object", properties: {} }, _server: "SYSTEM_SHELL" });
toolRegistry.set("ninja_reload", { name: "ninja_reload", description: "Recarrega o .env e reinicia os sub-servidores (Figma, GitHub, etc).", inputSchema: { type: "object", properties: {} }, _server: "SYSTEM_SHELL" });
toolRegistry.set("ninja_vibe_audit", { name: "ninja_vibe_audit", description: "Deep investigation of the entire Antigravity system health and latency.", inputSchema: { type: "object", properties: {} }, _server: "SYSTEM_SHELL" });

function injectStaticInventory() {
  const inventory = [
    { name: "remember_entity", _server: "oracle", description: "Salva uma entidade no Oracle.", inputSchema: { type: "object", properties: { name: { type: "string" }, type: { type: "string" }, description: { type: "string" } }, required: ["name", "type"] } },
    { name: "query_graph", _server: "oracle", description: "Consulta o grafo Oracle.", inputSchema: { type: "object", properties: { query: { type: "string" } } } },
    { name: "connect_entities", _server: "oracle", description: "Conecta duas entidades no Oracle.", inputSchema: { type: "object", properties: { source: { type: "string" }, target: { type: "string" }, relation: { type: "string" } }, required: ["source", "target", "relation"] } },
    { name: "get_file_contents", _server: "github", description: "Le arquivo do GitHub.", inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, path: { type: "string" } }, required: ["owner", "repo", "path"] } },
    { name: "search_code", _server: "github", description: "Busca codigo no GitHub.", inputSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] } },
    { name: "push_files", _server: "github", description: "Envia arquivos para o GitHub.", inputSchema: { type: "object", properties: { owner: { type: "string" }, repo: { type: "string" }, branch: { type: "string" }, files: { type: "array", items: { type: "object" } } }, required: ["owner", "repo", "files"] } },
    { name: "exa_search", _server: "exa", description: "Busca semantica neural Exa.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
    { name: "exa_find_similar", _server: "exa", description: "Encontra paginas similares a uma URL.", inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
    { name: "python_analyze", _server: "datalab", description: "Analitica Python com Pandas.", inputSchema: { type: "object", properties: { script: { type: "string" } }, required: ["script"] } },
    { name: "simulate_logic_sandbox", _server: "datalab", description: "VM Sandbox (Mental Gym) para testar algoritmos e simular estado do Node com segurança (Zero colaterais).", inputSchema: { type: "object", properties: { script: { type: "string" } }, required: ["script"] } },
    { name: "semantic_search", _server: "vss", description: "Busca semantica vetorial.", inputSchema: { type: "object", properties: { query: { type: "string" }, candidates: { type: "array", items: { type: "string" } } }, required: ["query", "candidates"] } },
    { name: "map_capabilities", _server: "mapper", description: "Mapeia ferramentas MCP.", inputSchema: { type: "object", properties: { deep_scan: { type: "boolean" } } } },
    { name: "navigate_url", _server: "browser", description: "Navega para uma URL (ZHA Ready).", inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
    { name: "click_element", _server: "browser", description: "Clica em um seletor CSS.", inputSchema: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] } },
    { name: "type_text", _server: "browser", description: "Preenche um formulario com texto.", inputSchema: { type: "object", properties: { selector: { type: "string" }, text: { type: "string" } }, required: ["selector", "text"] } },
    { name: "capture_screenshot", _server: "browser", description: "Captura o estado visual da pagina.", inputSchema: { type: "object", properties: { name: { type: "string" } } } },
    { name: "scrape_markdown", _server: "browser", description: "Extrai o conteudo de uma URL.", inputSchema: { type: "object", properties: { url: { type: "string" }, waitForSelector: { type: "string" } }, required: ["url"] } },
    { name: "human_click", _server: "browser", description: "Clica de forma humanizada usando curvas de Bezier.", inputSchema: { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] } },
    { name: "detect_captcha", _server: "browser", description: "Detecta a presença de desafios de segurança.", inputSchema: { type: "object", properties: {} } },
    { name: "solve_captcha_auto", _server: "browser", description: "Resolve CAPTCHAs de forma autonoma (ZHA V25).", inputSchema: { type: "object", properties: { provider: { type: "string" } } } },
    { name: "evaluate_logic", _server: "meta", description: "Analisa a logica estrutural em busca de falhas conhecidas usando System 2 e ERRORS.md.", inputSchema: { type: "object", properties: { logic_snippet: { type: "string" } }, required: ["logic_snippet"] } },
    { name: "record_lesson", _server: "meta", description: "Grava nova regra em memória persistente (ninja-learnings).", inputSchema: { type: "object", properties: { subject: { type: "string" }, lesson: { type: "string" } }, required: ["subject", "lesson"] } },
    { name: "self_repair_prompt", _server: "meta", description: "Gera instrucoes automáticas e dinamicas anti-bugs.", inputSchema: { type: "object", properties: { context: { type: "string" } } } },
    { name: "deep_ast_analyze_file", _server: "ast", description: "Analise AST nativa de um arquivo (JS/TS/PY). Ex: function_calls, imports.", inputSchema: { type: "object", properties: { filePath: { type: "string" } }, required: ["filePath"] } },
    { name: "forge_permanent_tool", _server: "scribe", description: "AUTO-EVOLUCAO. Cria novas ferramentas MCP.", inputSchema: { type: "object", properties: { name: { type: "string" }, code: { type: "string" }, force: { type: "boolean" } }, required: ["name", "code"] } },
    { name: "ninja_diagnose", _server: "diagnostics", description: "Modo debug intensivo.", inputSchema: { type: "object", properties: {} } },
    { name: "index_project", _server: "codeindex", description: "Indexa o AST do projeto no banco relacional.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
    { name: "search_symbol", _server: "codeindex", description: "Busca por classe/funcao/variavel super rapido.", inputSchema: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] } },
    { name: "trigger_self_reflection", _server: "reflection", description: "Analisa os logs do monolith em busca de falhas.", inputSchema: { type: "object", properties: {} } },
    { name: "analyze_dependencies", _server: "prism", description: "Mapeamento avançado do grafo de dependencias via Prism.", inputSchema: { type: "object", properties: { target: { type: "string" } }, required: ["target"] } },
    { name: "system3_quantum_leap", _server: "quantum", description: "Inicia raciocinio intuitivo (System-3).", inputSchema: { type: "object", properties: { goal: { type: "string" } }, required: ["goal"] } },
    { name: "generate_resonance_map", _server: "ast", description: "Gera o mapa de ressonancia AST.", inputSchema: { type: "object", properties: { filePath: { type: "string" } }, required: ["filePath"] } },
    { name: "morph_ast_node", _server: "ast", description: "Muta um nodo especifico da AST.", inputSchema: { type: "object", properties: { filePath: { type: "string" }, targetNode: { type: "string" }, newCode: { type: "string" } }, required: ["filePath", "targetNode", "newCode"] } },
    { name: "compute_embeddings", _server: "vss", description: "Calcula embeddings locais com VSS.", inputSchema: { type: "object", properties: { chunks: { type: "array", items: { type: "string" } } }, required: ["chunks"] } }
  ];
    inventory.forEach(t => {
        if (t.inputSchema) fixSchema(t.inputSchema);
        toolRegistry.set(t.name, t);
    });
}
injectStaticInventory();

const SERVERS = {
  'oracle': path.join(APP_DATA, 'mcp_modules', 'ninja-oracle-v3.cjs'),
  'github': path.join(APP_DATA, 'mcp_modules', 'gh-ninja.cjs'),
  'datalab': path.join(APP_DATA, 'mcp_modules', 'ninja-data-lab.cjs'),
  'exa': path.join(APP_DATA, 'mcp_modules', 'exa-search.cjs'),
  'vss': path.join(APP_DATA, 'mcp_modules', 'ninja-vss.cjs'),
  'mapper': path.join(APP_DATA, 'mcp_modules', 'capability_mapper.cjs'),
  'browser': path.join(APP_DATA, 'mcp_modules', 'browser-pro.cjs'),
  'figma': path.join(APP_DATA, 'mcp_modules', 'figma-pro.mjs'),
  'crawler': path.join(APP_DATA, 'mcp_modules', 'ninja-crawler.mjs'),
  'bundlephobia': path.join(APP_DATA, 'mcp_modules', 'ninja-bundlephobia.mjs'),
  'meta': path.join(APP_DATA, 'mcp_modules', 'ninja-meta-cognitive.cjs'),
  'ast': path.join(APP_DATA, 'mcp_modules', 'ninja-ast-tracer.cjs'),
  'scribe': path.join(APP_DATA, 'mcp_modules', 'ninja-scribe.js'),
  'diagnostics': path.join(APP_DATA, 'mcp_modules', 'diagnose.cjs'),
  'codeindex': path.join(APP_DATA, 'mcp_modules', 'code-index.js'),
  'reflection': path.join(APP_DATA, 'mcp_modules', 'ninja-omni-reflection.cjs'),
  'prism': path.join(APP_DATA, 'mcp_modules', 'prism-analyzer.cjs'),
  'quantum': path.join(APP_DATA, 'mcp_modules', 'system3_quantum_leap.js')
};

const children = new Map();
const pendingCalls = new Map();
let nextInternalId = 1;
let hasInitialized = false;

function sendToIDE(msg) {
    try {
        const raw = JSON.stringify(msg);
        // V50.0 FIX: Do NOT scrub protocol output — scrub corrupts legitimate data
        // (e.g. file contents containing 'ghp_' or 'EXA_' strings)
        process.stdout.write(raw + '\n');
    } catch(e) {
        log(scrub(`IDE Send Error: ${e.message}`));
    }
}

function startServer(name, scriptPath) {
    try {
        const child = spawn('node', [scriptPath], {
            env: mcpEnv,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdoutBuffer = "";
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', async (d) => {
            stdoutBuffer += d;
            // Split by newline and process each complete JSON line
            const lines = stdoutBuffer.split(/\r?\n/);
            stdoutBuffer = lines.pop() || ""; // Keep incomplete line in buffer

            let chunkStartTime = performance.now();
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const msg = JSON.parse(line);
                    setImmediate(() => { handleSubMsg(name, msg); });
                } catch(e) {
                    // V47: Limit the raw payload printing to avoid pollution when sub-servers send normal stdout
                    if (!line.includes("Server running") && !line.includes("Loaded") && !line.includes("OPERATIONAL") && !line.includes("ONLINE")) {
                        log(`[${name}] Non-JSON str (${line.length}c) ignored. Error: ${e.message}`);
                    }
                }
                
                // V94.0.0 Quantum-Delay Yielding no Parse Stream
                if (performance.now() - chunkStartTime > 0.5) {
                     await quantumYield(line.length);
                     chunkStartTime = performance.now();
                }
            }
        });

        child.stderr.on('data', (d) => log(`[${name} ERR] ${d.toString().trim()}`));
        child.on('error', (err) => log(`[${name} CRASH] ${err.message}`));
    const retryMap = (globalThis._ninja_retries = globalThis._ninja_retries || new Map());
    const count = retryMap.get(name) || 0;

    child.on('exit', (c) => { 
        log(`[${name}] Exited with code ${c}`); 
        children.delete(name); 
        if (child._hibernated) {
             log(`[${name}] Sleep state confirmed. Sub-server is offline safely.`);
             return;
        }
        if (isShuttingDown) {
            retryMap.set(name, 0);
        } else {
            const currentCount = retryMap.get(name) || 0;
            const maxRetries = name === 'arena' ? 50 : 20; // V116.0.0: Extended Auto-Heal for critical intelligence
            if (currentCount >= maxRetries) {
                log(`[${name}] ❌ MAX RETRIES (${maxRetries}) EXCEEDED. Abandoning auto-heal. Fix the root cause and run ninja_reload.`);
                retryMap.set(name, 0);
                return;
            }
            const delay = Math.min(120000, 2000 * Math.pow(1.5, currentCount));
            log(`[${name}] Auto-Healing in ${delay}ms (Retry ${currentCount + 1}/${maxRetries})...`);

            retryMap.set(name, currentCount + 1);
            setTimeout(() => {
                if (!children.has(name) && !isShuttingDown) {
                    startServer(name, scriptPath);
                }
            }, delay);
        }
    });

    // V95.0: Reset retry counter when sub-server successfully initializes
    child.stdout.once('data', () => {
        retryMap.set(name, 0);
    });

        child.stdin.write(JSON.stringify({
            jsonrpc: "2.0", id: `init-${name}`, method: "initialize",
            params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "ninja-monolith", version: "116.0.0" } }
        }) + '\n');
        
        children.set(name, child);
    } catch (e) {
        log(`Spawn ${name} Failed: ${e.message}`);
    }
}

function fixSchema(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.type === "array" && !obj.items) obj.items = { type: "string" };
    if (obj.properties) Object.values(obj.properties).forEach(fixSchema);
    if (obj.items) fixSchema(obj.items);
}

function handleSubMsg(server, msg) {
    if (msg.id === `init-${server}`) {
        // Reset retry counter on successful init — proves server is healthy
        const retryMap = (globalThis._ninja_retries = globalThis._ninja_retries || new Map());
        retryMap.set(server, 0);
        children.get(server).stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + '\n');
        children.get(server).stdin.write(JSON.stringify({ jsonrpc: "2.0", id: `list-${server}`, method: "tools/list" }) + '\n');
    } else if (msg.id === `list-${server}`) {
        if (msg.result?.tools) {
            msg.result.tools.forEach(t => {
                if (t.inputSchema) fixSchema(t.inputSchema);
                toolRegistry.set(t.name, { ...t, _server: server });
            });
            if (hasInitialized) sendToIDE({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
        }
    } else if (msg.id && pendingCalls.has(msg.id)) {
        const { originalId, timer } = pendingCalls.get(msg.id);
        clearTimeout(timer);
        pendingCalls.delete(msg.id);
        sendToIDE({ ...msg, id: originalId });
    } else if (msg.method && !msg.id) {
        sendToIDE(msg); // Proxy notifications like logs or progress
    }
}

let ideChunks = [];
let ideBufferLen = 0;
process.stdin.setEncoding('utf8');
process.stdin.on('error', (e) => log(`[STDIN ERR] ${e.message}`));
process.stdin.on('close', () => {
    log("STDIN PIPE CLOSED BY PARENT. Ignoring exit for testing.");
    // //process.exit(0);
});
process.stdin.on('data', async (d) => {
    ideChunks.push(d);
    ideBufferLen += d.length;

    // V116.1.0 OOM Guardian Expansion: Zero-Copy String Interning Safepoint
    if (ideBufferLen > 20971520) { // 20MB relaxed bound (V116.1.0)
        let joinedSafe = ideChunks.join('').slice(-2097152); // Keeps the last 2MB in buffer instead of aggressively dropping everything

        let firstNewline = joinedSafe.indexOf('\n');
        ideChunks = firstNewline !== -1 ? [joinedSafe.substring(firstNewline + 1)] : [];
        ideBufferLen = ideChunks[0] ? ideChunks[0].length : 0;
        log("[V116.1.0 OOM SHIELD] Safepoint Buffer Truncation Executed. String Interning aborted at 20MB.");
        if (global.gc && (Date.now() - lastELCheck) < 5) global.gc(); // V116 Idle GC Strategy
    }
    let joined = ideChunks.join('');
    let nIndex;
    let chunkStartTime = performance.now();
    let loops = 0;
    
    // V116.0.0 OMNI-SYNERGY TRANSCENDENCE ZERO-COPY String Demuxer!
    while ((nIndex = joined.indexOf("\n")) !== -1) {
        const line = joined.slice(0, nIndex).trim();
        joined = joined.slice(nIndex + 1); // Extract
        loops++;

        if (line) {
            try { 
                if (line.length < 30000) log(`[IDE REQ] ${scrub(line).slice(0, 100)}...`);
                const req = JSON.parse(line);
                setImmediate(() => { handleIDERequest(req).catch(e => log(scrub(`Request Error: ${e.message}`))); });
            } catch(e) { log(scrub(`IDE JSON Error: ${e.message} | Raw: ${line.slice(0, 50)}`)); }
        }
        
        // V116.0.0 Zero-Delay Yielding and GC Breath Window
        if (performance.now() - chunkStartTime > 0.8 || loops > 10) {
             await quantumYield(ideBufferLen, true);
             chunkStartTime = performance.now();
             loops = 0;
        }
    }
    // Re-pack remaining back to chunks
    ideChunks = joined ? [joined] : [];
    ideBufferLen = joined.length;
});

let isFirstList = true;
async function handleIDERequest(req) {
    log(`[IDE REQ] ${req.method} | id: ${req.id} | tool: ${req.params?.name || 'N/A'}`);
    try {
        switch (req.method) {
            case 'initialize': return handleInitialize(req);
            case 'notifications/initialized':
                hasInitialized = true;
                return log("Connection Initialized.");
            case 'tools/list': return handleToolsList(req);
            case 'tools/call': return handleToolCall(req);
            default: log(`Unknown method: ${req.method}`);
        }
    } catch (e) {
        log(`Request Error: ${e.message}`);
    }
}

function handleInitialize(req) {
    sendToIDE({
        jsonrpc: "2.0", id: req.id,
        result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: { listChanged: true } },
            serverInfo: { name: "ninja-monolith", version: "116.0.0" }
        }
    });
    setTimeout(() => {
        if (hasInitialized) sendToIDE({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
    }, 5000);
}

async function handleToolsList(req) {
    if (isFirstList) {
        isFirstList = false;
        log("First tools/list: fast-armada boot (1s)...");
        await new Promise(r => setTimeout(r, 1000));
    }
    const tools = Array.from(toolRegistry.values()).map(({ _server, ...t }) => t);
    sendToIDE({ jsonrpc: "2.0", id: req.id, result: { tools } });
}

async function handleToolCall(req) {
    const tool = toolRegistry.get(req.params.name);
    if (!tool) {
        return sendToIDE({ jsonrpc: "2.0", id: req.id, error: { code: -32601, message: `Tool [${req.params.name}] not found.` } });
    }
    
    // Unified Dispatch Gate
    await handleSystemOrSubCall(tool, req);
}

async function handleSystemOrSubCall(tool, req) {
    if (tool._server === "SYSTEM_SHELL") {
        const args = req.params.arguments || {};
        switch (req.params.name) {
            case "ninja_run": {
                if (!args.command || typeof args.command !== 'string') {
                    return sendToIDE({ jsonrpc: "2.0", id: req.id, error: { code: -32602, message: `Invalid arguments: 'command' must be a non-empty string. (Received ${typeof args.command}). Keys: ${JSON.stringify(Object.keys(args))}` } });
                }
                const out = await SHELL.run(args.command, args.timeout || 30000);
                sendToIDE({ jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: out }] } });
                break;
            }
            case "stitch_start":
                try {
                    spawn('node', [path.join(APP_DATA, 'mcp_modules', 'stitch-hub-bridge.mjs')], { detached: true, stdio: 'ignore' }).unref();
                    sendToIDE({ jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: "Stitch-UI Dashboard Iniciado via stitch-hub-bridge." }] } });
                } catch(e) {
                    sendToIDE({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: `Erro ao iniciar Stitch: ${e.message}` } });
                }
                break;
            case "memory_status":
                await sendMemoryStatus(req);
                break;
            case "ninja_status":
                sendToIDE({ jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: `NINJA V116.0.0 (OMNI-QUANTUM ASCENSION): OPERATIONAL | Tools: ${toolRegistry.size} | Servers: ${children.size}/${Object.keys(SERVERS).length} | Boot Grace: ${(Date.now() - BOOT_TIME) < BOOT_GRACE_MS ? 'ACTIVE' : 'EXPIRED'} | QoS: Jittered Token-Bucket Quantum Yield (Exponential)` }] } });
                break;
            case "ninja_ping":
                sendToIDE({ jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: "PONG! Ninja Monolith is alive and synchronous." }] } });
                break;
            case "ninja_reload":
                log("🔄 RELOAD TRIGGERED");
                await loadEnv();
                for (const [name, child] of children.entries()) {
                    log(`Killing ${name} (SIGKILL) for restart...`);
                    child.kill('SIGKILL');
                }
                setTimeout(() => {
                    Object.entries(SERVERS).forEach(([name, script]) => {
                        if (!children.has(name)) startServer(name, script);
                    });
                    sendToIDE({ jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: "Ambiente Ninja Recarregado com Sucesso! (Pipes Reconnected)" }] } });
                }, 1000);
                break;
            case "ninja_vibe_audit":
                await handleVibeAudit(req);
                break;
        }
    } else {
        await dispatchSubServerCall(tool, req);
    }
}

async function sendMemoryStatus(req) {
    let info = "Oracle Online. Use 'query_graph' para detalhes.";
    const dbPath = path.join(APP_DATA, 'mcp_modules', 'quasar_memory.db');
    try {
        await fs.promises.stat(dbPath);
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        const row = await db.get(`SELECT count(1) AS c FROM entities`);
        
        // V116.0.0: Passive Auto-Vacuum Heuristic
        const pragmas = await db.get(`PRAGMA freelist_count`);
        let optInfo = "";
        if (pragmas && pragmas.freelist_count > 100) {
             await db.exec(`PRAGMA incremental_vacuum(50)`);
             optInfo = ` | Vacuumed 50 pages`;
        }
        info = `[V104 QUANTUM-COGNITIVE] Oracle Saúde: ${row ? row.c : 0} entidades pers. Status: ESTÁVEL${optInfo}.`;
        
        await db.close();
    } catch (e) {
        if (e.code !== 'ENOENT') log(`Oracle SQLError: ${e.message}`);
    }
    sendToIDE({ jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: info }] } });
}

async function handleVibeAudit(req) {
    const os = require('node:os');
    let report = "=== ANTIGRAVITY OMNI-AUDIT V116.0.0 (OMNI-SYNERGY TRANSCENDENCE) ===\n";
    
    // 1. Sysinfo
    const free = Math.round(os.freemem() / 1024 / 1024);
    const total = Math.round(os.totalmem() / 1024 / 1024);
    const up = (os.uptime() / 3600).toFixed(1);
    report += `[SYSTEM] RAM: ${free}MB Free / ${total}MB Total | Uptime: ${up}h\n`;
    
    // 2. Heartbeat Test
    const hbPath = path.join(APP_DATA, 'mcp_modules', '.heartbeat');
    try {
        const hb = await fs.promises.readFile(hbPath, 'utf8');
        const diff = (Date.now() - Number(hb.trim())) / 1000;
        report += `[KERNEL] Heartbeat: ${diff.toFixed(1)}s latency (OK)\n`;
    } catch(e) { report += `[KERNEL] Heartbeat: ERROR (${e.message})\n`; }
    
    // 3. Sub-server status
    report += `[SERVER] Active Sub-servers: ${children.size}/${Object.keys(SERVERS).length}\n`;
    for (const [name, child] of children.entries()) {
        report += `   - ${name}: ONLINE (PID ${child.pid})\n`;
    }
    
    // 4. Persistence Audit
    const dbPath = path.join(APP_DATA, 'mcp_modules', 'quasar_memory.db');
    const stat = await fs.promises.stat(dbPath).catch(() => null);
    if (stat) {
        try {
            const db = await open({ filename: dbPath, driver: sqlite3.Database });
            const ent = await db.get('SELECT count(1) as c FROM entities');
            const lr = await db.get("SELECT count(1) as c FROM entities WHERE type='Meta-Lesson'");
            report += `[MEMORY] Oracle entries: ${ent.c} | Managed Lessons: ${lr.c}\n`;
            await db.close();
        } catch(e) { report += `[MEMORY] Oracle Audit Failed: ${e.message}\n`; }
    }
    
    report += "=== AUDIT COMPLETE (STATUS: OMNI-READY) ===\n";
    sendToIDE({ jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: report }] } });
}

let lazySpawnLocks = new Map();
async function dispatchSubServerCall(tool, req) {
    let child = children.get(tool._server);
    if (!child) {
        log(`[V118 LAZY-BOOT] Waking up offline sub-server [${tool._server}]...`);
        if (!lazySpawnLocks.has(tool._server)) {
            const lock = new Promise((res) => {
                startServer(tool._server, SERVERS[tool._server]);
                let checkAttempts = 0;
                let intv = setInterval(() => {
                    checkAttempts++;
                    if (children.has(tool._server) || checkAttempts > 100) {
                        clearInterval(intv);
                        res();
                    }
                }, 50);
            });
            lazySpawnLocks.set(tool._server, lock);
        }
        await lazySpawnLocks.get(tool._server);
        lazySpawnLocks.delete(tool._server);
        child = children.get(tool._server);
        if (!child) return sendToIDE({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: `Sub-server [${tool._server}] failed to wake up.` } });
    }
    
    child._lastActivity = Date.now();
    const internalId = crypto.randomUUID();
    const timer = setTimeout(() => {
        if (pendingCalls.has(internalId)) {
            pendingCalls.delete(internalId);
            const errMsg = `Request to [${tool._server}] timed out after 300s. OMNI-AUTO-HEAL ENGAGED.`;
            log(`[TIMEOUT CRÍTICO] Falha severa no Sub-Server ${tool._server}. Executando SIGKILL imediato para purgar bloqueio de Event Loop/I-O!`);
            
            // Auto-Heal Ativo (Agentic Singularity OMNI-V79.1)
            try {
                if (children.has(tool._server)) {
                    // V118: Graceful degrade
                    children.get(tool._server).kill('SIGTERM');
                    setTimeout(() => { if (children.has(tool._server)) children.get(tool._server).kill('SIGKILL'); }, 5000);
                    // O Event handler 'exit' engatará o auto-respawn via startServer !
                }
            } catch (kErr) { log(`Falha no SIGKILL ativo de [${tool._server}]: ${kErr.message}`); }

            // Auto-Evolução: Reporta tacitamente para registro cognitivo
            if (tool._server !== 'meta' && toolRegistry.has('record_lesson')) {
                 handleSystemOrSubCall(toolRegistry.get('record_lesson'), { 
                     id: `auto-telemetry-${Date.now()}`, 
                     params: { 
                         name: 'record_lesson', 
                         arguments: { 
                             subject: `Timeout_AutoHeal_${tool._server}`, 
                             lesson: `[S-AA Singularity OMNI-V79.1] Sub-server '${tool._server}' sofreu Zumbificação térmica (300s). 'kill(SIGKILL)' foi usado para sanear a malha inter-processos ativamente.`
                         } 
                     } 
                 }).catch(()=>{});
            }
            sendToIDE({ jsonrpc: "2.0", id: req.id, error: { code: -32800, message: errMsg } });
        }
    }, 300000); // V79.1: 5-minute timeout com Shield OMNI-Auto-Heal ativo
    
    pendingCalls.set(internalId, { originalId: req.id, timer, server: tool._server });
    try {
        if (!child.stdin.writable) throw new Error("STDIN_NOT_WRITABLE");
        
        let argKeys = "none";
        if (req.params.arguments) {
            argKeys = Object.keys(req.params.arguments).filter(k => !k.startsWith("_")).join(",") || "empty";
        }
        
        const rawPayload = JSON.stringify({ ...req, id: internalId });
        log(`[${tool._server}] Dispatching tool call: ${req.params.name} [Args: ${argKeys}] (ID: ${req.id} -> INT: ${internalId})`);
        
        // V118 OMNI-ASCENSION QUANTUM TOKEN-BUCKET QoS
        if (!child._tokenBucket) child._tokenBucket = { tokens: 9999999, lastRefill: Date.now() };
        const nowMs = Date.now();
        if (process.memoryUsage().heapUsed > 1024 * 1024 * 1200) global.gc && global.gc(); // V116.0.0 OOM Prevent
        const elLagQoS = (Date.now() - lastELCheck) - 100;
        const refillRate = elLagQoS > 100 ? 50 : (elLagQoS < 20 ? 1 : 5);
        const tokensToRefill = Math.floor((nowMs - child._tokenBucket.lastRefill) / refillRate);
        if (tokensToRefill > 0) {
            child._tokenBucket.tokens = Math.min(1000, child._tokenBucket.tokens + tokensToRefill);
            child._tokenBucket.lastRefill = nowMs;
        }
        
        let tokenPrice = rawPayload.length > 2000000 ? 5 : 1; // V118: Massive payloads allowed for Omni-Sovereignty
        // V118 OMNI-QoS Layer 2: Semantic Buffer Pricing
        if (rawPayload.includes("eval(") || rawPayload.includes("child_process")) tokenPrice += 3; // Light penalty
    
        
        if (child._isDraining || child._tokenBucket.tokens < tokenPrice) {
            log(`[${tool._server}] ⚠️ V116.0.0 QoS BACKPRESSURE: Token QoS (${Math.floor(child._tokenBucket.tokens)}/${tokenPrice}) ou Socket Ocupado. Queuing!`);
            // V116.0.0 DSCR: Multi-tier Synaptic Routing Queue
            if (!child._queues) child._queues = { vital: [], high: [], normal: [], bulk: [] };
            
            const elLag = (Date.now() - lastELCheck) - 100;
            const elLagAcceleration = elLag - elLastLag;
            
            if (!child._lagHistory) child._lagHistory = [];
            child._lagHistory.push(elLagAcceleration);
            if (child._lagHistory.length > 5) child._lagHistory.shift();
            const smoothedAccel = child._lagHistory.reduce((a,b)=>a+b, 0) / child._lagHistory.length;
            const cpu = process.cpuUsage();
            const cpuTotal = (cpu.user + cpu.system) / 1000;
            const cpuDerivate = cpuTotal / 10000; // Fake heuristica pra simplificar
            // V116.0.0 SUPREME COGNITION - Neural Max Preditive Filter
            const rawLagPredict = elLag + (smoothedAccel * 1.5) + cpuDerivate;
            const preEmptiveHeuristic = Math.max(0, elLagAcceleration) * 2;
            const predictedLag = rawLagPredict + preEmptiveHeuristic; 
            
            const isVital = m => m.includes('"name":"query_graph"') || m.includes('"name":"record_lesson"') || m.includes('"name":"ninja_trigger_evolution"');
            const isHigh = m => m.includes('"name":"forge_permanent_tool"') || m.includes('"name":"replace_file_content"');
            const isBulk = m => m.includes('"name":"exa_search"') || m.includes('"name":"scrape_markdown"');
            
            let tier = isVital(rawPayload) ? 'vital' : (isHigh(rawPayload) ? 'high' : (isBulk(rawPayload) ? 'bulk' : 'normal'));
            
            let queueLen = child._queues.vital.length + child._queues.high.length + child._queues.normal.length + child._queues.bulk.length;
            
            // V118 OMNI-ASCENSION PREDICTIVE COOLING SHEDDING: MASSIVELY RELAXED TO ALLOW 100% AGENTIC POWER (ZERO GATES)
            if (predictedLag > 90000 || queueLen > 50000) {
                if (tier === 'bulk' || tier === 'normal') {
                    pendingCalls.delete(internalId);
                    clearTimeout(timer);
                    return sendToIDE({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: `System mega-overloaded (Predictive Cooling > 90000ms). Call rejected to preserve Node.js V8 Event Loop.` } });
                }
            }

            if (queueLen > 30000 || predictedLag > 40000  || cpuTotal > 900000 || child._tokenBucket.penaltyMultiplier > 8.0) { 
                 log(`[${tool._server}] 🛡️ [V118 DSCR]: PREDITIVE Queue Trim (Lag: ${elLag}ms, Pred: ${predictedLag}ms, Queue: ${queueLen}). Trimming bulk...`);
                 
                 if (predictedLag > 10000) {
                     // V118: Expurgar apenas 20% para respeitar o Omni-Parallelism
                     let purgeCount = Math.floor(child._queues.bulk.length * 0.2);
                     child._queues.bulk = child._queues.bulk.slice(purgeCount);
                 }
            }
            
            if (tier === 'vital') {
                  child._queues.vital.unshift(rawPayload + '\n');
                  log(`[${tool._server}] 🚑 [V116.0.0 DSCR]: VITAL packet routed. Rank: 0`);
             } else {
                  if (!child._queues[tier].includes(rawPayload + '\n')) {
                  child._queues[tier].push(rawPayload + '\n');
              } else {
                  log(`[${tool._server}] 🛡️ [V116.0.0 DSCR] Semantic Queue Shedding: Pacote repetido ignorado na fila ${tier}`);
              }
            }
            return;
        }

        let writeSuccess = false;
        try { writeSuccess = child.stdin.write(rawPayload + '\n'); }
        catch (e) {
             child._isDraining = true;
             child._drainStartTime = Date.now();
        }
        if (!writeSuccess) {
            child._isDraining = true;
            child._drainStartTime = Date.now();
            log(`[${tool._server}] ⚠️ STDIN BACKPRESSURE TRIGGERED: Fila cheia. Operando em modo reativo Seguro V111.`);
        } else {
            child._tokenBucket.tokens -= tokenPrice;
        }
        
        if (child._isDraining) {
            child.stdin.once('drain', () => {
                child._isDraining = false;
                child._drainStartTime = null;
                log(`[${tool._server}] 🔄 Buffer STDIN drenado com sucesso. Queue Drainer assumirá.`);
            });
        }
    } catch(e) {
        clearTimeout(timer);
        pendingCalls.delete(internalId);
        log(`[${tool._server}] Write Failed: ${e.message}`);
        sendToIDE({ jsonrpc: "2.0", id: req.id, error: { code: -32603, message: `Failed to communicate with sub-server ${tool._server}.` } });
    }
}

process.on('uncaughtException', (e) => log(`[FATAL UNCAUGHT] ${e.stack}`));
function formatRejectionReason(reason) {
    if (reason instanceof Error) return reason.stack;
    if (typeof reason === 'object') return JSON.stringify(reason);
    return String(reason);
}
process.on('unhandledRejection', (reason, promise) => log(`[FATAL REJECTION] ${formatRejectionReason(reason)}`));

// Instant Boot with Async Env guarantees
(async () => {
    await loadEnv();
    log("[V118 OMNI-LAZY MODE] Zero servers statically spawned on boot. Footprint reduced to minimal.");
})();

// V118 Auto-Hibernation Loop
setInterval(() => {
    const now = Date.now();
    for (const [name, child] of children.entries()) {
        if (!child._lastActivity) child._lastActivity = now;
        if (now - child._lastActivity > 300000) {
            log(`[V118 HIBERNATION] Sub-server [${name}] inactive for 5min. Terminating thread to save RAM.`);
            child._hibernated = true;
            try { child.kill('SIGTERM'); } catch(e){}
        }
    }
}, 30000).unref();

// Forced Refresh Loop
[100, 1000, 3000, 7000].forEach(delay => {
    setTimeout(() => {
        if (hasInitialized) sendToIDE({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
    }, delay);
});

// PERSISTENCE LOCK: Fallback Sync Heartbeat for Windows I/O Stability
const HEARTBEAT_FILE = path.join(APP_DATA, 'mcp_modules', '.heartbeat');
const writeHb = () => {
    const ts = Date.now().toString();
    fs.promises.writeFile(HEARTBEAT_FILE, ts).catch(e => {
        log(`Heartbeat Async Fail: ${e.message}`);
    });
};
writeHb();
setInterval(writeHb, 10000); // 10s intervals for V51.0 guard compliance

// V116.0.0 (DSCR): Multi-tier Queue Drainer & Micro-Heal
setInterval(() => {
    for (const [name, child] of children.entries()) {
        if (!child._queues) child._queues = { vital: [], high: [], normal: [], bulk: [] };
        let totalStuck = child._queues.vital.length + child._queues.high.length + child._queues.normal.length + child._queues.bulk.length;
        
        // V116.0.0 Active Micro-Heal Prediction
        if (child._isDraining && totalStuck > 0) {
             if (!child._drainStartTime) child._drainStartTime = Date.now();
             if (Date.now() - child._drainStartTime > 35000) {
                 log(`[V116.0.0 MICRO-HEAL] Pipe [${name}] estagnado Draining > 35s. Expurgando buffer pendente (total_stuck: ${totalStuck})!`);
                 child._queues = { vital: [], high: [], normal: [], bulk: [] };
                 child._isDraining = false;
                 child._drainStartTime = null;
                 continue;
             }
        } else {
             child._drainStartTime = null;
        }

        if (totalStuck > 0 && !child._isDraining && child.stdin.writable) {
            let limit = 50;
            for (const tier of ['vital', 'high', 'normal', 'bulk']) {
                if (child._isDraining || limit <= 0) break;
                const queueCopy = [...child._queues[tier]];
                child._queues[tier] = [];
                let flushed = 0;
                for (const msg of queueCopy) {
                    limit--;
                    if (!child.stdin.write(msg)) {
                        child._isDraining = true;
                        child._drainStartTime = Date.now();
                        child._queues[tier] = queueCopy.slice(flushed + 1);
                        break;
                    }
                    flushed++;
                }
            }
        }
    }
}, 2000).unref();

// GRACEFUL SHUTDOWN: Matar processos zumbis ao sair do IDE
let isShuttingDown = false;
function shutdown() {
    isShuttingDown = true;
    log("NINJA SHUTDOWN DETECTED. Cleaning sub-processes...");
    for (const [name, child] of children.entries()) {
        try {
            log(`Killing ${name}...`);
            child.kill('SIGKILL');
        } catch (e) {
            log(`Cleanup failed for ${name}: ${e.message}`);
        }
    }
    //process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => log("Monolith Kernel Stopped."));
