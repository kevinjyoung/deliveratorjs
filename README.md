# Readme

Deliverator is a node.js module for easily inserting [Mustard](https://github.com/ordrin/ordrin-client) powered menus into web pages.

## Quick Start

You can start using Deliverator on your node server in 6 easy steps:

1. Run `npm install deliverator`
2. Create a webpage that has at least the following elements:
   1. `{{{head}}}` inside of the `<head>`   
   2. The following `<div>` somewhere inside of the `<body>`:
  
      ```html
      <div id="ordrinMenu">
        {{{menu}}}
      </div>
      ```
3. In the main file for the server, do the following:
   1. Create a hash like the one in `demo/config.example.json`. We will assume this is in a variable called `options`
   2. Choose a base path from which Mustard files should be served. The only requirement is that it starts with a `/` and that no other routes are served from that url. We will assume that this is in the variable `path`.
   3. Instantiate deliverator with
   
      ```javascript
      var deliverator = require('deliverator')(path, options);
      ```
4. Add to the server the middlewares `deliverator.html.addHtml` and `deliverator.injector`
5. Set the view engine to Handlebars or Mustache
6. To render the template with deliverator's HTML, call
   ```javascript
   req.deliverator.render(res, rid, template, extra)
   ```