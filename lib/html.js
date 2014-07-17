(function(){
  "use strict";
  var handlebars = require("handlebars"),
      fs         = require("fs"),
      ordrin     = require("ordrin-api"),
      _          = require("underscore");

  var paths = {
    head            : __dirname + "/../templates/head.html.mustache",
    addressHead     : __dirname + "/../templates/address_head.html.mustache",
    restaurantsHead : __dirname + "/../templates/restaurant_head.html.mustache",
    confirmHead     : __dirname + "/../templates/confirm_head.html.mustache",
    menu            : __dirname + "/../node_modules/mustard/templates/menu.html.mustache",
    restaurants     : __dirname + "/../node_modules/mustard/templates/restaurants.html.mustache",
    confirm         : __dirname + "/../node_modules/mustard/templates/confirm.html.mustache"
  },

  // generate templates out of all paths. Same keys as above.
  templates = _.object( _.map( paths, function( path, name ) {
    return [ name, handlebars.compile( fs.readFileSync( path, 'utf8' ) ) ];
  })),

  _getHead, _getSimpleHead, _getAddressHead, _getRestaurantsHead, _getSimpleRestaurantsHead,
  _getConfirmHead, _getSimpleConfirmHead;
  
  function isString(val){
    return typeof val === "string" || val instanceof String;
  }

  function Html(path, ordrinApi){
    this.api = ordrinApi;
    this.path = path;

    this.getAnyHead = _.bind( _getAnyHead, this );

    this.getHead = _.bind( _getHead, this );
    this.getSimpleHead = _.bind( _getSimpleHead, this );
    this.getAddressHead = _.bind( _getAddressHead, this );
    this.getRestaurantsHead = _.bind( _getRestaurantsHead, this );
    this.getSimpleRestaurantsHead = _.bind( _getSimpleRestaurantsHead, this );
    this.getConfirmHead = _.bind( _getConfirmHead, this );
    this.getSimpleConfirmHead = _.bind( _getSimpleConfirmHead, this );

    this.getMenu = function(data){
      return templates.menu(data);
    };

    this.getRestaurants = function(data){
      return templates.restaurants(data);
    };

    this.getData = function(rid, cb){
      var data = {};
      ordrinApi.restaurant.getDetails(rid, function(err, details){
        if (err){
          cb(err, null);
        } else {
          data.menu = details.menu;
          delete details.menu;
          data.details = details;
          cb(null, data);
        }
      });
    };

    this.getRestaurantList = function(address, dateTime, cb){
      ordrinApi.restaurant.getDeliveryList(dateTime, address, function(err, data){
        if(err){
          cb(err, null);
        } else {
          cb(null, {restaurants:data});
        }
      });
    };

    var getAddHtml = function(htmlObject){
      return function html_add_html(req, res, next){
        req.deliverator = htmlObject;
        next();
      };
    };

    this.addHtml = getAddHtml(this);

    var getRender = function(htmlObject){
      return function html_render(res, rid, template, extra, renderMenu, address, deliveryTime, confirmUrl, cb ){
        htmlObject.getData(rid, function(err, data){
          if(err){
            console.log(err);
            if( _.isFunction(cb) ) { cb( err ); }
          } else {
            if(renderMenu){
              data.address = address;
              data.deliveryTime = deliveryTime;
              data.confirmUrl = confirmUrl;
              extra.menu = htmlObject.getMenu(data);
            }
            if(extra.head_init) {
              data.head_init = _.map(extra.head_init, function(val, key) {
                return {name : key, val : val };
              });
            }
            var isMobile = extra.isMobile ? extra.isMobile : false;
            var affLogo = extra.aff_data ? extra.aff_data.affSmallLogoPath : '';
            var affTyHtml = extra.aff_data ? extra.aff_data.affThankyouHtml : '';
            var templateData = {
              details       : JSON.stringify( data.details ),
              data          : JSON.stringify( data.menu ),
              rid           : rid,
              address       : JSON.stringify( address ),
              render        : !renderMenu,
              deliveryTime  : deliveryTime,
              confirmUrl    : confirmUrl,
              head_init     : data.head_init,
              isMobile      : isMobile,
              affLogo       : affLogo,
              affTyHtml     : affTyHtml
            };
            //extra.head = htmlObject.getHead( rid, data, J;SON.stringify(address), !renderMenu, deliveryTime, confirmUrl, isMobile, affLogo, affTyHtml );
            extra.head = htmlObject.getHead( templateData );
            res.render(template, extra);
            if( _.isFunction(cb) ) { cb( null ); }
          }
        });
      };
    };

    this.render = getRender(this);

    var getRenderRestaurants = function(htmlObject){
      return function html_restauranhats_render( res, template, extra, address, menuUri, dateTime, renderList, filterRestaurants, additQs, cb ){
        htmlObject.getRestaurantList(address, dateTime, function(err, data){
          if(err){
            console.log(err);
            if( _.isFunction(cb) ) { cb( err ); }
          } else {
            if( _.isFunction(filterRestaurants) ) {
              data = filterRestaurants( data );
            }
            if( data.restaurants.length === 0 ) {
              extra.hasNoRestaurants = true;
            }
            if(renderList){
              var params = {};
              for(var prop in address){
                if(address.hasOwnProperty(prop)){
                  params[prop] = encodeURIComponent(address[prop] || '');
                }
              }
              params.dateTime = dateTime;
              params.menu_uri = menuUri;
              params.additQs  = additQs;
              for(var i=0; i<data.restaurants.length; i++){
                data.restaurants[i].params = params;
              }
              extra.restaurants = htmlObject.getRestaurants(data);
            }
            var isMobile = extra.isMobile ? extra.isMobile : false;
            var affRestCss = extra.aff_data ? extra.aff_data.affRestCss : null;
            extra.head = htmlObject.getRestaurantsHead( JSON.stringify(address), menuUri, dateTime, !renderList, data, isMobile, additQs, affRestCss );
            res.render(template, extra);
            if( _.isFunction(cb) ) { cb( null ); }
          }
        });
      };
    };

    this.renderRestaurants = getRenderRestaurants(this);
    
    var getRenderSimple = function(htmlObject){
      return function html_simple_render(res, rid, template, extra, address, dateTime, confirmUrl){
        var isMobile = extra.isMobile ? extra.isMobile : false;
        var noAngular = extra.noAngular ? extra.noAngular : false;
        extra.head = htmlObject.getSimpleHead(rid, JSON.stringify(address), dateTime, confirmUrl, isMobile, noAngular);
        res.render(template, extra);
      };
    };

    this.renderSimple = getRenderSimple(this);

    var getRenderAddress = function(htmlObject){
      return function html_address_render(res, rid, template, extra, address, dateTime, confirmUrl){
        var isMobile = extra.isMobile ? extra.isMobile : false;
        var noAngular = extra.noAngular ? extra.noAngular : false;
        var affSplashCss = extra.aff_data ? extra.aff_data.affSplashCss : null;
        extra.head = htmlObject.getAddressHead(rid, JSON.stringify(address), dateTime, confirmUrl, isMobile, noAngular, affSplashCss );
        res.render(template, extra);
      };
    };

    this.renderAddress = getRenderAddress(this);

    var getRenderRestaurantsSimple = function(htmlObject){
      return function html_simple_restaurants_render(res, template, extra, address, menuUri, dateTime){
        extra.head = this.getSimpleRestaurantsHead(JSON.stringify(address), menuUri, dateTime);
        res.render(template, extra);
      };
    };

    this.renderRestaurantsSimple = getRenderRestaurantsSimple(this);

    var getRenderConfirmSimple = function(htmlObject){
      return function html_simple_render(res, rid, template, extra, address, dateTime, tray, tip){
        extra.head = htmlObject.getSimpleConfirmHead(rid, JSON.stringify(address), dateTime, tray, tip);
        res.render(template, extra);
      };
    };

    this.renderConfirmSimple = getRenderConfirmSimple(this);

    var getDefaultConfirmMiddlewareGetter = function(htmlObject){
      return function(template, render_server, extra){
        extra = typeof extra === "undefined" ? {} : extra;
        return function html_default_confirm_middleware(req, res){
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
          var dateTime = req.param("dateTime", "ASAP");
          var tray = req.param("tray");
          var tip = req.param("tip");
          var rid = req.param("rid");
          htmlObject.renderConfirmSimple(res, rid, template, extra, address, dateTime, tray, tip);
        };
      };
    };

    this.getDefaultConfirmMiddleware = getDefaultConfirmMiddlewareGetter(this);

    var getDefaultRestaurantListMiddlewareGetter = function(htmlObject){
      return function(template, menuUri, render_server, extra){
        extra = typeof extra === "undefined" ? {} : extra;
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
          if(render_server){
            htmlObject.renderRestaurants(res, template, extra, address, menuUri, dateTime, true);
          } else {
            htmlObject.renderRestaurantsSimple(res, template, extra, address, menuUri, dateTime);
          }
        };
      };
    };

    this.getDefaultRestaurantListMiddleware = getDefaultRestaurantListMiddlewareGetter(this);

    var getDefaultMenuMiddlewareGetter = function(htmlObject){
      return function(template, confirmUri, render_server, extra){
        extra = typeof extra === "undefined" ? {} : extra;
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
          if(render_server){
            htmlObject.render(res, req.params.rid, template, extra, true, address, dateTime, confirmUri);
          } else {
            htmlObject.renderSimple(res, req.params.rid, template, extra, address, dateTime, confirmUri);
          }
        };
      };
    };

    this.getDefaultMenuMiddleware = getDefaultMenuMiddlewareGetter(this);
  }


  _getAnyHead = function get_any_head( templateName, data ) {
    // do the mystic dateTime check. See if really necessary?
    if( data.dateTime && isString(data.dateTime) ) {
      dateTime = '"' + dateTime + '"';
    }
    // attach the path
    data.path = this.path;

    if( templateName === 'menu' ) {
      return templates.head( data );
    } else if( templateName === 'address' ) {
      return templates.addressHead( data );
    } else if( templateName === 'restaurants' ) {
      return templates.restaurantsHead( data );
    } else if( templateName === 'confirm' ) {
      return templates.confirmHead( data );
    } else {
      // bad template name
      return null;
    }
  };


/*
  _getHead = function get_head( rid, data, address, render, dateTime, confirmUrl, isMobile, affLogo, affTyHtml ) {
    if( isString( dateTime ) ){
      dateTime = '"'+dateTime+'"';
    }
    var hash = {path:this.path, details:JSON.stringify(data.details), data:JSON.stringify(data.menu), rid:rid, address:address, render:render, deliveryTime: dateTime, confirmUrl:confirmUrl, head_init:data.head_init, isMobile : isMobile, affLogo : affLogo, affTyHtml : affTyHtml };
    return templates.head(hash);
  };
*/

  _getHead = function get_head( data ) {
    return this.getAnyHead( 'menu', data );
  };

  _getSimpleHead = function( rid, address, dateTime, confirmUrl, isMobile, noAngular ){
    if(isString(dateTime)){
      dateTime = '"'+dateTime+'"';
    }
    return templates.head({path:this.path, rid:rid, address:address, render:true, deliveryTime: dateTime, confirmUrl:confirmUrl, isMobile : isMobile, noAngular: noAngular });
  };

  _getAddressHead = function( rid, address, dateTime, confirmUrl, isMobile, noAngular, affSplashCss ){
    if(isString(dateTime)){
      dateTime = '"'+dateTime+'"';
    }
    return templates.addressHead({path:this.path, rid:rid, address:address, render:true, deliveryTime: dateTime, confirmUrl:confirmUrl, isMobile : isMobile, noAngular: noAngular, affSplashCss : affSplashCss });
  };

  _getRestaurantsHead = function( address, menuUri, dateTime, render, data, isMobile, additQs, affRestCss ){
    if(isString(dateTime)){
      dateTime = '"'+dateTime+'"';
    }
    var hash = {path:this.path, data:JSON.stringify(data.restaurants), address:address, dateTime:dateTime, menu_uri:menuUri, render:render, isMobile : isMobile, additQs : additQs, affRestCss : affRestCss };
    return templates.restaurantsHead(hash);
  };

  _getSimpleRestaurantsHead = function(address, menuUri, dateTime){
    if(isString(dateTime)){
      dateTime = '"'+dateTime+'"';
    }
    return templates.restaurantsHead({path:this.path, address:address, dateTime:dateTime, menu_uri:menuUri, render:true});
  };

  _getConfirmHead = function(rid, address, dateTime, tray, tip, render, data){
    if(isString(dateTime)){
      dateTime = '"'+dateTime+'"';
    }
    return templates.confirmHead({path:this.path, rid:rid, data:JSON.stringify(data.restaurants), address:address, deliveryTime:dateTime, tray:tray, tip:tip, render:render});
  };

  _getSimpleConfirmHead = function(rid, address, dateTime, tray, tip){
    if(isString(dateTime)){
      dateTime = '"'+dateTime+'"';
    }
    return templates.confirmHead({path:this.path, rid:rid, address:address, deliveryTime:dateTime, tray:tray, tip:tip, render:true});
  };


  module.exports = function( path, ordrinApi ) { return new Html( path, ordrinApi); };
})();
