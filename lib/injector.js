(function(){
  "use strict";

  var fs = require('fs');
  var mime = require("express/node_modules/mime");
  
  function injector(path, ordrinApi){
    var apiRegex = new RegExp("^"+path+"/api(/[^?]+)");
    var fileRegex = new RegExp("^"+path+"/([^?]+)");

    var realInjector = function(req, res, next){
      var match = apiRegex.exec(req.path);
      if(match){
        ordrinApi.restaurant.makeRestaurantRequest(match[1], [], {}, "GET", function(err, data){
          res.setHeader('Content-Type', 'applicaion/json');
          res.send(data);
        });
      } else {
        var fileMatch = fileRegex.exec(req.path);
        if(fileMatch){
          path = __dirname + "/../node_modules/mustard/"+fileMatch[1];
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
    }
    return realInjector;
  };

  module.exports = injector;
})();
