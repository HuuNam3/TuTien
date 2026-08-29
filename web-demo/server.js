const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 4173);
const root = __dirname;
const projectRoot = path.resolve(__dirname, '..');
const assetRoot = path.join(projectRoot, 'assets');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
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

    response.writeHead(200, {
      'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
    });
    response.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Web demo running on port ${port}`);
});
