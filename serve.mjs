// A tiny static server for the film. Pictures loaded over file:// would taint the canvas (no WebGL, no frame export),
// so both the live preview and export.mjs load the page over http://127.0.0.1.
//   node serve.mjs [port]      then open http://127.0.0.1:8017/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };

export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, '') || 'index.html';
    const file = join(root, path);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);          // <audio> seeks with range requests
      if (range) {
        const a = range[1] ? +range[1] : 0, b = range[2] ? +range[2] : body.length - 1;
        res.writeHead(206, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Content-Range': `bytes ${a}-${b}/${body.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 });
        res.end(body.subarray(a, b + 1));
      } else {
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
        res.end(body);
      }
    } catch { res.writeHead(404).end(); }
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const { url } = await serve(+(process.argv[2] || 8017));
  console.log(`serving ${root}\n  open ${url}`);
}
