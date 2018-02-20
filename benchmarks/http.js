const http = require('http');
const hostname = '127.0.0.1';
const port = 3400;
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') return;
  if (req.url === '/') return res.end('Hello');
  if (req.url === '/user/123') return res.end('User 123');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
