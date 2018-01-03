module.exports = function (app) {

  // RENDER THE index.ejs VIEW
  app.get('/', function (req, res) {
    return res.render('index.ejs');
  });

  // RENDER THE login.ejs VIEW
  app.get('/login', function (req, res) {
    return res.render('login.ejs');
  });

  // RENDER THE signup.ejs VIEW
  app.get('/signup', function (req, res) {
    return res.render('signup.ejs');
  });

}