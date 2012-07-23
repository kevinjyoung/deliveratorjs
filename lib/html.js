(function(){
  "use strict";
  var handlebars = require("handlebars"),
      fs         = require("fs"),
      ordrin     = require("ordrin-api");

  function Html(path, ordrinApi){
    this.api = ordrinApi;
    
    var headPath = __dirname + "/../templates/head.html.mustache";
    var headTemplate = handlebars.compile(fs.readFileSync(headPath, "utf8"));

    var menuPath = __dirname + "/../node_modules/mustard/templates/menu.html.mustache";
    var menuTemplate = handlebars.compile(fs.readFileSync(menuPath, "utf8"));
    
    this.getHead = function(rid, data, address, render){
      console.log(data);
      return headTemplate({path:path, data:JSON.stringify(data.menu), rid:rid, address:address, render:render});
    }

    this.getSimpleHead = function(rid, address){
      console.log(address);
      return headTemplate({path:path, rid:rid, address:address, render:true});
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
      return function html_add_html(req, res, next){
        req.deliverator = htmlObject;
        next();
      }
    }

    this.addHtml = getAddHtml(this);

    var getRender = function(htmlObject){
      return function html_render(res, rid, template, extra, address, renderMenu){
        htmlObject.getData(rid, function(err, data){
          if(err){
            console.log(err);
          } else {
            if(renderMenu){
              extra.menu = htmlObject.getMenu(data);
            }
            extra.head = htmlObject.getHead(rid, data, JSON.stringify(address), !renderMenu);
            res.render(template, extra);
          }
        });
      }
    }

    this.render = getRender(this);
    
    var getRenderSimple = function(htmlObject){
      return function html_simple_render(res, rid, template, extra, address){
        extra.head = htmlObject.getSimpleHead(rid, JSON.stringify(address));
        res.render(template, extra);
      }
    }

    this.renderSimple = getRenderSimple(this);
  }
  module.exports = Html;
})();
