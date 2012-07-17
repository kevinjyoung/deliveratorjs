# Readme

Deliverator is a node.js module for easily inserting [Mustard](https://github.com/ordrin/ordrin-client) powered menus into web pages.

## Quick Start

You can start using Deliverator on your node server in 6 easy steps:

1. Run `npm install deliverator`
2. Create an express project.
3. Create a webpage that has at least the following elements:
   1. `{{{head}}}` inside of the `<head>`   
   2. The following `<div>` somewhere inside of the `<body>`:
  
      ```html
      <div id="ordrinMenu">
        {{{menu}}}
      </div>
      ```
4. In the main file for the server, do the following:
   1. Create a hash with your API key, like:
   
      ```javascript
      var options = {apiKey : "your API key here",
                     servers: "test"};
      ```
   2. Instantiate deliverator with
   
      ```javascript
      var deliverator = require('deliverator')(options);
      ```
5. Add deliverator to your middleware before `router`:

   ```javascript
   app.use(deliverator.html.addHtml);
   app.use(deliverator.injector);
   ```
6. To render the template with deliverator's HTML, call
   ```javascript
   req.deliverator.render(res, rid, template, extra)
   ```