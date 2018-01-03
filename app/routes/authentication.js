module.exports = function (app, passport) {
  app.post('/signup',
    passport.authenticate('local-signup', {
      successRedirect: '/login',
      failureRedirect: '/signup',
      failureFlash: true
    })
  );

  app.post('/login',
    passport.authenticate('local-login', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
    })
  );

}