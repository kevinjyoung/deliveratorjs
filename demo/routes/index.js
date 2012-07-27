
/*
 * GET home page.
 */

exports.index = function(req, res){
  var address = new req.deliverator.api.Address("1 Main Street", "College Station", "TX", "77840", "5555555555");
  var dateTime = "ASAP";
  //req.deliverator.renderRestaurantsSimple(res, "index", {}, address, "menu", dateTime);
  req.deliverator.renderRestaurants(res, "index", {}, address, "menu", dateTime, false);
};

/*
 * Menu page
 */

exports.menu = function(req, res){
  var address = new req.deliverator.api.Address("1 Main Street", "College Station", "TX", "77840", "5555555555");
  //req.deliverator.render(res, req.params.rid, "menu", {}, true, address);

  req.deliverator.renderSimple(res, req.params.rid, "menu", {}, address);
  
  // var deliverator = req.deliverator;
  // deliverator.getData(req.params.rid, function(err, data){
  //   if(err){
  //     console.log(err);
  //   } else {
  //     var menu = deliverator.getMenu(data);
  //     var head = deliverator.getHead(req.params.rid, data, address);
  //     res.render("menu", {menu: menu, head: head});
  //   }
  // });
};
