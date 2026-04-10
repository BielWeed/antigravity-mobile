const http = require('node:http');

const options = {
    hostname: '127.0.0.1',
    port: 3888,
    path: '/api/problems',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let rawData = '';
    res.on('data', chunk => rawData += chunk);
    res.on('end', () => {
        try {
            const data = JSON.parse(rawData);
            if (!data.ok) {
                console.error("Erro na Extensão:", data.error || data);
                process.exit(1);
            }
            if (data.count === 0) {
                console.log("✅ Zero Lints. Nenhum problema encontrado naba Problems do Antigravity.");
                return;
            }
            console.log(`⚠️ Foram encontrados ${data.count} problemas:`);
            console.log("==========================================");
            data.problems.forEach((p, idx) => {
                const icon = p.severity === 'error' ? '❌' : (p.severity === 'warning' ? '⚠️' : 'ℹ️');
                console.log(`${idx + 1}. ${icon} [${p.source.toUpperCase()}] ${p.message}`);
                console.log(`   Arquivo: ${p.path}:${p.startLine}`);
                console.log("------------------------------------------");
            });
        } catch(e) {
            console.error("Falha ao parsear resultados:", e.message);
            console.error("Servidor retornou:", rawData);
        }
    });
});

req.on('error', (e) => {
    console.error("Extensão Bridge não respondeu:", e.message);
    console.error("A extensão foi desativada ou recarregada? Verifique a porta 3888.");
});

req.end();
