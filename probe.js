const http2 = require('node:http2');
const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');
const execAsync = util.promisify(require('node:child_process').exec);

async function detectLanguageServer() {
  const { stdout: raw } = await execAsync(
    'powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'language_server_windows_x64.exe\' } | Select-Object -ExpandProperty CommandLine"',
    { encoding: 'utf-8' }
  );
  const target = raw.split('\n').find(l => l.includes('--workspace_id')) || raw.split('\n')[0];
  const csrfMatch = /--csrf_token\s+([a-f0-9-]+)/.exec(target);
  return csrfMatch ? { csrfToken: csrfMatch[1] } : null;
}

async function findPorts() {
    const { stdout: tempPids } = await execAsync(
      'powershell -Command "Get-Process language_server_windows_x64 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"',
      { encoding: 'utf-8' }
    );
    const pids = tempPids.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const allPorts = [];
    for (const pid of pids) {
      const { stdout: netstat } = await execAsync(
        `powershell -Command "netstat -ano | Select-String LISTENING | Select-String '${pid}'"`,
        { encoding: 'utf-8' }
      );
      const ports = [...netstat.matchAll(/:(\d+)\s+0\.0\.0\.0/g)].map(m => Number.parseInt(m[1], 10));
      allPorts.push(...ports);
    }
    return allPorts;
}

const certPath = path.join(
  process.env.LOCALAPPDATA || '',
  'Programs', 'Antigravity', 'resources', 'app', 'extensions',
  'antigravity', 'dist', 'languageServer', 'cert.pem'
);

(async () => {
    const info = await detectLanguageServer();
    const ports = await findPorts();
    const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath) : null;
    
    // Dynamically pick the target port instead of being hardcoded
    const port = ports.length > 0 ? ports[0] : 64244; 
    console.log("Probing port", port);
    
    const client = http2.connect(`https://127.0.0.1:${port}`, {
      ca,
      rejectUnauthorized: false
    });
    
    client.on('error', (err) => console.error("HTTP2 Err", err));

    const req = client.request({
      ':method': 'POST',
      ':path': '/codeium.chat.v1.ChatService/StreamChat',
      'content-type': 'application/json',
      'x-codeium-csrf-token': info.csrfToken,
      'connect-protocol-version': '1'
    });
    
    req.write(JSON.stringify({}));
    req.end();

    const chunks = [];
    req.on('response', (headers) => {
        console.log("HEADERS:", headers[':status'], headers['content-type']);
    });
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
        console.log("RESPONSE:", Buffer.concat(chunks).toString('utf-8'));
        client.close();
    });
})();
