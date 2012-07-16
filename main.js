(function(){
  "use strict";
  function deliverator(path, options){
    var Html = require("./lib/html.js");
    var injector = require("./lib/injector.js");
    return {html: new Html(path, options),
            injector : injector(path)};
  }
  module.exports = deliverator;
})();
