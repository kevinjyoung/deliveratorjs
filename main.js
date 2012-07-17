(function(){
  "use strict";
  function deliverator(options){
    var path = typeof options.path === "undefined" ? "/ordrin" : options.path;
    var Html = require("./lib/html.js");
    var injector = require("./lib/injector.js");
    return {html: new Html(path, options),
            injector : injector(path)};
  }
  module.exports = deliverator;
})();
