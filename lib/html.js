(function(){
  "use strict";
  var handlebars = require("handlebars"),
      fs         = require("fs"),
      ordrin     = require("ordrin-api");

  function Html(path, options){
    ordrinApi = ordrin.init(options);
    var headPath = "./templates/head.html.mustache";
    var headTemplate = fs.readFileSync(headPath, "utf8")

    var menuPath = "./node_modules/mustard/templates/menu.html.mustache";
    var menuTemplate = fs.readFileSync(menuPath, "utf8");
    
    this.getHead = function(){
      return handlebars.render(headTemplate, {path: this.path});
    }

    this.getMenu = function(data){
      return handlebars.render(menuTemplate, data);
    }

    this.getData = function(rid){
      var data = {};
      ordrinApi.restaurant.getDetails(rid, function(err, details){
        if (err){
          console.log(err);
        }
        data.menu = details.menu;
      });
      return data;
    }
  }

  module.exports = Html;
})();
