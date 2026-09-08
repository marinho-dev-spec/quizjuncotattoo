import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const portIndex = process.argv.indexOf('--port');
const port = Number(process.argv[portIndex + 1] && portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 3002);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  try {
    let route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (['/', '/quiz', '/quiz/'].includes(route)) route = '/quiz/index.html';
    const target = resolve(root, '.' + route);
    if (!target.startsWith(resolve(root) + sep)) { response.writeHead(403).end(); return; }
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 400).end('Página não encontrada.');
  }
}).listen(port, '127.0.0.1', () => console.log('Prévia do quiz: http://127.0.0.1:' + port));
