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
  _render, _renderSimple, _renderAddress, _renderRestaurants, _renderRestaurantsSimple, _renderConfirmSimple,
  _createAddress,
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
    this.getDefaultMenuMiddleware = _.bind( _getDefaultMenuMiddleware, this );
  }


  _getAnyHead = function get_any_head( templateName, data ) {
    // do the dateTime check (convert to string if ASAP, keep date as date)
    if( data.deliveryTime && isString(data.deliveryTime) ) {
      data.deliveryTime = '"' + data.deliveryTime + '"';
    }
    // attach the path
    data.path = this.path;

    return templates[ templateName ]( data );
  };


  // DATA PARAMS
  // details, data, rid, address, render, deliveryTime, confirmUrl, head_init, isMobile, extraCss
  _getHead = function get_head( data ) {
    return this.getAnyHead( 'head', data );
  };

  // DATA PARAMS
  // rid, address, deliveryTime, confirmUrl, isMobile, extraCss
  _getSimpleHead = function get_simple_head( data ) {
    // TODO figure out where these auto-set values go
    data.render = true;
    return this.getAnyHead( 'head', data );
  };

  // DATA PARAMS
  // isMobile, extraCss
  _getAddressHead = function get_address_head( data ) {
    data.render = true;
    return this.getAnyHead( 'addressHead', data );
  };

  // DATA PARAMS
  // data, address, deliveryTime, menu_uri, render, head_init, isMobile, extraCss
  _getRestaurantsHead = function get_restaurants_head( data ) {
    return this.getAnyHead( 'restaurantsHead', data );
  };

  // DATA PARAMS
  // address, deliveryTime, menu_uri
  _getSimpleRestaurantsHead = function get_simple_restaurants_head( data ) {
    data.render = true;
    return this.getAnyHead( 'restaurantsHead', data );
  };

  // DATA PARAMS
  // rid, data, address, deliveryTime, tray, tip, render
  _getConfirmHead = function get_confirm_head( data ) {
    return this.getAnyHead( 'confirmHead', data );
  };

  // DATA PARAMS
  // rid, address, deliveryTime, tray, tip
  _getSimpleConfirmHead = function get_simple_confirm_head( data ) {
    data.render = true;
    return this.getAnyHead( 'confirmHead', data );
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


  // params: rid, template, extra, renderMenu, address, deliveryTime, confirmUrl, extraCss
  _render = function ( res, params, cb ) {
    var self = this;
    this.getData( params.rid, function(err, data) {
      if(err){
        console.log(err);
        if( _.isFunction(cb) ) { cb( err ); }
      } else {
        if( params.renderMenu ){
          params.extra.menu = self.getMenu(data);
        }
        if( params.extra.head_init ) {
          data.head_init = _.map( params.extra.head_init, function(val, key) {
            return {name : key, val : val };
          });
        }
        var isMobile = params.extra.isMobile ? params.extra.isMobile : false;
        var extraCss = params.extra.aff_data ? params.extra.aff_data.affExtraCss : null;
        var templateData = {
          details       : JSON.stringify( data.details ),
          data          : JSON.stringify( data.menu ),
          rid           : params.rid,
          address       : JSON.stringify( params.address ),
          render        : ! params.renderMenu,
          deliveryTime  : params.deliveryTime,
          confirmUrl    : params.confirmUrl,
          head_init     : data.head_init,
          isMobile      : isMobile,
          extraCss      : extraCss
        };
        params.extra.head = self.getHead( templateData );
        res.render( params.template, params.extra );
        if( _.isFunction(cb) ) { cb( null ); }
      }
    });
  };

  // params: rid, template, extra, address, deliveryTime, confirmUrl
  _renderSimple = function render_simple( res, params ) {
    var isMobile = params.extra.isMobile ? params.extra.isMobile : false;
    var templateData = {
      rid           : params.rid,
      address       : JSON.stringify( params.address ),
      deliveryTime  : params.deliveryTime,
      confirmUrl    : params.confirmUrl,
      isMobile      : isMobile
    };
    params.extra.head = this.getSimpleHead( templateData );
    res.render( params.template, params.extra );
  };

  // params: rid, template, extra, address, deliveryTime, confirmUrl
  _renderAddress = function( res, params ) {
    var isMobile = params.extra.isMobile ? params.extra.isMobile : false;
    var extraMobCss = params.extra.aff_data ? params.extra.aff_data.affMobSplashCss : null;
    var head_init;
    if( params.extra.head_init ) {
      head_init = _.map( params.extra.head_init, function(val, key) {
        return {name : key, val : JSON.stringify(val) };
      });
    }
    var templateData = {
      isMobile      : isMobile,
      extraMobCss   : extraMobCss
      head_init     : head_init,
      deliveryTime  : params.deliveryTime,
    };
    params.extra.head = this.getAddressHead( templateData );
    res.render( params.template, params.extra );
  };

  // params: template, extra, address, menuUri, deliveryTime, renderList, filterRestaurants
  _renderRestaurants = function( res, params, cb ) {
    var self = this;
    this.getRestaurantList( params.address, params.deliveryTime, function(err, data){
      if(err){
        console.log(err);
        if( _.isFunction(cb) ) { cb( err ); }
      } else {
        if( _.isFunction( params.filterRestaurants ) ) {
          data = params.filterRestaurants( data );
        }
        if( data.restaurants.length === 0 ) {
          params.extra.hasNoRestaurants = true;
        }
        if( params.renderList ){
          var parameters = {};
          for(var prop in params.address){
            if( params.address.hasOwnProperty(prop) ){
              parameters[prop] = encodeURIComponent( params.address[prop] || '');
            }
          }
          parameters.deliveryTime = params.deliveryTime;
          parameters.menu_uri = params.menuUri;
          parameters.additQs  = params.extra.head_init ? params.extra.head_init.additQs : '';
          for(var i=0; i<data.restaurants.length; i++){
            data.restaurants[i].params = parameters;
          }
          params.extra.restaurants = self.getRestaurants(data);
        }
        if( params.extra.head_init ) {
          data.head_init = _.map( params.extra.head_init, function(val, key) {
            return {name : key, val : val };
          });
        }
        var isMobile = params.extra.isMobile ? params.extra.isMobile : false;
        var extraMobCss = params.extra.aff_data ? params.extra.aff_data.affMobRestCss : null;
        var templateData = {
          data : JSON.stringify( data.restaurants ),
          address : JSON.stringify( params.address ),
          deliveryTime : params.deliveryTime,
          menu_uri : params.menuUri,
          render : ! params.renderList,
          isMobile : isMobile,
          head_init : data.head_init,
          extraMobCss : extraMobCss
        };
        params.extra.head = self.getRestaurantsHead( templateData );
        res.render( params.template, params.extra );
        if( _.isFunction(cb) ) { cb( null ); }
      }
    });
  };

  // params: template, extra, address, menuUri, deliveryTime
  _renderRestaurantsSimple = function( res, params ) {
    var templateData = {
      address : JSON.stringify( params.address ),
      deliveryTime : params.deliveryTime,
      menu_uri : params.menuUri
    };
    params.extra.head = this.getSimpleRestaurantsHead( templateData );
    res.render( params.template, params.extra );
  };

  // params: rid, template, extra, address, deliveryTime, tray, tip
  _renderConfirmSimple = function( res, params ) {
    var templateData = {
      rid           : params.rid,
      address       : JSON.stringify( params.address ),
      deliveryTime  : params.deliveryTime,
      tray          : params.tray,
      tip           : params.tip
    };
    params.extra.head = this.getSimpleConfirmHead( templateData );
    res.render( params.template, params.extra );
  };


  _createAddress = function( req ) {
    var addr = req.param( 'addr' ),
      city = req.param( 'city' ),
      state = req.param( 'state' ),
      zip = req.param( 'zip' ),
      phone = req.param( 'phone' ),
      addr2 = req.param( 'addr2' );
    return new req.deliverator.api.Address( addr, city, state, zip, phone, addr2 );
  };

  _getDefaultConfirmMiddleware = function( template, render_server, extra ) {
    extra = typeof extra === "undefined" ? {} : extra;
    var self = this;
    return function html_default_confirm_middleware(req, res){
      var address;
      try{
        address = _createAddress( req );
      } catch(e) {
        console.log(e);
      }
      var deliveryTime = req.param("dateTime", "ASAP");
      var tray = req.param("tray");
      var tip = req.param("tip");
      var rid = req.param("rid");
      var params = {
        rid : rid,
        template : template,
        extra : extra,
        address : address,
        deliveryTime : deliveryTime,
        tray : tray,
        tip : tip
      };
      self.renderConfirmSimple( res, params );
    };
  };

  _getDefaultRestaurantListMiddleware = function( template, menuUri, render_server, extra ) {
    extra = typeof extra === "undefined" ? {} : extra;
    var self = this;
    return function html_default_restaurants_middleware(req, res){
      var address;
      try{
        address = _createAddress( req );
      } catch(e) {
        console.log(e);
      }
      var dateTime = req.param("time", "ASAP");
      var params = {
        template : template,
        extra : extra,
        address : address,
        menuUri : menuUri,
        deliveryTime : dateTime,
        renderList : true,
        filterRestaurants : null
      };
      if(render_server){
        self.renderRestaurants( res, params );
      } else {
        self.renderRestaurantsSimple( res, params );
      }
    };
  };

  _getDefaultMenuMiddleware = function( template, confirmUri, render_server, extra ) {
    extra = typeof extra === "undefined" ? {} : extra;
    var self = this;
    return function html_default_menu_middleware(req, res){
      var address;
      try{
        address = _createAddress( req );
      } catch(e) {
        console.log(e);
      }
      var dateTime = req.param("time", "ASAP");
      var params = {
        rid : req.params.rid,
        template: template,
        extra: extra,
        renderMenu : true,
        address : address,
        deliveryTime : dateTime,
        confirmUrl : confirmUrl
      };
      if(render_server){
        self.render( res, params );
      } else {
        self.renderSimple( res, params );
      }
    };
  };


  module.exports = function( path, ordrinApi ) { return new Html( path, ordrinApi); };
})();
