import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.glb':'model/gltf-binary', '.png':'image/png', '.svg':'image/svg+xml' };
createServer(async (req, res) => {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const safePath = normalize(join(root, requested === '/' ? 'index.html' : requested));
  if (!safePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  try { const data = await readFile(safePath); res.writeHead(200, {'Content-Type': types[extname(safePath)] || 'application/octet-stream'}); res.end(data); }
  catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Mangyang AR running at http://localhost:4173'));
