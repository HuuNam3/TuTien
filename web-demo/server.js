const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 4173);
const root = __dirname;
const projectRoot = path.resolve(__dirname, '..');
const assetRoot = path.join(projectRoot, 'assets');

function loadLocalEnvironment() {
  const envPath = path.join(projectRoot, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) return;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    process.env[match[1]] = value;
  });
}

loadLocalEnvironment();

const gameStateHandler = require('../api/game-state');
const authHandler = require('../api/auth');
const mailHandler = require('../api/mail');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  if (url.pathname === '/api/game-state') {
    gameStateHandler(request, response);
    return;
  }
  if (url.pathname === '/api/auth') {
    authHandler(request, response);
    return;
  }
  if (url.pathname === '/api/mail') {
    mailHandler(request, response);
    return;
  }
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = pathname.startsWith('/assets/')
    ? path.normalize(path.join(projectRoot, pathname))
    : path.normalize(path.join(root, pathname));

  const isAllowedWebFile = filePath.startsWith(root);
  const isAllowedAssetFile = pathname.startsWith('/assets/') && filePath.startsWith(assetRoot);
  if (!isAllowedWebFile && !isAllowedAssetFile) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    const headers = {
      'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
    };
    if (pathname.startsWith('/assets/')) {
      headers['Cache-Control'] = pathname.startsWith('/assets/Resources/Data/')
        ? 'no-store'
        : 'public, max-age=3600';
    }
    response.writeHead(200, headers);
    response.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Web demo running on port ${port}`);
});
