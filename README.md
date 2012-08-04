# Deliveratorjs - a server for Mustard powered food ordering websites

Deliveratorjs is a node.js module for easily inserting [Mustard](https://github.com/ordrin/ordrin-client) powered menus into web pages.

## Installation
Install from npm with

```sh
npm install deliveratorjs
```

## Quick Start

You can create a basic express server using deliverator with these six simple steps:

0. Install [node.js](http://nodejs.org/#download), express (`npm install -g express`), and [git](http://git-scm.com/downloads).
1. Create an express server in the folder you want to use with

    ```bash
    express myOrdrinApp
    cd myOrdrinApp
    npm install
    ```
     
2. Run `npm install deliveratorjs`
3. Copy the contents of `node-modules/deliveratorjs/example` into `views`
4. In `app.js`, below the module dependencies, add the lines:
   
   ```js
   var options = {
     "apiKey" : "your API Key",
     "servers" : "test"
   }
   var deliverator = require("deliveratorjs")(options);
   ```

5. In `app.js`, add the following to the middlewares above `app.router`:

    ```js
    app.use(deliverator.html.addHtml);
    app.use(deliverator.injector);
    ```
    
6. In `app.js`, add the following lines after `app.get('/', routes.index);`:

    ```js
    app.get('/search', deliverator.html.getDefaultRestaurantListMiddleware("search", "/menu"));
    app.get('/menu/:rid', deliverator.html.getDefaultMenuMiddleware("menu"));
    ```
    
The menu should appear on the index page that the express server is serving.

## Usage
### Initialization

Deliverator takes the same initialization arguments as the [node Ordr.in wrapper](https://github.com/ordrin/api-node#initialization), with the additional argument `path`, which is a url path that deliverator will use that will not conflict with anything else and defaults to `"/ordrin"`. For example,

```js
var options = {
  apiKey = "YOUR-ORDRIN-API-KEY",
  restaurantUrl: "r.ordr.in",
  userUrl: "u.ordr.in",
  orderUrl: "o.ordr.in",
  path: "/deliverator"
}
var deliverator = require("deliveratorjs")(options);
```

### Middlewares

#### Injector

The injector middleware serves auxillary Deliverator requests made to URIs starting with `path` as set when initializing. It will act as a proxy to the [Ordr.in API](http://ordr.in/developers/api) by forwarding any request that starts with `/path/api`. For any other path starting with `/path`, it will try to serve the corresponding file in `node_modules/mustard`.