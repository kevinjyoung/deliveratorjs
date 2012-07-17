(function(){
  "use strict";
  var handlebars = require("handlebars"),
      fs         = require("fs"),
      ordrin     = require("ordrin-api");

  function Html(path, options){
    var ordrinApi = ordrin.init(options);
    var headPath = "./templates/head.html.mustache";
    var headTemplate = handlebars.compile(fs.readFileSync(headPath, "utf8"));

    var menuPath = "./node_modules/mustard/templates/menu.html.mustache";
    var menuTemplate = handlebars.compile(fs.readFileSync(menuPath, "utf8"));
    
    this.getHead = function(data){
      return headTemplate({path:path, data:JSON.stringify(data)});
    }

    this.getMenu = function(data){
      return menuTemplate(data);
    }

    this.getData = function(rid, cb){
      var data = {};
      ordrinApi.restaurant.getDetails(rid, function(err, details){
        if (err){
          console.log(err);
          cb(err, null);
        } else {
          data.menu = details.menu;
          cb(null, data);
        }
      });
    }

    var getAddHtml = function(htmlObject){
      return function(req, res, next){
        req.deliverator = htmlObject;
        next();
      }
    }

    this.addHtml = getAddHtml(this);

    var getRender = function(htmlObject){
      return function(res, rid, template, extra){
        htmlObject.getData(rid, function(err, data){
          if(err){
            console.log(err);
          } else {
            extra.menu = htmlObject.getMenu(data);
            extra.head = htmlObject.getHead(data);
            res.render(template, extra);
          }
        });
      }
    }

    this.render = getRender(this);
  }
  module.exports = Html;
})();
