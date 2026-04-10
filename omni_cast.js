const type = process.argv[2] || 'thought';
const text = process.argv.slice(3).join(' ');

if (!text) {
    console.error("Uso: node omni_cast.js [type] [texto...]");
    process.exit(1);
}

fetch('http://127.0.0.1:3777/api/agent-reply', {
    method: 'POST',
    body: JSON.stringify({ type, text }),
    headers: { 'Content-Type': 'application/json' }
}).catch(e => {}); // Silencia erros para não sujar o terminal do agente
