(function(){
  "use strict";

  function injector(path){
    var regex = RegExp.compile("^"+path+"/([^?]+)");
    function injector(req, res, next){
      var match = regex.exec(req.path);
      if(match){
        path = "./node_modules/mustard/"+match[1];
        fs.readFile(path, "utf8", function(err, data){
          if(err){
            next(err);
          } else {
            res.send(data);
          }
        }
      }
      next();
    }
  };

  module.exports = injector
})();
