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

  _getAnyHead, _getHead, _getSimpleHead, _getAddressHead, _getRestaurantsHead, _getSimpleRestaurantsHead,
  _getConfirmHead, _getSimpleConfirmHead,
  _getMenu, _getRestaurants,
  _getData, _getRestaurantList,
  _addHtml,
  _render, _renderSimple, _renderAddress, _renderRestaurants, _renderRestaurantsSimple,
  _getDefaultConfirmMiddleware, _getDefaultRestaurantListMiddleware, _getDefaultMenuMiddleware;
  
  function isString(val){
    return typeof val === "string" || val instanceof String;
  }

  function Html(path, ordrinApi){
    this.api = ordrinApi;
    this.path = path;

    // get the <head> bits
    this.getAnyHead = _.bind( _getAnyHead, this );

    this.getHead = _.bind( _getHead, this );
    this.getSimpleHead = _.bind( _getSimpleHead, this );
    this.getAddressHead = _.bind( _getAddressHead, this );
    this.getRestaurantsHead = _.bind( _getRestaurantsHead, this );
    this.getSimpleRestaurantsHead = _.bind( _getSimpleRestaurantsHead, this );
    this.getConfirmHead = _.bind( _getConfirmHead, this );
    this.getSimpleConfirmHead = _.bind( _getSimpleConfirmHead, this );

    // use mustard templates to build menu or restaurant HTML
    this.getMenu = _.bind( _getMenu, this );
    this.getRestaurants = _.bind( _getRestaurants, this );

    // make calls to the ordr.in API to get rest. details & delivery list
    this.getData = _.bind( _getData, this );
    this.getRestaurantList = _.bind( _getRestaurantList, this );

    // expose rendering object
    this.addHtml = _.bind( _addHtml, this );

    // render full pages
    this.render = _.bind( _render, this );
    this.renderSimple = _.bind( _renderSimple, this );
    this.renderAddress = _.bind( _renderAddress, this );
    this.renderRestaurants = _.bind( _renderRestaurants, this );
    this.renderRestaurantsSimple = _.bind( _renderRestaurantsSimple, this );
    this.renderConfirmSimple = _.bind( _renderConfirmSimple, this );

    // middleware
    this.getDefaultConfirmMiddleware = _.bind( _getDefaultConfirmMiddleware, this );
    this.getDefaultRestaurantListMiddleware = _.bind( _getDefaultRestaurantListMiddleware, this );
    this.getDefaultMenuMiddleware = _.bind( getDefaultMenuMiddlewareGetter, this );
  }


  _getAnyHead = function get_any_head( templateName, data ) {
    // do the dateTime check (convert to string if ASAP, keep date as date)
    if( data.deliveryTime && isString(data.deliveryTime) ) {
      data.deliveryTime = '"' + data.deliveryTime + '"';
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


  // DATA PARAMS
  // details, data, rid, address, render, deliveryTime, confirmUrl, head_init, isMobile, affLogo, affTyHtml
  _getHead = function get_head( data ) {
    return this.getAnyHead( 'menu', data );
  };

  // DATA PARAMS
  // rid, address, deliveryTime, confirmUrl, isMobile, noAngular
  _getSimpleHead = function get_simple_head( data ) {
    // TODO figure out where these auto-set values go
    data.render = true;
    return this.getAnyHead( 'menu', data );
  };

  // DATA PARAMS
  // rid, address, deliveryTime, confirmUrl, isMobile, noAngular, extraCss
  _getAddressHead = function get_address_head( data ) {
    data.render = true;
    return this.getAnyHead( 'address', data );
  };

  // DATA PARAMS
  // data, address, deliveryTime, menu_uri, render, isMobile, additQs, extraCss
  _getRestaurantsHead = function get_restaurants_head( data ) {
    return this.getAnyHead( 'restaurants', data );
  };

  // DATA PARAMS
  // address, deliveryTime, menu_uri
  _getSimpleRestaurantsHead = function get_simple_restaurants_head( data ) {
    data.render = true;
    return this.getAnyHead( 'restaurants', data );
  };

  // DATA PARAMS
  // rid, data, address, deliveryTime, tray, tip, render
  _getConfirmHead = function get_confirm_head( data ) {
    return this.getAnyHead( 'confirm', data );
  };

  // DATA PARAMS
  // rid, address, deliveryTime, tray, tip
  _getSimpleConfirmHead = function get_simple_confirm_head( data ) {
    data.render = true;
    return this.getAnyHead( 'confirm', data );
  };
 
  _getMenu = function get_menu( data ) {
    return templates.menu( data );
  };

  _getRestaurants = function get_restaurants( data ) {
    return templates.restaurants( data );
  };

  _getData = function get_data( rid, cb ) {
    var data = {};
    this.api.restaurant.getDetails(rid, function(err, details){
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

  _getRestaurantList = function get_restaurant_list( address, dateTime, cb ) {
    this.api.restaurant.getDeliveryList(dateTime, address, function(err, data){
      if(err){
        cb(err, null);
      } else {
        cb(null, {restaurants:data});
      }
    });
  };

  _addHtml = function add_html( req, res, next ) {
    req.deliverator = this;
    next();
  };


  _render = function( res, rid, template, extra, renderMenu, address, deliveryTime, confirmUrl, cb) {
    var self = this;
    this.getData(rid, function(err, data){
      if(err){
        console.log(err);
        if( _.isFunction(cb) ) { cb( err ); }
      } else {
        if(renderMenu){
          data.address = address;
          data.deliveryTime = deliveryTime;
          data.confirmUrl = confirmUrl;
          extra.menu = self.getMenu(data);
        }
        if(extra.head_init) {
          data.head_init = _.map(extra.head_init, function(val, key) {
            return {name : key, val : val };
          });
        }
        var isMobile = extra.isMobile ? extra.isMobile : false;
        var affLogo = extra.aff_data ? extra.aff_data.affSmallLogoPath : '';
        var affTyHtml = extra.aff_data ? extra.aff_data.affThankyouHtml : '';
        // TODO make this more reasonable (template-side)
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
        extra.head = self.getHead( templateData );
        res.render(template, extra);
        if( _.isFunction(cb) ) { cb( null ); }
      }
    });
  };

  _renderSimple = function render_simple( res, rid, template, extra, address, dateTime, confirmUrl ) {
    var isMobile = extra.isMobile ? extra.isMobile : false;
    var noAngular = extra.noAngular ? extra.noAngular : false;
    var templateData = {
      rid           : rid,
      address       : JSON.stringify(address),
      deliveryTime  : dateTime,
      confirmUrl    : confirmUrl,
      isMobile      : isMobile,
      noAngular     : noAngular
    };
    extra.head = this.getSimpleHead( templateData );
    res.render(template, extra);
  };

  _renderAddress = function( res, rid, template, extra, address, dateTime, confirmUrl ) {
    var isMobile = extra.isMobile ? extra.isMobile : false;
    var noAngular = extra.noAngular ? extra.noAngular : false;
    var extraCss = extra.aff_data ? extra.aff_data.affSplashCss : null;
    var templateData = {
      rid           : rid,
      address       : JSON.stringify( address ),
      deliveryTime  : dateTime,
      confirmUrl    : confirmUrl,
      isMobile      : isMobile,
      noAngular     : noAngular,
      extraCss      : extraCss
    };
    extra.head = this.getAddressHead( templateData );
    res.render(template, extra);
  };

  _renderRestaurants = function( res, template, extra, address, menuUri, dateTime, renderList, filterRestaurants, additQs, cb ) {
    var self = this;
    this.getRestaurantList(address, dateTime, function(err, data){
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
          params.deliveryTime = dateTime;
          params.menu_uri = menuUri;
          params.additQs  = additQs;
          for(var i=0; i<data.restaurants.length; i++){
            data.restaurants[i].params = params;
          }
          extra.restaurants = self.getRestaurants(data);
        }
        var isMobile = extra.isMobile ? extra.isMobile : false;
        var extraCss = extra.aff_data ? extra.aff_data.affRestCss : null;
        var templateData = {
          data : JSON.stringify( data.restaurants ),
          address : JSON.stringify( address ),
          deliveryTime : dateTime,
          menu_uri : menuUri,
          render : !renderList,
          isMobile : isMobile,
          additQs : additQs,
          extraCss : extraCss
        };
        extra.head = self.getRestaurantsHead( templateData );
        res.render(template, extra);
        if( _.isFunction(cb) ) { cb( null ); }
      }
    });
  };

  _renderRestaurantsSimple = function( res, template, extra, address, menuUri, dateTime ) {
    var templateData = {
      address : JSON.stringify( address ),
      dateTime : dateTime,
      menu_uri : menuUri
    };
    extra.head = this.getSimpleRestaurantsHead( templateData );
    res.render(template, extra);
  };

  _renderConfirmSimple = function( res, rid, template, extra, address, dateTime, tray, tip ) {
    var templateData = {
      rid           : rid,
      address       : JSON.stringify( address ),
      deliveryTime  : dateTime,
      tray          : tray,
      tip           : tip
    };
    extra.head = this.getSimpleConfirmHead( templateData );
    res.render(template, extra);
  };


  _getDefaultConfirmMiddlewareGetter = function( template, render_server, extra ) {
    extra = typeof extra === "undefined" ? {} : extra;
    var self = this;
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
      self.renderConfirmSimple(res, rid, template, extra, address, dateTime, tray, tip);
    };
  };

  _getDefaultRestaurantListMiddleware = function( template, menuUri, render_server, extra ) {
    extra = typeof extra === "undefined" ? {} : extra;
    var self = this;
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
        self.renderRestaurants(res, template, extra, address, menuUri, dateTime, true);
      } else {
        self.renderRestaurantsSimple(res, template, extra, address, menuUri, dateTime);
      }
    };
  };

  _getDefaultMenuMiddleware = function( template, confirmUri, render_server, extra ) {
    extra = typeof extra === "undefined" ? {} : extra;
    var self = this;
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
        this.render(res, req.params.rid, template, extra, true, address, dateTime, confirmUri);
      } else {
        this.renderSimple(res, req.params.rid, template, extra, address, dateTime, confirmUri);
      }
    };
  };


  module.exports = function( path, ordrinApi ) { return new Html( path, ordrinApi); };
})();
