const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const AGENT_DIR = 'C:\\Users\\Gabriel\\.gemini\\antigravity\\.agents';

async function runDiagnostics() {
    console.log("=== V45.0 OMNI-GENESIS DEEP SYSTEM TEST ===");

    // Test 1: Config Parsing
    try {
        const configPath = path.join(AGENT_DIR, 'configs_neural', 'neural_overdrive_config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.version !== "31.0.0-Omni-Genesis") throw new Error("Config version drift!");
        console.log("✅ Configuração V45 (neural_overdrive_config.json): INTEGRA");
    } catch(e) {
        console.error("❌ Erro na Configuração:", e.message);
    }

    // Test 2: Omni-Refractor Execution
    try {
        const refractor = require(path.join(AGENT_DIR, 'scripts', 'omni-refractor.js'));
        const testFile = 'C:\\Users\\Gabriel\\Documents\\app sanduiche\\style.css'; // Has code
        const result = refractor.refract(testFile);
        if (!result || result.skeletonTokens === undefined) throw new Error("Refractor returned invalid output");
        console.log(`✅ Omni-Refractor (Sensory Array): FUNCIONAL (Compilou File - Redução de ${result.originalSize} bytes para ${result.skeletonTokens} tokens estruturais)`);
    } catch(e) {
         console.error("❌ Erro no Omni-Refractor:", e.message);
    }

    // Test 3: Agentic Swarm Worker Boot Test
    try {
        const workerPath = path.join(AGENT_DIR, 'agentic-swarm-worker.cjs');
        const worker = spawn('node', [workerPath]);
        
        let output = '';
        worker.stdout.on('data', d => output += d);
        
        worker.stdin.write(JSON.stringify({ id: 1, cmd: "ping" }) + '\n');
        
        setTimeout(() => {
            if (output.includes("processed") || output.includes("success")) {
                console.log("✅ Worker OMNI-METATRON: COMUNICAÇÃO IPC ESTÁVEL (Retornou payload processado)");
            } else {
                console.error("❌ Worker OMNI-METATRON: TIMEOUT OU RESPOSTA INVÁLIDA:", output);
            }
            worker.kill();
        }, 1000);
    } catch(e) {
         console.error("❌ Erro no Worker:", e.message);
    }
}

runDiagnostics();
