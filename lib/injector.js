(function(){
  "use strict";

  var fs = require('fs');
  var mime = require("express/node_modules/mime");
  
  function injector(path){
    var regex = new RegExp("^"+path+"/([^?]+)");
    var realInjector = function(req, res, next){
      var match = regex.exec(req.path);
      if(match){
        path = __dirname + "/../node_modules/mustard/"+match[1];
        fs.readFile(path, "utf8", function(err, data){
          if(err){
            next(err);
          } else {
            var type = mime.lookup(req.path);
            var charset = mime.charsets.lookup(type);
            res.setHeader('Content-Type', type+(charset?';chrarset='+charset:''));
            res.send(data);
          }
        });
      } else {
        next();
      }
    }
    return realInjector;
  };

  module.exports = injector;
})();
