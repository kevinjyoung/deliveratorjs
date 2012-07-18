
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

/*
 * Menu page
 */

exports.menu = function(req, res){
  //req.deliverator.render(res, req.params.rid, "menu", {});

  req.deliverator.renderSimple(res, req.params.rid, "menu", {});
  
  // var deliverator = req.deliverator;
  // deliverator.getData(req.params.rid, function(err, data){
  //   if(err){
  //     console.log(err);
  //   } else {
  //     var menu = deliverator.getMenu(data);
  //     var head = deliverator.getHead(data);
  //     res.render("menu", {menu: menu, head: head});
  //   }
  // });
};
