# Readme

Deliveratorjs is a node.js module for easily inserting [Mustard](https://github.com/ordrin/ordrin-client) powered menus into web pages.

## Quick Start

You can start using Deliveratorjs on your node server in *n* easy steps:

1. Run `npm install deliveratorjs`
2. Edit the webpage you want to change with the following things:
   1. `{{{head}}}` inside of the `<head>`
   2. A `<script>` tag with the following javascript inside of the `<head>`:
            ```javascript
            ordrin = typeof ordrin==="undefined"?{}:ordrin;
            ordrin.menu = {{{data}}};
            ordrin.render = false;```
  3. The following `<div>` somewhere inside of the `<body>`:
            ```html
            <div id="ordrinMenu">
              {{{menu}}}
            </div>```