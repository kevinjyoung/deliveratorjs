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

    var restaurantsHeadPath = __dirname + "/../templates/restaurant_head.html.mustache";
    var restaurantsHeadTemplate = handlebars.compile(fs.readFileSync(restaurantsHeadPath, "utf8"));
    
    var restaurantsPath = __dirname + "/../node_modules/mustard/templates/restaurants.html.mustache";
    var restaurantsTemplate = handlebars.compile(fs.readFileSync(restaurantsPath, "utf8"));
    
    this.getHead = function(rid, data, address, render){
      var hash = {path:path, data:JSON.stringify(data.menu), rid:rid, address:address, render:render};
      return headTemplate(hash);
    }

    this.getSimpleHead = function(rid, address){
      return headTemplate({path:path, rid:rid, address:address, render:"menu"});
    }

    this.getRestaurantsHead = function(address, menuUri, dateTime, render, data){
      if(dateTime.toUpperCase() === "ASAP"){
        dateTime = '"'+dateTime+'"';
      }
      var hash = {path:path, data:JSON.stringify(data.restaurants), address:address, dateTime:dateTime, menu_uri:menuUri, render:render};
      return restaurantsHeadTemplate(hash);
    }

    this.getSimpleRestaurantsHead = function(address, menuUri, dateTime){
      if(dateTime.toUpperCase() === "ASAP"){
        dateTime = '"'+dateTime+'"';
      }
      return restaurantsHeadTemplate({path:path, address:address, dateTime:dateTime, menu_uri:menuUri, render:"restaurants"});
    }

    this.getMenu = function(data){
      return menuTemplate(data);
    }

    this.getRestaurants = function(data){
      return restaurantsTemplate(data);
    }

    this.getData = function(rid, cb){
      var data = {};
      ordrinApi.restaurant.getDetails(rid, function(err, details){
        if (err){
          cb(err, null);
        } else {
          data.menu = details.menu;
          cb(null, data);
        }
      });
    }

    this.getRestaurantList = function(address, dateTime, cb){
      ordrinApi.restaurant.getDeliveryList(dateTime, address, function(err, data){
        if(err){
          cb(err, null);
        } else {
          cb(null, {restaurants:data});
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
      return function html_render(res, rid, template, extra, renderMenu, address){
        htmlObject.getData(rid, function(err, data){
          if(err){
            console.log(err);
          } else {
            if(renderMenu){
              extra.menu = htmlObject.getMenu(data);
            }
            extra.head = htmlObject.getHead(rid, data, JSON.stringify(address), renderMenu?"none":"menu");
            res.render(template, extra);
          }
        });
      }
    }

    this.render = getRender(this);

    var getRenderRestaurants = function(htmlObject){
      return function html_restaurants_render(res, template, extra, address, menuUri, dateTime, renderList){
        htmlObject.getRestaurantList(address, dateTime, function(err, data){
          if(err){
            console.log(err);
          } else {
            if(renderList){
              var params = {}
              for(var prop in address){
                if(address.hasOwnProperty(prop)){
                  params[prop] = encodeURIComponent(address[prop] || '');
                }
              }
              params.dateTime = dateTime;
              params.menu_uri = menuUri;
              for(var i=0; i<data.restaurants.length; i++){
                data.restaurants[i].params = params;
              }
              extra.restaurants = htmlObject.getRestaurants(data);
            }
            extra.head = htmlObject.getRestaurantsHead(JSON.stringify(address), menuUri, dateTime, renderList?"none":"restaurants", data);
            res.render(template, extra);
          }
        });
      }
    }

    this.renderRestaurants = getRenderRestaurants(this);
    
    var getRenderSimple = function(htmlObject){
      return function html_simple_render(res, rid, template, extra, address){
        extra.head = htmlObject.getSimpleHead(rid, JSON.stringify(address));
        res.render(template, extra);
      }
    }

    this.renderSimple = getRenderSimple(this);

    var getRenderRestaurantsSimple = function(htmlObject){
      return function html_simple_restaurants_render(res, template, extra, address, menuUri, dateTime){
        extra.head = this.getSimpleRestaurantsHead(JSON.stringify(address), menuUri, dateTime);
        res.render(template, extra);
      }
    }

    this.renderRestaurantsSimple = getRenderRestaurantsSimple(this);

    var getDefaultRestaurantListMiddlewareGetter = function(htmlObject){
      return function(template, menuUri){
        return function html_default_restaurants_middleware(req, res){
          var address;
          var addr = req.param("addr");
          var city = req.param("city");
          var state = req.param("state");
          var zip = req.param("zip");
          var phone = req.param("phone");
          var addr2 = req.param("addr2");
          try{
            address = new req.deliverator.api.Address(addr, city, state, zip, phone, addr2);
          } catch(e) {
            console.log(e);
          }
          var dateTime = req.param("time", "ASAP");
          htmlObject.renderRestaurants(res, template, {}, address, menuUri, dateTime, true);
        }
      }
    }

    this.getDefaultRestaurantListMiddleware = getDefaultRestaurantListMiddlewareGetter(this);

    var getDefaultMenuMiddlewareGetter = function(htmlObject){
      return function(template){
        return function html_default_menu_middleware(req, res){
          var address;
          var addr = req.param("addr");
          var city = req.param("city");
          var state = req.param("state");
          var zip = req.param("zip");
          var phone = req.param("phone");
          var addr2 = req.param("addr2");
          try{
            address = new req.deliverator.api.Address(addr, city, state, zip, phone, addr2);
          } catch(e) {
            console.log(e);
          }
          var dateTime = req.param("time", "ASAP");
          htmlObject.render(res, req.params.rid, template, {}, true, address);
        }
      }
    }

    this.getDefaultMenuMiddleware = getDefaultMenuMiddlewareGetter(this);
  }
  module.exports = Html;
})();
