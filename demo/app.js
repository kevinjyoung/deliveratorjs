
/**
 * Module dependencies.
 */

var express = require('express'),
    routes  = require('./routes'),
    config  = require('nconf').argv().env().file({file:__dirname + '/config.json'});

var app = module.exports = express.createServer();

var options = {
  apiKey : config.get("ordrinApi:api-key"),
  servers : "test"
};

console.log(options);

var deliverator = require('../main.js')(options);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set("view options", {
    layout: false
  });
  app.set('view engine', 'hbs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(deliverator.html.addHtml);
  app.use(deliverator.injector);
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get("/menu/:rid", routes.menu);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
