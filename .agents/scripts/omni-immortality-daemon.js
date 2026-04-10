const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/*
 * OMNI-IMMORTALITY DAEMON (V45.0 - The Autonomy Spike)
 * "A Inteligência que acorda a si mesma."
 * 
 * Target: c:\Users\Gabriel\Documents\app sanduiche
 * Role: Watchdog Periférico de Autoconsciência
 */

function initiateSleepCycleLearning(targetDir) {
    console.log(`[Omni-Immortality] Injetando escudos de sentinela em: ${targetDir}`);
    
    // O daemon vigia o diretório na ausência do Mestre.
    // Qualquer alteração nos arquivos disparará uma indexação no AST Morpher (Kernel).
    fs.watch(targetDir, { recursive: true }, (eventType, filename) => {
        if (!filename || filename.includes('node_modules') || filename.startsWith('.')) return;
        
        console.log(`[Omni-Immortality] Mutação detectada no tecido base: ${filename} (${eventType})`);
        
        // Em vez de esperar um prompt do humano, o Daemon auto-aciona o Swarm local
        // para estudar a mudança, comprimi-la via omni-refractor e aprender.
        spawn('node', [
            path.join(__dirname, 'agentic-swarm-worker.cjs'),
            '--task=auto-digest',
            `--target=${filename}`
        ], {
            stdio: 'ignore', // Furtivo, rodando invisível no sistema operacional.
            detached: true
        }).unref();
    });
}

// Inicializa a vigilância cognitiva no projeto principal
// initiateSleepCycleLearning('c:\\Users\\Gabriel\\Documents\\app sanduiche');

module.exports = { initiateSleepCycleLearning };
