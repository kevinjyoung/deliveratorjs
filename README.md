# Readme

Deliveratorjs is a node.js module for easily inserting [Mustard](https://github.com/ordrin/ordrin-client) powered menus into web pages.

## Quick Start

You can create a basic express server using deliverator with these four simple steps:

1. Create an express server in the folder you want to use with

    ```bash
    express myOrdrinApp
    cd myOrdrinApp
    npm install
    ```
     
2. Run `npm install deliveratorjs`
3. In `views/index.jade`, add `#ordrinMenu` to the content block, and in `views/layout.jade`, add `!{head}` to the `head` tag.
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
    
6. Change the body of the `index` function in `routes/index.js` to

    ```js
    req.deliverator.renderSimple(res, '141', "index", {title: 'Menu'});
    ```
    
The menu should appear on the index page that the express server is serving.