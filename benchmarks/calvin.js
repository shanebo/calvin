const calvin = require('../lib/calvin');
const app = calvin();

function one(req, res, next) {
  req.one = true;
  next();
}

function two(req, res, next) {
  req.two = true;
  next();
}

function param1(req, res, next) {
  next();
}

function param2(req, res, next) {
  next();
}

app.param('userId', param1);
app.param('projectId', param2);

app
  .use(one)
  .use(two)
  .get('/favicon.ico', _ => { })
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




const articles = calvin();
articles.get('/', (req, res) => res.end('should be at /library/articles'));
articles.get('/popular', (req, res) => res.end('should be at /library/articles/popular'));

const library = calvin();
library.get('/', (req, res) => res.end('should be at /library'));
library.get('/articles', (req, res) => res.end('should be at /library/articles'));
library.mount('/articles', articles);

app.mount('/library', library);
app.listen(3000);


// const library = calvin();
// const articles = calvin();
// const gospel = calvin();

// app.name = 'main app';
// library.name = 'library app';
// articles.name = 'articles app';
// gospel.name = 'gospel app';



// gospel.get('/', (req, res) => res.end('should be at /library/articles/gospel'));

// articles.get('/', (req, res) => res.end('should be at /library/articles'));
// articles.mount('/gospel', gospel);

// library.get('/', (req, res) => res.end('should be at /library'));
// library.mount('/articles', articles);

// app.mount('/library', library);




// function param1(req, res, next) {
//   // console.log('param 1');
//   next();
// }

// function param2(req, res, next) {
//   // console.log('param 2');
//   next();
// }


// app.param('userId', param1);
// app.param('projectId', param2);

// // app.get('/', (req, res) => res.send('Hello'));

// app.get('/object', (req, res) => res.send({
//   foo: 'boo',
//   moo: 'choo'
// }));

// app.get('/num', (req, res) => res.send(400));

// app.get('/user/:userId', (req, res) => {
//   res.end(`User: ${req.params.userId}`);
// });

// app.get('/user/:userId/project/:projectId', (req, res) => {
//   res.end(`User: ${req.params.userId} on project: ${req.params.projectId}`);
// });


// app.get('/yo/:name',
//   (req, res, next) => {
//     res.msg = 'it';
//     next();
//   },
//   (req, res, next) => {
//     res.msg += ' works';
//     next();
//   },
//   (req, res) => {
//     res.end(res.msg);
//   }
// );






// // console.log('\n');

// app.listen(3000);


// [
//   '/',
//   '/library/articles/gospel',
//   '/library/articles',
//   '/library',
//   '/object',
//   '/num',
//   '/yo/joe',
//   '/user/123',
//   '/user/123/project/456'
// ].forEach(pathname => {
//   console.log('\n');
//   console.log(pathname);
//   const req = {
//     method: 'GET',
//     pathname
//   };

//   const res = {
//     end: str => console.log(str),
//     send: str => console.log(str)
//   };

//   app.hydrate(req, res);
// });


