const polka = require('polka');
const app = polka();

function one(req, res, next) {
  req.one = true;
  next();
}

function two(req, res, next) {
  req.two = true;
  next();
}

app
  .use(one, two)
  .get('/favicon.ico', _ => {})
  .get('/', (req, res) => res.end('hello world'))
  .post('/articles', (req, res) => res.end('POST /articles'))
  .get('/articles', (req, res) => res.end('GET /articles'))
  .get('/:name', (req, res) => res.end(`Name: ${req.params.name}`))
  .get('/uno', (req, res) => res.end('GET /uno'))
  .get('/dos', (req, res) => res.end('GET /dos'))
  .get('/tres', (req, res) => res.end('GET /tres'))
  .get('/quatro', (req, res) => res.end('GET /quatro'))
  .get('/sinco', (req, res) => res.end('GET /sinco'))
  .get('/user/:id', (req, res) => {
    res.end(`User: ${req.params.id}`);
  })
  .get('/user/:userId/project/:projectId', (req, res) => {
    res.end(`User: ${req.params.userId} Project: ${req.params.projectId}`);
  });


const articles = polka();
articles.get('/', (req, res) => res.end('should be at /library/articles'));
articles.get('/popular', (req, res) => res.end('should be at /library/articles/popular'));

const library = polka();
library.get('/', (req, res) => res.end('should be at /library'));
library.get('/articles', (req, res) => res.end('should be at /library/articles'));
library.use('/articles', articles);

app.use('/library', library);
app.listen(4500);
