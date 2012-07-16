(function(){
  "use strict";
  var handlebars = require("handlebars"),
      fs         = require("fs"),
      ordrin     = require("ordrin-api");

  function Html(path, options){
    var ordrinApi = ordrin.init(options);
    var headPath = "./templates/head.html.mustache";
    var headTemplate = handlebars.compile(fs.readFileSync(headPath, "utf8"));
    var head = headTemplate({path:path})

    var menuPath = "./node_modules/mustard/templates/menu.html.mustache";
    var menuTemplate = handlebars.compile(fs.readFileSync(menuPath, "utf8"));
    
    this.getHead = function(){
      return head;
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

    this.render = function(res, rid, template, extra){
      this.getData(req.params.rid, function(err, data){
        if(err){
          console.log(err);
        } else {
          var menu = this.getMenu(data);
          var head = this.getHead();
          extra.data = JSON.stringify(data.menu);
          extra.menu = menu;
          extra.head = head;
          res.render("menu", {data: JSON.stringify(data.menu), menu: menu, head: head});
        }
      });
    }

    this.addHtml = function(req, res, next){
      req.deliverator = this;
      next();
    }
  }
  module.exports = Html;
})();
