const fs = require('node:fs');
const path = require('node:path');

// 1x1 pixel transparent PNG
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const publicDir = path.join(__dirname, 'public');

fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pixel);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pixel);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pixel);

console.log('✅ Icons dummy files injected into public/ directory!');
