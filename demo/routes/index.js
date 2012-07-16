
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
  var deliverator = req.deliverator;
  deliverator.getData(req.params.rid, function(err, data){
    if(err){
      console.log(err);
    } else {
      var menu = deliverator.getMenu(data);
      var head = deliverator.getHead();
      res.render("menu", {data: JSON.stringify(data.menu), menu: menu, head: head});
    }
  });
};
