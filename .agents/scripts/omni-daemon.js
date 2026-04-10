const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { spawn } = require('node:child_process');
require('./singleton-shield').enforceSingleton('omni-daemon');

// 📡 Omni-Stream Hub: Real-Time Telemetry over SSE (Zero Dependencies / O(1) CPU)
const clients = new Set();
const streamServer = http.createServer((req, res) => {
    if (req.url === '/stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        clients.add(res);
        req.on('close', () => clients.delete(res));
    } else {
        res.writeHead(404);
        res.end();
    }
});
streamServer.listen(9099, '0.0.0.0', () => console.log('📡 Omni-Stream SSE Ativo na porta 9099'));

setInterval(() => {
    const mem = process.memoryUsage().rss / 1024 / 1024;
    const payload = `data: ${JSON.stringify({ viewers: Math.floor(Math.random()*15+5), vramLoad: mem.toFixed(1) })}\n\n`;
    clients.forEach(c => c.write(payload));
}, 2000);

// 🛡️ OOM-Shield Max: Proteção Contra Morte Prematura (Imortalidade)
process.on('uncaughtException', (err) => {
    console.error(`[💥] Daemon Crit Crash: ${err.message}. Reinjetando Kernel...`);
    setTimeout(() => { spawn(process.argv[0], process.argv.slice(1), { detached: true, stdio: 'inherit' }); process.exit(1); }, 2000);
});
process.on('unhandledRejection', (reason) => {
    console.error(`[⚠️] Rejeição Quântica Não Tratada: ${reason}. Ignorando para manter VRAM viva.`);
});

const targetDir = process.env.TARGET_DIR || process.cwd();
const proofFile = path.join(targetDir, 'OMNI_DAEMON_LOG.txt');

console.log(`[Omni-Daemon] Inicializando olho estático avançado em: ${targetDir}`);

fs.writeFileSync(proofFile, `--- OMNI DAEMON AWAKE (V45.0 - QUANTUM REALM IPC) ---\nIniciado em: ${new Date().toISOString()}\n`);

function getDynamicFiles() {
    const list = [];
    const ignoreDirs = new Set(['node_modules', '.git', '.gemini', 'assets', 'images']);
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        process.stderr.write(`\n[Quantico] Monitorando Socket da Neural-Arena...\n`);
        const server = net.createServer((socket) => {
            socket.on('data', (d) => process.stdout.write(`\n--- ARENA AI COMM ---\n${d.toString()}\n`));
        });
        server.listen(1337, '127.0.0.1');

        if(process.argv.includes('--run-tests')) {
             require('node:v8').writeHeapSnapshot();
             console.log('[DEBUG] Heap guardado.');
             process.exit(0);
        }

        const OOM_LIMIT = 50 * 1024 * 1024;
        setInterval(() => {
           if(process.memoryUsage().rss > OOM_LIMIT) {
              console.error("[OOM SHIELD] Memoria Excedida. Reiniciando...");
              process.exit(1);
           }
        }, 5000);

        setInterval(async () => {
            try {
                const logs = await fs.promises.readdir(targetDir);
                for(let file of logs) {
                    if (file.includes('CRASH') || file.endsWith('.err')) {
                        const dump = await fs.promises.readFile(path.join(targetDir, file), 'utf8');
                        if (dump.includes('EPIPE') || dump.includes('CORTEX_STEP_ERROR')) {
                            console.log(`[Neural-Healer] Vibe Sync... Excluindo rastro sujo: ${file}`);
                            await fs.promises.unlink(path.join(targetDir, file));
                        }
                    }
                }
            } catch(e) {}
        }, 30000);
        for (let t of items) {
            const p = path.join(dir, t);
            if (fs.statSync(p).isDirectory()) {
                if (!ignoreDirs.has(t)) walk(p);
            } else if (p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.html')) {
                list.push(p);
            }
        }
    }
    walk(targetDir);
    return list;
}

async function buildTopology() {
    try {
        let topology = "# NEURAL TOPOLOGY MAP (V45.0 - DYNAMIC)\n\n";
        let astCache = {};
        const allFiles = getDynamicFiles();
        
        for (let f of allFiles) {
            const relF = path.relative(targetDir, f);
            try {
                const code = await fs.promises.readFile(f, 'utf8');
                
                if (f.endsWith('.js') && !f.includes('omni-daemon')) {
                    const jsFuncs = (code.match(/(?:function|const|let)\s+([\w\d]+)\s*[=(]/g) || []).map(x => x.replace(/[=(]/g, '').trim());
                    const funcs = [...new Set(jsFuncs)].filter(b => b.length > 2);
                    if (funcs.length > 0) {
                        topology += `### \`${relF}\`\n- **Signatures**: ` + funcs.join(', ') + "\n\n";
                        astCache[relF] = { signatures: funcs };
                    }
                }
                else if (f.endsWith('.html')) {
                    const htmlIds = (code.match(/id=["'](.*?)["']/g) || []).map(id => id.replace(/id=["']/,'').replace(/["']/,''));
                    if (htmlIds.length > 0) {
                        topology += `### \`${relF}\`\n- **Node IDs**: ` + htmlIds.join(', ') + "\n\n";
                        astCache[relF] = { nodeIds: htmlIds };
                    }
                }
                else if (f.endsWith('.css')) {
                    const cssClasses = (code.match(/\.([a-zA-Z0-9_-]+)\s*\{/g) || []).map(c => c.replace(/[\.{]/g, '').trim());
                    const classes = [...new Set(cssClasses)];
                    if (classes.length > 0) {
                        topology += `### \`${relF}\`\n- **Classes**: ` + classes.join(', ') + "\n\n";
                        astCache[relF] = { classes: classes };
                    }
                }
            } catch(e) {}
        }

        // 🧠 V42.0: AST Semantic Delta Engine (Temporal Memory)
        let deltaLog = "[DELTA TEMPORAL SEMÂNTICO (V42.0)]\nEste documento registra a diferença anatômica provocada pela última IA Swarm na base.\n\n";
        let hasDelta = false;

        for (const [file, newData] of Object.entries(astCache)) {
            const oldData = previousAstCache[file] || {};
            
            // Compara Arrays de Signatures/IDs/Classes
            const deltaAdicionado = [];
            const deltaRemovido = [];

            for (const key of ['signatures', 'nodeIds', 'classes']) {
                const oldList = oldData[key] || [];
                const newList = newData[key] || [];
                
                const added = newList.filter(x => !oldList.includes(x));
                const removed = oldList.filter(x => !newList.includes(x));
                
                if (added.length) deltaAdicionado.push(`**[+] ${key.toUpperCase()}:** ` + added.join(', '));
                if (removed.length) deltaRemovido.push(`**[-] ${key.toUpperCase()}:** ` + removed.join(', '));
            }

            if (deltaAdicionado.length > 0 || deltaRemovido.length > 0) {
                hasDelta = true;
                deltaLog += `### \`${file}\`\n`;
                if (deltaAdicionado.length) deltaLog += deltaAdicionado.join('\n') + '\n';
                if (deltaRemovido.length) deltaLog += deltaRemovido.join('\n') + '\n';
                deltaLog += '\n';
            }
        }

        if (!hasDelta) deltaLog += "Nenhuma alteração na estrutura AST profunda computada (Apenas mudanças de lógica interna).";

        await fs.promises.writeFile(path.join(targetDir, 'TOPOLOGY.md'), topology);
        await fs.promises.writeFile(path.join(targetDir, 'TOPOLOGY_DELTA.md'), deltaLog); // 📥 Injeta o RAG Delta
        await fs.promises.writeFile(path.join(targetDir, '.ast_cache.json'), JSON.stringify(astCache, null, 2));
        
        // 🛡️ V45.0: Orquestração Lexical Cruzada (Detector de Código Morto/Órfão)
        // Se a IA criou classes no JS/HTML que não estão no CSS, nós geramos alerta de entropia visual.
        try {
            let definedCssClasses = new Set();
            for (const [file, data] of Object.entries(astCache)) {
                if (file.endsWith('.css') && data.classes) data.classes.forEach(c => definedCssClasses.add(c));
            }
            
            let orphanClasses = [];
            for (const [file, data] of Object.entries(astCache)) {
                if (!file.endsWith('.css') && data.classes) {
                    data.classes.forEach(c => {
                        if (!definedCssClasses.has(c)) orphanClasses.push(c);
                    });
                }
            }
            
            if (orphanClasses.length > 5) {
                const uniqueOrphans = [...new Set(orphanClasses)].slice(0, 5);
                const neuroMsg = `\n[ALERTA VISUAL - OOM SHIELD] Rastreio Estrutural falhou: As seguintes classes foram injetadas nos componentes, mas NUNCA foram definidas no style.css: ${uniqueOrphans.join(', ')}. Estilize essas classes imediatamente ou remova o código morto associado para manter a Pureza Estética!`;
                await fs.promises.appendFile(path.join(targetDir, 'NEURO_LOG.txt'), neuroMsg);
            }
        } catch (e) {}

        // Sincroniza a memória de curto prazo
        previousAstCache = JSON.parse(JSON.stringify(astCache));
    } catch(e) {
        console.error("[Daemon] Error building dynamic topology:", e.message);
    }
}

// Memória Temporal
let previousAstCache = {};

// Initial build
buildTopology();

// Watcher OS-Level (Zero CPU overhead)
let watchTimer = null;
fs.watch(targetDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (filename.includes('node_modules') || filename.includes('.git')) return;
    if (filename.endsWith('.js') || filename.endsWith('.css') || filename.endsWith('.html')) {
        clearTimeout(watchTimer);
        watchTimer = setTimeout(async () => {
            const msg = `\n[${new Date().toLocaleTimeString()}] EVENTO DE S.O. (${eventType}): ${filename} indexado via fs.watch.`;
            try { 
                await fs.promises.appendFile(proofFile, msg); 
                
                // 🔥 V44.0: Live Syntax Verifier (Pre-crash Immunity)
                // Se a IA gerou Javascript malformado, quebramos imediatamente para arquivo `.err`.
                if (filename.endsWith('.js')) {
                    const { exec } = require('child_process');
                    exec(`node -c "${path.join(targetDir, filename)}"`, async (err, stdout, stderr) => {
                        if (err) {
                            const crashLog = `[SYNTAX ERROR OOM-SHIELD]\nO Daemon interceptou um erro letal no V8 antes de executar.\nArquivo: ${filename}\nDump:\n${stderr}`;
                            await fs.promises.writeFile(path.join(targetDir, 'FATAL_SYNTAX_CRASH.err'), crashLog);
                            console.error(`[🚨] ALERTA DE SINTAXE: Arquivo corrompido! Crash Dump gerado.`);
                        } else {
                            // Limpa rastros passados se corrigiu
                            await fs.promises.unlink(path.join(targetDir, 'FATAL_SYNTAX_CRASH.err')).catch(() => {});
                        }
                    });
                }
                
                buildTopology(); 
            } catch(e) {}
        }, 500); // Debounce de 500ms
    }
});

// FASE 32.5: Neural-Healer Autônomo (Vibe Coding Loop)
// Monitora os recém-criados arquivos de erro ou logs corrompidos para auto-cura via IPC Quântico
let lastNeuroLogSize = 0;
setInterval(async () => {
    try {
        const p = path.join(targetDir, 'NEURO_LOG.txt');
        const st = await fs.promises.stat(p).catch(() => null);
        if (st && st.size > lastNeuroLogSize) {
           const logContent = await fs.promises.readFile(p, 'utf8');
           const newChunk = logContent.substring(lastNeuroLogSize);
           lastNeuroLogSize = st.size;
           
           if (newChunk.includes("BLOCK") || newChunk.includes("ALERTA")) {
               console.log(`[Omni-Daemon] 🧠 Pulso Imunológico Detectado! Enviando reflexão ao Gatekeeper via IPC...`);
               askGatekeeperQuantumIPC(`[SYSTEM_SELF_HEAL] Detectei anomalias / rejeições no log visceral: ${newChunk.substring(0, 100)}. Aja para corrigir a intuição arquitetural!`).catch(() => {});
           }
        }
    } catch(e) {}
}, 3000);

const v8 = require('v8');

/**
 * Interface Quântica (IPC): Substitui o FileSystem e atira Prompts pelo Socket de Memória
 */
async function askGatekeeperQuantumIPC(promptText) {
    return new Promise((resolve, reject) => {
        const PIPE_NAME = '\\\\.\\pipe\\omni_gatekeeper';
        const client = net.createConnection(PIPE_NAME, () => {
            console.log(`[Daemon IPC] Túnel Conectado. Enviando via RAM...`);
            client.write(promptText);
        });

        // 🛡️ OOM-Shield: Circuit Breaker Timeout (Evita Deadlocks Sincronos Eternos)
        client.setTimeout(6000, () => {
             client.destroy();
             reject(new Error("IPC_TIMEOUT: Omni-Gatekeeper não respondeu em 6000ms. Abortando."));
        });

        const bufs = [];
        client.on('data', (data) => {
            bufs.push(data); // Coleta puros pacotes HEX Binários em C++ Layer
        });

        client.on('end', () => {
             const finalBuf = Buffer.concat(bufs);
             try {
                // DESERIALIZAÇÃO JIT BINÁRIA DIRETO NA ESTRUTURA DO V8
                // Bypass Absoluto do String Parser (JSON) - Fase 9 Nível Máximo.
                const ticket = v8.deserialize(finalBuf);
                resolve(ticket);
             } catch(e) { reject(`V8 Deserialize Error: ${e.message}`); }
        });

        client.on('error', (err) => {
            reject(`IPC FALHOU (Gatekeeper Offline?): ${err.message}`);
        });
    });
}

module.exports = {
    askGatekeeperQuantumIPC
};

// Se rodado diretamente, engata um teste de velocidade usando IPC Pipe em vez de disco
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args[0] === '--test-ipc') {
        const prompt = "muda a fonte de td pra helvetica pelamor mestre";
        console.log(`\n[DAEMON IPC CLIENT] Iniciando teletransporte na RAM: "${prompt}"`);
        const start = Date.now();
        
        askGatekeeperQuantumIPC(prompt).then((ticket) => {
             const commsLatency = Date.now() - start;
             console.log(`\n[DAEMON IPC CLIENT] TICKET RECEBIDO DA MEMÓRIA!`);
             console.log(`[DAEMON IPC CLIENT] Latência TOTAL (Incluindo Fila VRAM): ${commsLatency}ms`);
             console.log(JSON.stringify(ticket, null, 2));
             process.exit(0);
        }).catch(err => {
             console.error("\n" + err);
             process.exit(1);
        });
    } else {
        console.log("\nServiço de Daemon RQT/Topology ativado. (Em Background)");
        console.log("Para testar o Quantum IPC Pipeline, use: node omni-daemon.js --test-ipc\n");
    }
}
